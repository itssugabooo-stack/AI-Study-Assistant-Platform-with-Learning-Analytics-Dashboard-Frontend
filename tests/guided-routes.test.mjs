import assert from 'node:assert/strict'
import { test } from 'node:test'
import { documentPath, readRoute, readReturnPath } from '../src/routes.js'

const url = (path) => new URL(path, 'https://study.test')

test('plain document opening changes default only when guided study is enabled', () => {
  assert.equal(documentPath(7), '/library/7')
  assert.equal(readRoute(url(documentPath(7)), true).tool, 'study')
  assert.equal(readRoute(url(documentPath(7)), false).tool, 'summary')
  assert.equal(documentPath(7, 'summary', true), '/library/7?tool=summary')
  assert.equal(documentPath(7, 'summary', false), '/library/7')
})

test('legacy document deep links stay on the requested tool in both modes', () => {
  for (const enabled of [true, false]) {
    for (const tool of ['summary', 'flashcards', 'quiz', 'roadmap']) {
      assert.equal(readRoute(url('/library/7?tool=' + tool), enabled).tool, tool)
    }
    assert.equal(readRoute(url('/library/7?tool=text'), enabled).tool, 'summary')
    assert.equal(readRoute(url('/library/7/text?tool=study'), enabled).tool, 'summary')
    assert.equal(readRoute(url('/library/7?tool=unknown'), enabled).tool, 'summary')
  }
})

test('study targets round-trip, ignoring invalid or orphaned part identifiers', async () => {
  const { studyPath } = await import('../src/routes.js')
  const path = studyPath(7, 3, 29)
  assert.equal(path, '/library/7?tool=study&section=3&part=29')
  assert.deepEqual(readRoute(url(path), true), {
    page: 'document-workspace', workspace: true, documentId: '7', tool: 'study', sectionId: '3', partId: '29',
  })
  assert.equal(readRoute(url(path), false).tool, 'summary')
  assert.equal(readRoute(url('/library/7?tool=study&part=29'), true).partId, null)
  assert.equal(readRoute(url('/library/7?tool=study&section=3&part=-1'), true).partId, null)
  assert.equal(readReturnPath(url('/sign-in?' + new URLSearchParams({ next: path }))), path)
})

test('guided flag is explicitly enabled in production and defaults on in development', async () => {
  const { isGuidedStudyEnabled } = await import('../src/guidedStudyFlag.js')
  assert.equal(isGuidedStudyEnabled({}), false)
  assert.equal(isGuidedStudyEnabled({ DEV: false, VITE_GUIDED_STUDY_ENABLED: 'true' }), true)
  assert.equal(isGuidedStudyEnabled({ DEV: true }), true)
  assert.equal(isGuidedStudyEnabled({ DEV: true, VITE_GUIDED_STUDY_ENABLED: 'false' }), false)
})
