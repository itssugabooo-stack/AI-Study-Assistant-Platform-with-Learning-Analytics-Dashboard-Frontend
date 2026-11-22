import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'
import { openPdf } from '../src/openPdf.js'
import { readRoute } from '../src/routes.js'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false },
})
after(() => server.close())

const storage = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => storage.get(key) ?? null,
    removeItem: (key) => storage.delete(key),
  },
})

const { getDocumentPdf } = await server.ssrLoadModule('/src/api/documents.js')
const { sessionExpiredEvent } = await server.ssrLoadModule('/src/api/client.js')

const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

test('fetches the original PDF bytes with header authentication and the supplied abort signal', async (t) => {
  storage.set('access_token', 'test-token')
  const { signal } = new AbortController()
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const target = new URL(url)
    assert.equal(target.pathname, '/documents/7/file')
    assert.equal(target.search, '')
    assert.equal(options.method ?? 'GET', 'GET')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.signal, signal)
    assert.equal(options.cache, 'no-store')
    return new Response(pdf)
  })
  const result = await getDocumentPdf(7, { signal })
  assert.ok(result instanceof Blob)
  assert.equal(result.type, 'application/pdf')
  assert.deepEqual(await result.bytes(), await pdf.bytes())
})

test('reports file HTTP status without reading or exposing the error body', async (t) => {
  let status = 409
  const readBody = t.mock.fn(async () => ({ detail: 'Private storage details' }))
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status, json: readBody, text: readBody, blob: readBody }))

  for (status of [409, 404, 502]) {
    await assert.rejects(getDocumentPdf(7), { status, message: 'We could not load the file.' })
  }
  assert.equal(readBody.mock.callCount(), 0)
})

test('a file 401 uses the existing session-expired handling', async (t) => {
  storage.set('access_token', 'expired-token')
  const originalWindow = globalThis.window
  const dispatchEvent = t.mock.fn()
  globalThis.window = { dispatchEvent }
  t.after(() => { globalThis.window = originalWindow })
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 401 }))
  await assert.rejects(getDocumentPdf(7), { status: 401 })
  assert.equal(localStorage.getItem('access_token'), null)
  assert.equal(dispatchEvent.mock.calls[0].arguments[0].type, sessionExpiredEvent)
})

function mockTab(t) {
  const tab = {
    closed: false,
    opener: {},
    document: { URL: 'about:blank', title: '', body: { textContent: '' } },
    location: { replace: t.mock.fn() },
    close: t.mock.fn(() => { tab.closed = true }),
  }
  const originalWindow = globalThis.window
  const open = t.mock.fn(() => tab)
  globalThis.window = { open }
  t.after(() => { globalThis.window = originalWindow })
  const watch = t.mock.method(globalThis, 'setInterval', () => 42)
  const stopWatching = t.mock.method(globalThis, 'clearInterval')
  const createUrl = t.mock.method(URL, 'createObjectURL', () => 'blob:https://study.test/pdf')
  const revokeUrl = t.mock.method(URL, 'revokeObjectURL')
  return { tab, open, watch, stopWatching, createUrl, revokeUrl }
}

test('opens the tab before fetching and keeps the object URL alive until the tab closes', async (t) => {
  const { tab, open, watch, stopWatching, createUrl, revokeUrl } = mockTab(t)
  const leave = new AbortController()
  const loadPdf = async () => {
    assert.deepEqual(open.mock.calls[0].arguments, ['about:blank', '_blank'])
    assert.equal(tab.opener, null)
    assert.equal(tab.document.title, 'Opening PDF...')
    assert.equal(tab.document.body.textContent, 'Opening PDF...')
    return pdf
  }
  assert.equal(await openPdf(loadPdf, leave.signal), 'opened')
  assert.equal(createUrl.mock.calls[0].arguments[0], pdf)
  assert.deepEqual(tab.location.replace.mock.calls[0].arguments, ['blob:https://study.test/pdf'])
  const checkTab = watch.mock.calls[0].arguments[0]
  leave.abort()
  checkTab()
  assert.equal(tab.closed, false)
  assert.equal(revokeUrl.mock.callCount(), 0)
  tab.closed = true
  checkTab()
  assert.deepEqual(revokeUrl.mock.calls[0].arguments, ['blob:https://study.test/pdf'])
  assert.deepEqual(stopWatching.mock.calls[0].arguments, [42])
})

test('an inaccessible placeholder document does not prevent PDF navigation', async (t) => {
  const { tab, watch } = mockTab(t)
  Object.defineProperty(tab, 'document', { get: () => { throw new DOMException('Blocked', 'SecurityError') } })
  assert.equal(await openPdf(() => Promise.resolve(pdf), new AbortController().signal), 'opened')
  assert.equal(tab.location.replace.mock.callCount(), 1)
  tab.closed = true
  watch.mock.calls[0].arguments[0]()
})

test('a blocked popup does not request the file', async (t) => {
  const { open, watch } = mockTab(t)
  open.mock.mockImplementation(() => null)
  const loadPdf = t.mock.fn()
  assert.equal(await openPdf(loadPdf, new AbortController().signal), 'blocked')
  assert.equal(loadPdf.mock.callCount(), 0)
  assert.equal(watch.mock.callCount(), 0)
})

test('closing the pending tab aborts the file request', async (t) => {
  const { tab, watch, stopWatching, createUrl } = mockTab(t)
  const loadPdf = t.mock.fn(({ signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  }))
  const pending = openPdf(loadPdf, new AbortController().signal)
  tab.closed = true
  watch.mock.calls[0].arguments[0]()
  assert.equal(await pending, 'closed')
  assert.equal(loadPdf.mock.calls[0].arguments[0].signal.aborted, true)
  assert.equal(createUrl.mock.callCount(), 0)
  assert.equal(stopWatching.mock.callCount(), 1)
})

test('leaving the document aborts and closes the pending tab even if the load resolves late', async (t) => {
  const { tab, stopWatching, createUrl } = mockTab(t)
  const leave = new AbortController()
  const loadPdf = t.mock.fn(() => Promise.resolve(pdf))
  const pending = openPdf(loadPdf, leave.signal)
  leave.abort()
  assert.equal(tab.closed, true)
  assert.equal(loadPdf.mock.calls[0].arguments[0].signal.aborted, true)
  assert.equal(await pending, 'cancelled')
  assert.equal(createUrl.mock.callCount(), 0)
  assert.equal(stopWatching.mock.callCount(), 1)
})

test('missing and invalid files close the blank tab instead of exposing a response', async (t) => {
  const { tab, createUrl, stopWatching } = mockTab(t)
  const { signal } = new AbortController()
  const missing = Object.assign(new Error('Private storage details'), { status: 409 })
  assert.equal(await openPdf(() => Promise.reject(missing), signal), 'missing')
  assert.equal(tab.closed, true)
  tab.closed = false
  const html = new Blob(['<html>Unexpected response</html>'], { type: 'text/html' })
  assert.equal(await openPdf(() => Promise.resolve(html), signal), 'failed')
  assert.equal(tab.closed, true)
  assert.equal(createUrl.mock.callCount(), 0)
  assert.equal(stopWatching.mock.callCount(), 2)
})

test('legacy text workspace URLs land on Summary', () => {
  const workspace = { page: 'document-workspace', workspace: true, documentId: '7', tool: 'summary' }
  assert.deepEqual(readRoute(new URL('https://study.test/library/7?tool=text')), workspace)
  assert.deepEqual(readRoute(new URL('https://study.test/library/7/text')), workspace)
  assert.equal(readRoute(new URL('https://study.test/library/7?tool=quiz')).tool, 'quiz')
})
