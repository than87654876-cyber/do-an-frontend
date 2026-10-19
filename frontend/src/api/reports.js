import api from './http'

export const reportApi = {
  getSummary: (year) => api.get('/reports/summary', { params: { year } }),
}
