import { apiGet } from './client'

export function getMyAnalytics(options) {
  return apiGet('/analytics/me', options)
}
