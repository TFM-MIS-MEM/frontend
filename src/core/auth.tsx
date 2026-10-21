import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as authApi from '@/api/auth'
import { setUnauthorizedHandler } from '@/api/client'
import type { Account } from '@/api/types'
import { clearSession, loadSession, saveSession } from './session'

interface AuthState {
  token: string | null
  account: Account | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => loadSession()?.token ?? null)
  const [account, setAccount] = useState<Account | null>(null)

  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setAccount(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    authApi
      .getMe(token)
      .then((a) => !cancelled && setAccount(a))
      .catch(() => {
        // Un 401 ya lo trata el manejador global; otro fallo deja la cabecera
        // sin correo, que no impide usar el panel.
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    saveSession(res.token, res.expiresIn)
    setToken(res.token)
  }, [])

  const value = useMemo(() => ({ token, account, login, logout }), [token, account, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth fuera de AuthProvider')
  return ctx
}

// Para las pantallas que solo existen con sesión: el token ya no es null.
// eslint-disable-next-line react-refresh/only-export-components
export function useToken(): string {
  const { token } = useAuth()
  if (!token) throw new Error('useToken sin sesión')
  return token
}
