export const sectionStates = {
  practiced: 'Practiced',
  needs_review: 'Needs review',
  in_progress: 'In progress',
  not_started: 'Not started',
}

export function pageRange(start, end) {
  return start === end ? `Page ${start}` : `Pages ${start}-${end}`
}

export function draftStart(draft, index) {
  if (!index) return 1
  const end = Number(draft[index - 1].end_page)
  return Number.isSafeInteger(end) && end > 0 ? end + 1 : null
}

export function splitOutlineDraft(draft, index, key) {
  const row = draft[index]
  const start = draftStart(draft, index)
  const end = Number(row?.end_page)
  if (!row || row.locked || start === null || !Number.isSafeInteger(end) || end <= start || draft.length >= 300) return draft
  const midpoint = Math.floor((start + end) / 2)
  return [
    ...draft.slice(0, index), { ...row, end_page: midpoint },
    { key, title: `${row.title.trim().slice(0, 147) || 'Section'} (continued)`, end_page: end, locked: false },
    ...draft.slice(index + 1),
  ]
}

export function mergeOutlineDraft(draft, index) {
  const row = draft[index]
  const following = draft[index + 1]
  if (!row || !following || row.locked || following.locked) return draft
  return [...draft.slice(0, index), { ...row, end_page: following.end_page }, ...draft.slice(index + 2)]
}

export function buildOutlinePatch(draft, original, pageCount) {
  let start = 1
  const sections = draft.map(({ id, title, end_page }) => {
    const end = Number(end_page)
    if (!Number.isSafeInteger(end) || end < start || end > pageCount) {
      throw new Error('Each section must have a valid page range.')
    }
    if (!title.trim()) throw new Error('Give every section a title.')
    const section = { ...(id == null ? {} : { id }), title: title.trim(), start_page: start, end_page: end }
    start = end + 1
    return section
  })
  if (start !== pageCount + 1) throw new Error(`The outline must cover all ${pageCount} pages.`)

  const byId = new Map(sections.map((section) => [section.id, section]))
  for (const locked of original.filter(({ locked }) => locked)) {
    const updated = byId.get(locked.id)
    if (updated?.start_page !== locked.start_page || updated.end_page !== locked.end_page) {
      throw new Error('Page ranges for locked sections cannot change.')
    }
  }
  return { sections }
}

export function getPracticeView({ quiz, feedback }) {
  if (quiz && quiz.id !== feedback?.quiz_id) return { quiz, feedback: null }
  return { quiz: null, feedback: feedback ?? null }
}

export function buildQuizAnswers(questions, selected) {
  if (!questions.length) return null
  const answers = []
  for (const [index, { choices }] of questions.entries()) {
    const choice = selected[index]
    if (!Number.isInteger(choice) || choice < 0 || choice >= choices.length) return null
    answers.push({ question_index: index, selected_choice_index: choice })
  }
  return answers
}
