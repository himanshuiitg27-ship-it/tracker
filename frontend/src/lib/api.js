const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }
  if (res.status === 204) return null
  let body = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const detail = typeof body?.detail === 'string' ? body.detail : 'Something went wrong. Please try again.'
    throw new ApiError(detail, res.status)
  }
  return body
}

const json = (method, data) => ({ method, body: JSON.stringify(data) })

export const api = {
  listPeriods: () => request('/api/periods'),
  createPeriod: (data) => request('/api/periods', json('POST', data)),
  updatePeriod: (id, data) => request(`/api/periods/${id}`, json('PUT', data)),
  deletePeriod: (id) => request(`/api/periods/${id}`, { method: 'DELETE' }),
  getStats: (today) => request(`/api/stats?today=${today}`),
  listSymptoms: () => request('/api/symptoms'),
  saveSymptom: (data) => request('/api/symptoms', json('PUT', data)),
  deleteSymptom: (id) => request(`/api/symptoms/${id}`, { method: 'DELETE' }),
}
