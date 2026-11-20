import { apiGet, apiPost, removeToken, setToken } from './client'

export async function loginUser(email, password, { signal } = {}) {
  const data = await apiPost('/auth/login', { email, password }, { auth: false, signal })
  signal?.throwIfAborted()

  if (typeof data?.access_token !== 'string' || !data.access_token) {
    throw new Error('The service returned an incomplete sign-in response.')
  }

  setToken(data.access_token)
  return data
}

export function registerUser(email, fullName, password, { signal } = {}) {
  return apiPost('/users/register', {
    email,
    full_name: fullName,
    password,
  }, { auth: false, signal })
}

export function getCurrentUser(options) {
  return apiGet('/users/me', options)
}

export function logoutUser() {
  removeToken()
}
