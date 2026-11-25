import { sectionStates } from './guidedStudyData.js'

const dayMs = 86_400_000

export function scorePoints(scores) {
  const ordered = scores.filter(({ score_percentage, created_at }) => (
    Number.isFinite(score_percentage) && score_percentage >= 0 && score_percentage <= 100
    && Number.isFinite(Date.parse(created_at))
  )).sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id - b.id)

  return ordered.map((score, index) => ({
    ...score,
    x: ordered.length === 1 ? 50 : 100 * index / (ordered.length - 1),
    y: 100 - score.score_percentage,
  }))
}

export function sectionProgress(documents, documentId) {
  return documents.filter(({ id }) => !documentId || String(id) === String(documentId)).map((document) => {
    const states = Object.entries(sectionStates)
    const total = states.reduce((sum, [state]) => sum + (document[state] ?? 0), 0)
    return {
      id: document.id,
      title: document.title,
      total,
      segments: states.map(([state, label]) => ({
        state, label, count: document[state] ?? 0,
        percentage: total ? 100 * (document[state] ?? 0) / total : 0,
      })),
    }
  })
}

export function sevenDays(attempts, timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type).value)
  const today = Date.UTC(value('year'), value('month') - 1, value('day'))
  const entries = new Map(attempts.map((attempt) => [attempt.date, attempt]))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today - (6 - index) * dayMs).toISOString().slice(0, 10)
    return entries.get(date) ?? { date, initial: 0, retry: 0 }
  })
}
