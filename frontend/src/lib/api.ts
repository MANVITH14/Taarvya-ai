/**
 * Typed API client for Taarvya AI backend.
 * All backend calls go through this client — no API keys in frontend.
 */
import axios from 'axios'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.port === '5173' || window.location.port === '3000') {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }
    return ''
  }
  return 'http://localhost:8000'
}

const BASE_URL = getBaseUrl()

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // for refresh cookie
})

// Attach access token from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
        const newToken = data.access_token
        localStorage.setItem('access_token', newToken)
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (err) {
        processQueue(err)
        localStorage.removeItem('access_token')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

// ============================================================
// AUTH ENDPOINTS
// ============================================================
export interface LoginRequest { email: string; password: string }
export interface RegisterRequest { email: string; password: string; full_name: string; preferred_language?: string }
export interface AuthResponse { access_token: string; token_type: string; user: UserProfile }
export interface UserProfile {
  id: string
  email: string
  full_name: string
  preferred_language: string
  is_verified: boolean
  created_at: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  logout: () => apiClient.post('/auth/logout').then((r) => r.data),
  refresh: () => apiClient.post<AuthResponse>('/auth/refresh').then((r) => r.data),
  me: () => apiClient.get<UserProfile>('/auth/me').then((r) => r.data),
  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password-reset/request', { email }).then((r) => r.data),
  confirmPasswordReset: (token: string, password: string) =>
    apiClient.post('/auth/password-reset/confirm', { token, password }).then((r) => r.data),
  deleteAccount: () => apiClient.delete('/auth/account').then((r) => r.data),
  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.patch<UserProfile>('/auth/me', data).then((r) => r.data),
}

// ============================================================
// GEOCODING
// ============================================================
export interface PlaceResult {
  display_name: string
  short_name: string
  latitude: number
  longitude: number
  timezone: string
  country: string
  state: string
}

export const geocodeApi = {
  search: (query: string) =>
    apiClient.get<PlaceResult[]>('/geocode/search', { params: { q: query } }).then((r) => r.data),
  resolve: (place_name: string) =>
    apiClient.post<PlaceResult>('/geocode/resolve', { place_name }).then((r) => r.data),
}

// ============================================================
// BIRTH PROFILES
// ============================================================
export interface BirthProfileCreate {
  name: string
  date_of_birth: string   // YYYY-MM-DD
  time_of_birth?: string  // HH:MM
  time_unknown: boolean
  birthplace_name: string
  latitude: number
  longitude: number
  timezone_str: string
  gender?: string
  notes?: string
}

export interface BirthProfile {
  id: string
  name: string
  date_of_birth: string
  time_of_birth?: string
  time_unknown: boolean
  birthplace_name: string
  latitude: number
  longitude: number
  timezone_str: string
  gender?: string
  notes?: string
  is_primary: boolean
  cached_chart?: ChartData
  created_at: string
}

export const profileApi = {
  list: () => apiClient.get<BirthProfile[]>('/profiles').then((r) => r.data),
  get: (id: string) => apiClient.get<BirthProfile>(`/profiles/${id}`).then((r) => r.data),
  create: (data: BirthProfileCreate) =>
    apiClient.post<BirthProfile>('/profiles', data).then((r) => r.data),
  update: (id: string, data: Partial<BirthProfileCreate>) =>
    apiClient.patch<BirthProfile>(`/profiles/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/profiles/${id}`).then((r) => r.data),
  setPrimary: (id: string) => apiClient.post(`/profiles/${id}/set-primary`).then((r) => r.data),
}

// ============================================================
// CHART CALCULATIONS
// ============================================================
export interface PlanetPosition {
  name: string
  longitude: number
  rashi_index: number
  rashi_name: string
  rashi_name_kn: string
  degree_in_rashi: number
  nakshatra_index: number
  nakshatra_name: string
  nakshatra_name_kn: string
  pada: number
  nakshatra_lord: string
  retrograde: boolean
  is_rahu_ketu: boolean
}

export interface HousePosition {
  house_number: number
  rashi_index: number
  rashi_name: string
  longitude: number
}

export interface DashaPeriod {
  planet: string
  start: string
  end: string
  years: number
  is_current: boolean
}

export interface ChartData {
  date_of_birth: string
  time_of_birth: string
  latitude: number
  longitude: number
  timezone_str: string
  time_unknown: boolean
  julian_day: number
  ayanamsha: number
  ayanamsha_name: string
  lagna_longitude: number
  lagna_rashi_index: number
  lagna_rashi_name: string
  lagna_rashi_name_kn: string
  lagna_degree: number
  planets: PlanetPosition[]
  houses: HousePosition[]
  moon_rashi: string
  moon_rashi_kn: string
  moon_nakshatra: string
  moon_nakshatra_kn: string
  moon_pada: number
  moon_nakshatra_lord: string
  vimshottari_dasha: DashaPeriod[]
  notes: string[]
}

export const chartApi = {
  calculate: (profileId: string) =>
    apiClient.post<ChartData>(`/charts/${profileId}/calculate`).then((r) => r.data),
  get: (profileId: string) =>
    apiClient.get<ChartData>(`/charts/${profileId}`).then((r) => r.data),
  compatibility: (profileId1: string, profileId2: string) =>
    apiClient
      .post<CompatibilityReport>('/charts/compatibility', { profile_id_1: profileId1, profile_id_2: profileId2 })
      .then((r) => r.data),
}

// ============================================================
// REPORTS
// ============================================================
export interface ReportSection {
  heading: string
  content: string
}

export interface Report {
  title: string
  summary: string
  sections: ReportSection[]
  key_themes: string[]
  disclaimer: string
  ai_generated: boolean
  language: string
  report_type: string
  ai_error?: string
}

export interface CompatibilityReport {
  score: number
  summary: string
  details: Record<string, unknown>
  disclaimer: string
}

export interface SavedReport {
  id: string
  birth_profile_id: string
  report_type: string
  language: string
  content: Report
  ai_generated: boolean
  created_at: string
}

export const reportApi = {
  generate: (profileId: string, reportType: string, language: string) =>
    apiClient
      .post<Report>(`/reports/generate`, { profile_id: profileId, report_type: reportType, language })
      .then((r) => r.data),
  save: (profileId: string, reportType: string, language: string, content: Report) =>
    apiClient
      .post<SavedReport>('/reports/save', { profile_id: profileId, report_type: reportType, language, content })
      .then((r) => r.data),
  list: (profileId?: string) =>
    apiClient
      .get<SavedReport[]>('/reports', { params: profileId ? { profile_id: profileId } : {} })
      .then((r) => r.data),
  get: (id: string) => apiClient.get<SavedReport>(`/reports/${id}`).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/reports/${id}`).then((r) => r.data),
  downloadPdf: (id: string) =>
    apiClient.get(`/reports/${id}/pdf`, { responseType: 'blob' }).then((r) => r.data),
  exportData: () =>
    apiClient.get('/reports/export', { responseType: 'blob' }).then((r) => r.data),
}
