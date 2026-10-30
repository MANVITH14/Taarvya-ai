/**
 * Auth context — manages user session and token lifecycle.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authApi, type UserProfile } from '@/lib/api'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string, lang?: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false })
      return
    }
    try {
      const user = await authApi.me()
      setState({ user, isLoading: false, isAuthenticated: true })
    } catch {
      localStorage.removeItem('access_token')
      setState({ user: null, isLoading: false, isAuthenticated: false })
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const { access_token, user } = await authApi.login({ email, password })
    localStorage.setItem('access_token', access_token)
    setState({ user, isLoading: false, isAuthenticated: true })
  }

  const register = async (email: string, password: string, fullName: string, lang = 'en') => {
    const { access_token, user } = await authApi.register({
      email,
      password,
      full_name: fullName,
      preferred_language: lang,
    })
    localStorage.setItem('access_token', access_token)
    setState({ user, isLoading: false, isAuthenticated: true })
  }

  const logout = async () => {
    try { await authApi.logout() } catch {}
    localStorage.removeItem('access_token')
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
