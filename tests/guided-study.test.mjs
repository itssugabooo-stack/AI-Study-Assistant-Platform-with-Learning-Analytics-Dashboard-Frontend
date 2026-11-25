import assert from 'node:assert/strict'
import { test } from 'node:test'

const original = [
  { id: 1, title: 'Intro', start_page: 1, end_page: 2, locked: true, parts: [{ id: 8 }] },
  { id: 2, title: 'Chapter two', start_page: 3, end_page: 6, locked: false },
  { id: 3, title: 'Chapter three', start_page: 7, end_page: 10, locked: false },
]

test('outline editor sends the complete partition, deriving starts from shared boundaries', async () => {
  const { buildOutlinePatch } = await import('../src/guidedStudyData.js')
  const edited = original.map((section) => ({ ...section }))
  edited[1].title = '  New title  '
  edited[1].end_page = '5'
  assert.deepEqual(buildOutlinePatch(edited, original, 10), { sections: [
    { id: 1, title: 'Intro', start_page: 1, end_page: 2 },
    { id: 2, title: 'New title', start_page: 3, end_page: 5 },
    { id: 3, title: 'Chapter three', start_page: 6, end_page: 10 },
  ] })
})

test('outline validation rejects empty sections, uncovered pages and changed locked bounds', async () => {
  const { buildOutlinePatch } = await import('../src/guidedStudyData.js')
  const changed = (index, fields) => original.map((section, i) => i === index ? { ...section, ...fields } : section)
  assert.throws(() => buildOutlinePatch(changed(1, { end_page: '' }), original, 10), /page range/i)
  assert.throws(() => buildOutlinePatch(changed(1, { end_page: 2 }), original, 10), /page range/i)
  assert.throws(() => buildOutlinePatch(changed(2, { end_page: 9 }), original, 10), /all 10 pages/i)
  assert.throws(() => buildOutlinePatch(changed(0, { end_page: 3 }), original, 10), /locked/i)
  assert.throws(() => buildOutlinePatch(original.slice(1), original, 10), /locked/i)
})

test('a pending retry cannot display feedback from the previous quiz', async () => {
  const { getPracticeView } = await import('../src/guidedStudyData.js')
  const quiz = { id: 2, kind: 'retry', questions: [{ question: '?', choices: ['A', 'B'] }] }
  const prior = { quiz_id: 1 }
  assert.deepEqual(getPracticeView({ quiz, feedback: prior }), { quiz, feedback: null })
  assert.deepEqual(getPracticeView({ quiz, feedback: { quiz_id: 2 } }), { quiz: null, feedback: { quiz_id: 2 } })
  assert.deepEqual(getPracticeView({ quiz: null, feedback: prior }), { quiz: null, feedback: prior })
})

test('split and merge can resize an unlocked range without affecting the locked neighbor', async () => {
  const { buildOutlinePatch, splitOutlineDraft, mergeOutlineDraft } = await import('../src/guidedStudyData.js')
  assert.equal(splitOutlineDraft(original, 0, 'new'), original)
  assert.equal(mergeOutlineDraft(original, 0), original)
  const split = splitOutlineDraft(original, 1, 'new')
  assert.deepEqual(buildOutlinePatch(split, original, 10).sections.map(({ id, start_page, end_page }) => [id, start_page, end_page]), [
    [1, 1, 2], [2, 3, 4], [undefined, 5, 6], [3, 7, 10],
  ])
  const merged = mergeOutlineDraft(split, 1)
  assert.deepEqual(buildOutlinePatch(merged, original, 10), buildOutlinePatch(original, original, 10))
})

test('submission includes every zero-based answer, never an unanswered or invalid choice', async () => {
  const { buildQuizAnswers } = await import('../src/guidedStudyData.js')
  const questions = [{ choices: ['A', 'B'] }, { choices: ['C', 'D'] }]
  assert.equal(buildQuizAnswers(questions, { 0: 0 }), null)
  assert.equal(buildQuizAnswers(questions, { 0: 0, 1: 2 }), null)
  assert.deepEqual(buildQuizAnswers(questions, { 0: 0, 1: 1 }), [
    { question_index: 0, selected_choice_index: 0 }, { question_index: 1, selected_choice_index: 1 },
  ])
})
