const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

let accessToken = localStorage.getItem('academia_api_access_token') || ''

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token) {
  accessToken = token || ''

  if (accessToken) {
    localStorage.setItem('academia_api_access_token', accessToken)
  } else {
    localStorage.removeItem('academia_api_access_token')
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao comunicar com a API')
  }

  return data
}

async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
