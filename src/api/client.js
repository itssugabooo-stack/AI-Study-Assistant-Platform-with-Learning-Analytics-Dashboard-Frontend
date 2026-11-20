const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://studypilot-mamn.onrender.com'

export default API_BASE_URL
export const sessionExpiredEvent = 'studypilot:session-expired'

export function getToken() {
  return localStorage.getItem('access_token')
}

export function setToken(token) {
  localStorage.setItem('access_token', token)
}

export function removeToken() {
  localStorage.removeItem('access_token')
}

async function readResponse(response, signal) {
  if (response.ok) return response.json()

  let message = `Request failed (${response.status}).`
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') message = data.detail
  } catch {
    signal?.throwIfAborted()
  }

  const error = new Error(message)
  error.status = response.status
  throw error
}

async function request(path, options, auth) {
  const token = auth ? getToken() : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 401 && token && getToken() === token && !options.signal?.aborted) {
    removeToken()
    window.dispatchEvent(new Event(sessionExpiredEvent))
  }

  return readResponse(response, options.signal)
}

export function apiGet(path, { signal } = {}) {
  return request(path, { signal }, true)
}

export function apiPost(path, data, { auth = true, signal } = {}) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  }, auth)
}
