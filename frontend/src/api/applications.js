import axios from 'axios'

// Thin API wrapper for the Django Ninja backend. Components call these methods
// through TanStack Query so fetching, caching, and mutations stay predictable.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

function unwrap(response) {
  return response.data
}

export function getApiErrorMessage(error) {
  const detail = error?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || item.message).filter(Boolean).join(' ')
  }

  if (typeof detail === 'string') {
    return detail
  }

  if (typeof error?.response?.data === 'string') {
    return error.response.data
  }

  return error?.message || 'Something went wrong. Please try again.'
}

export const applicationsApi = {
  list: () => apiClient.get('/applications/').then(unwrap),
  get: (id) => apiClient.get(`/applications/${id}/`).then(unwrap),
  create: (data) => apiClient.post('/applications/', data).then(unwrap),
  update: (id, data) => apiClient.patch(`/applications/${id}/`, data).then(unwrap),
  submit: (id) => apiClient.post(`/applications/${id}/submit/`).then(unwrap),
  resubmit: (id) => apiClient.post(`/applications/${id}/resubmit/`).then(unwrap),
  startReview: (id) => apiClient.post(`/applications/${id}/start-review/`).then(unwrap),
  decision: (id, data) => apiClient.post(`/applications/${id}/decision/`, data).then(unwrap),
}
