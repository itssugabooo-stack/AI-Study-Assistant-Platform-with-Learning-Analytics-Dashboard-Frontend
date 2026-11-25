import assert from 'node:assert/strict'
import { test } from 'node:test'

test('score chart uses valid real attempts in chronological order, including a real zero', async () => {
  const { scorePoints } = await import('../src/studyCharts.js')
  const points = scorePoints([
    { id: 2, created_at: '2026-11-23T12:00:00Z', score_percentage: 80 },
    { id: 1, created_at: '2026-11-22T12:00:00Z', score_percentage: 0 },
    { id: 5, created_at: '2026-11-21T12:00:00Z', score_percentage: null },
    { id: 6, created_at: 'bad', score_percentage: 40 },
    { id: 7, created_at: '2026-11-21T12:00:00Z', score_percentage: 110 },
  ])
  assert.deepEqual(points.map(({ id, x, y }) => [id, x, y]), [[1, 0, 100], [2, 100, 20]])
  assert.equal(scorePoints([points[0]])[0].x, 50)
  assert.deepEqual(scorePoints([]), [])
})

test('section segments retain actual counts and filter only the selected document', async () => {
  const { sectionProgress } = await import('../src/studyCharts.js')
  const rows = sectionProgress([
    { id: 1, not_started: 2, in_progress: 1, needs_review: 1, practiced: 4 },
    { id: 2, not_started: 0, in_progress: 0, needs_review: 0, practiced: 0 },
  ], '1')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].total, 8)
  assert.deepEqual(rows[0].segments.map(({ state, count, percentage }) => [state, count, percentage]), [
    ['practiced', 4, 50], ['needs_review', 1, 12.5], ['in_progress', 1, 12.5], ['not_started', 2, 25],
  ])
  assert.ok(sectionProgress([{ id: 2 }])[0].segments.every(({ percentage }) => percentage === 0))
})

test('daily attempts fill calendar gaps across months in the requested timezone', async () => {
  const { sevenDays } = await import('../src/studyCharts.js')
  const rows = sevenDays([
    { date: '2026-10-28', initial: 2, retry: 1 },
    { date: '2026-11-02', initial: 1, retry: 0 },
    { date: '2026-10-26', initial: 10, retry: 0 },
  ], 'Asia/Bangkok', new Date('2026-11-01T19:00:00Z'))
  assert.equal(rows.length, 7)
  assert.deepEqual(rows[0], { date: '2026-10-27', initial: 0, retry: 0 })
  assert.deepEqual(rows[1], { date: '2026-10-28', initial: 2, retry: 1 })
  assert.deepEqual(rows[6], { date: '2026-11-02', initial: 1, retry: 0 })
})
