import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const BASE_URL = 'http://192.168.100.167:5000/api'

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 })

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn
}

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login') && onUnauthorized) {
      onUnauthorized()
    }
    return Promise.reject(error)
  }
)

export const getErrorMessage = (error, fallback = 'Có lỗi xảy ra, vui lòng thử lại') => {
  if (!error.response) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra backend đang chạy và địa chỉ IP trong api.js'
  }
  return error.response.data?.message || fallback
}

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
}

export const walletApi = {
  getAll: () => api.get('/wallets'),
  create: (data) => api.post('/wallets', data),
  update: (id, data) => api.put(`/wallets/${id}`, data),
  delete: (id) => api.delete(`/wallets/${id}`),
  transfer: (data) => api.post('/wallets/transfer', data),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
}

export const transactionApi = {
  getAll: (params = {}) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  delete: (id) => api.delete(`/transactions/${id}`),
}

export const budgetApi = {
  getAll: () => api.get('/budgets'),
  create: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

export const goalApi = {
  getAll: () => api.get('/savings-goals'),
  create: (data) => api.post('/savings-goals', data),
  updateProgress: (id, amount) => api.put(`/savings-goals/${id}/progress`, { amount }),
  delete: (id) => api.delete(`/savings-goals/${id}`),
}

export const reportApi = {
  getSummary: (year) => api.get('/reports/summary', { params: { year } }),
}

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
}

export const accountApi = {
  getProfile: () => api.get('/account/profile'),
  updateProfile: (data) => api.put('/account/profile', data),
  changePassword: (currentPassword, newPassword) =>
    api.put('/account/password', { currentPassword, newPassword }),
}

export default api