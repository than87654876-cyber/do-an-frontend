import api from './http'

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  forgotPassword: (email, newPassword) => api.post('/auth/forgot-password', { email, newPassword }),
}