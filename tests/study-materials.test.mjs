import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false },
})
after(() => server.close())

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: () => 'test-token' },
})

const { getStudyMaterials, generateSummary, generateQuiz } = await server.ssrLoadModule('/src/api/ai.js')
const { uploadDocument } = await server.ssrLoadModule('/src/api/documents.js')
const { apiGet } = await server.ssrLoadModule('/src/api/client.js')

test('uses friendly fallbacks for rate limits without detail and non-JSON errors', async (t) => {
  const responses = [
    Response.json({ error: 'Raw provider quota details' }, { status: 429 }),
    new Response('<html>Internal server error</html>', { status: 502 }),
  ]
  t.mock.method(globalThis, 'fetch', async () => responses.shift())

  await assert.rejects(apiGet('/example'), { status: 429, message: 'Too many requests. Please try again later.' })
  await assert.rejects(apiGet('/example'), { status: 502, message: 'We could not complete your request. Please try again.' })
})

test('loads saved materials with an authenticated, cancellable GET', async (t) => {
  const materials = {
    summary: { summary: 'What to study' },
    flashcards: { flashcards: [{ question: 'What?', answer: 'This' }] },
    quiz: { quiz_id: 3, questions: [{ question: 'Which?', choices: ['A', 'B'] }] },
    roadmap: null,
  }
  const { signal } = new AbortController()
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).pathname, '/ai/documents/7/study-materials')
    assert.equal(options.method ?? 'GET', 'GET')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.signal, signal)
    return Response.json(materials)
  })
  assert.deepEqual(await getStudyMaterials(7, { signal }), materials)
})

test('keeps generator URLs and distinguishes preparation errors from rate limits', async (t) => {
  const responses = [
    ['/ai/documents/7/summary', 422, { code: 'no_selectable_text', message: 'No text' }],
    ['/ai/documents/7/quiz', 422, { code: 'pdf_extraction_failed', message: 'Failed to parse' }],
    ['/ai/documents/7/summary', 409, 'PDF missing'],
    ['/ai/documents/7/summary', 429, 'Provider quota details'],
  ]
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const [path, status, detail] = responses.shift()
    assert.equal(new URL(url).pathname, path)
    assert.equal(options.method, 'POST')
    return Response.json({ detail }, { status })
  })
  await assert.rejects(generateSummary(7), { status: 422, code: 'no_selectable_text' })
  await assert.rejects(generateQuiz(7), { status: 422, code: 'pdf_extraction_failed' })
  await assert.rejects(generateSummary(7), { status: 409, message: 'PDF missing' })
  await assert.rejects(generateSummary(7), { status: 429 })
  assert.equal(responses.length, 0)
})

test('returns preparation outcomes from the completed upload response', async (t) => {
  const file = new File(['PDF'], 'notes.pdf', { type: 'application/pdf' })
  let document
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).pathname, '/documents/upload')
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, 'Bearer test-token')
    assert.equal(options.body.get('file').name, file.name)
    assert.equal(new Headers(options.headers).has('Content-Type'), false)
    return Response.json(document, { status: 201 })
  })
  for (const status of ['processed', 'no_text', 'extraction_failed']) {
    document = { id: 7, processing_status: status, has_extracted_text: status === 'processed' }
    assert.deepEqual(await uploadDocument(file), document)
  }
})

test('does not send a PDF if the session token is missing', async (t) => {
  t.mock.method(localStorage, 'getItem', () => null)
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}))
  const file = new File(['PDF'], 'private.pdf', { type: 'application/pdf' })
  await assert.rejects(uploadDocument(file), { status: 401 })
  assert.equal(fetch.mock.callCount(), 0)
})
