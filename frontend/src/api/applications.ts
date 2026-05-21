import axios, { AxiosError } from 'axios'

// Centralized Axios client for the frontend. Keeping the base URL and JSON
// headers here avoids duplicating transport setup across the app.
const apiClient = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Normalizes Axios responses so callers receive the response payload directly.
function unwrap(response: any) {
  return response.data
}

// Converts backend validation and transport errors into a user-friendly string.
export function getApiErrorMessage(error: unknown): string {
  const err = error as AxiosError<any> | any
  const detail = err?.response?.data?.detail

  if (Array.isArray(detail)) {
    return detail.map((item: any) => item.msg || item.message).filter(Boolean).join(' ')
  }

  if (typeof detail === 'string') {
    return detail
  }

  if (typeof err?.response?.data === 'string') {
    return err.response.data
  }

  return err?.message || 'Something went wrong. Please try again.'
}

// Application endpoints used by the form, list, and review flows.
export const applicationsApi = {
  list: (): Promise<any> => apiClient.get('/applications/').then(unwrap),
  get: (id: string | number): Promise<any> => apiClient.get(`/applications/${id}/`).then(unwrap),
  create: (data: any): Promise<any> => apiClient.post('/applications/', data).then(unwrap),
  update: (id: string | number, data: any): Promise<any> => apiClient.patch(`/applications/${id}/`, data).then(unwrap),
  submit: (id: string | number): Promise<any> => apiClient.post(`/applications/${id}/submit/`).then(unwrap),
  resubmit: (id: string | number): Promise<any> => apiClient.post(`/applications/${id}/resubmit/`).then(unwrap),
  startReview: (id: string | number): Promise<any> => apiClient.post(`/applications/${id}/start-review/`).then(unwrap),
  decision: (id: string | number, data: any): Promise<any> => apiClient.post(`/applications/${id}/decision/`, data).then(unwrap),
}
