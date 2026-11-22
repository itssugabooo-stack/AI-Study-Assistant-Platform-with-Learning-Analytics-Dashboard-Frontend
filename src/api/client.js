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

  let message = response.status === 429
    ? 'Too many requests. Please try again later.'
    : 'We could not complete your request. Please try again.'
  let code
  try {
    const { detail } = await response.json()
    if (typeof detail === 'string' && detail.trim()) message = detail
    if (typeof detail?.message === 'string' && detail.message.trim()) message = detail.message
    if (typeof detail?.code === 'string') code = detail.code
  } catch {
    signal?.throwIfAborted()
  }

  const error = new Error(message)
  error.status = response.status
  if (code) error.code = code
  throw error
}

async function readBlobResponse(response, signal) {
  signal?.throwIfAborted()
  if (!response.ok) {
    const error = new Error('We could not load the file.')
    error.status = response.status
    throw error
  }
  return response.blob()
}

async function request(path, options, auth, read = readResponse) {
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

  return read(response, options.signal)
}

export function apiGet(path, { signal } = {}) {
  return request(path, { signal }, true)
}

export function apiGetBlob(path, { signal } = {}) {
  return request(path, { signal, cache: 'no-store' }, true, readBlobResponse)
}

export function apiPost(path, data, { auth = true, signal } = {}) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal,
  }, auth)
}

export function apiPostForm(path, body) {
  return request(path, { method: 'POST', body }, true)
}
