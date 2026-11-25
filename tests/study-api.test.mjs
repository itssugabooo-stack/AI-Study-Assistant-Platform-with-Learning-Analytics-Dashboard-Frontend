import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true, ws: false },
})
after(() => server.close())

const study = await server.ssrLoadModule('/src/api/study.js')

test('guided API uses authenticated methods, snake_case bodies and a cancellable request', async (t) => {
  const { signal } = new AbortController()
  const options = { signal }
  const partition = { sections: [{ id: 8, title: 'Opening', start_page: 1, end_page: 10 }] }
  const answers = [{ question_index: 0, selected_choice_index: 0 }]
  t.mock.method(globalThis, 'fetch', async (url, request) => {
    assert.equal(request.headers.Authorization, 'Bearer study-token')
    assert.equal(request.signal, signal)
    const parsed = new URL(url)
    return Response.json([
      request.method ?? 'GET', parsed.pathname + parsed.search, request.body ? JSON.parse(request.body) : null,
    ])
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: { getItem: () => 'study-token' },
  })

  assert.deepEqual(await study.getStudyOutline(7, options), ['GET', '/documents/7/study', null])
  assert.deepEqual(await study.prepareStudyOutline(7, options), ['POST', '/documents/7/study/prepare', null])
  assert.deepEqual(await study.updateStudyOutline(7, partition, options), ['PATCH', '/documents/7/study/sections', partition])
  assert.deepEqual(await study.prepareStudySection(8, options), ['POST', '/study/sections/8/prepare', null])
  assert.deepEqual(await study.getStudyPart(9, options), ['GET', '/study/parts/9', null])
  assert.deepEqual(await study.generateStudyLesson(9, options), ['POST', '/study/parts/9/lesson', null])
  assert.deepEqual(await study.generateStudyQuiz(9, false, options), ['POST', '/study/parts/9/practice', { retry: false }])
  assert.deepEqual(await study.generateStudyQuiz(9, true, options), ['POST', '/study/parts/9/practice', { retry: true }])
  assert.deepEqual(await study.submitStudyQuiz(10, answers, options), ['POST', '/study/quizzes/10/submit', { answers }])
  assert.deepEqual(await study.getStudyAnalytics({ ...options, timezone: 'Asia/Bangkok' }), ['GET', '/analytics/study?timezone=Asia%2FBangkok', null])
  assert.deepEqual(await study.getStudyAnalytics({ ...options, documentId: 7, timezone: 'Asia/Bangkok' }), ['GET', '/analytics/study?timezone=Asia%2FBangkok&document_id=7', null])
})
