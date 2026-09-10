import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://13.48.59.24:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach team token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinespark_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Admin API instance — uses separate token
export const adminApi = axios.create({
  baseURL: `${API_BASE_URL.replace(/\/$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
})
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinespark_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Team Auth ────────────────────────────────────────────────────────────────
export const registerTeam  = (d) => api.post('/auth/register', d)
export const loginTeam     = (d) => api.post('/auth/login', d)
export const getMe         = ()  => api.get('/auth/me')

// ── Questions ────────────────────────────────────────────────────────────────
export const getCurrentQuestion = ()  => api.get('/questions/current')
export const submitAnswer       = (d) => api.post('/questions/answer', d)
export const useHint            = ()  => api.post('/questions/hint')
export const skipQuestion       = ()  => api.post('/questions/skip')
export const verifyBinary       = (d) => api.post('/questions/verify-binary', d)
export const reportTabSwitch    = ()  => api.post('/questions/tab-switch')

// ── Team ─────────────────────────────────────────────────────────────────────
export const getTransactions = () => api.get('/team/transactions')
export const getVault        = () => api.get('/team/vault')

// ── Event (public) ───────────────────────────────────────────────────────────
export const getEventStatus  = () => api.get('/event/status')

// ── Leaderboard (public) ─────────────────────────────────────────────────────
export const getLeaderboard  = () => api.get('/leaderboard')

// ── Admin Auth ────────────────────────────────────────────────────────────────
export const adminLogin      = (d) => adminApi.post('/admin/login', d)
export const getAdminMe      = ()  => adminApi.get('/admin/me')

// ── Admin Teams ───────────────────────────────────────────────────────────────
export const adminGetTeams         = ()        => adminApi.get('/admin/teams')
export const adminAdjustCoins      = (id, amt) => adminApi.patch(`/admin/teams/${id}/coins`, { amount: amt })
export const adminDeleteTeam       = (id)      => adminApi.delete(`/admin/teams/${id}`)
export const adminReinstateTeam    = (id)      => adminApi.patch(`/admin/teams/${id}/reinstate`)
// ── Admin Questions ───────────────────────────────────────────────────────────
export const adminGetQuestions     = ()     => adminApi.get('/admin/questions')
export const adminCreateQuestion   = (d)    => adminApi.post('/admin/questions', d)
export const adminUpdateQuestion   = (id,d) => adminApi.put(`/admin/questions/${id}`, d)
export const adminDeleteQuestion   = (id)   => adminApi.delete(`/admin/questions/${id}`)

// ── Admin Event ───────────────────────────────────────────────────────────────
export const adminGetEventStatus   = ()  => adminApi.get('/admin/event/status')
export const adminSetEventStatus   = (status, durationMinutes) => adminApi.post('/admin/event/status', { status, durationMinutes })

// ── Admin Leaderboard ─────────────────────────────────────────────────────────
export const adminGetLeaderboard   = ()  => adminApi.get('/admin/leaderboard')

export default api
