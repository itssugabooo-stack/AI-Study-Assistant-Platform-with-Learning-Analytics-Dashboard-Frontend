import { apiGet, apiPatch, apiPost } from './client'

const outlinePath = (id) => `/documents/${encodeURIComponent(id)}/study`
const partPath = (id) => `/study/parts/${encodeURIComponent(id)}`

export const getStudyOutline = (id, options) => apiGet(outlinePath(id), options)
export const prepareStudyOutline = (id, options) => apiPost(`${outlinePath(id)}/prepare`, undefined, options)
export const updateStudyOutline = (id, partition, options) => apiPatch(`${outlinePath(id)}/sections`, partition, options)
export const prepareStudySection = (id, options) => apiPost(`/study/sections/${encodeURIComponent(id)}/prepare`, undefined, options)
export const getStudyPart = (id, options) => apiGet(partPath(id), options)
export const generateStudyLesson = (id, options) => apiPost(`${partPath(id)}/lesson`, undefined, options)
export const generateStudyQuiz = (id, retry, options) => apiPost(`${partPath(id)}/practice`, { retry }, options)
export const submitStudyQuiz = (id, answers, options) => apiPost(`/study/quizzes/${encodeURIComponent(id)}/submit`, { answers }, options)

export function getStudyAnalytics({ documentId, timezone, signal }) {
  const query = new URLSearchParams({ timezone })
  if (documentId) query.set('document_id', documentId)
  return apiGet(`/analytics/study?${query}`, { signal })
}
