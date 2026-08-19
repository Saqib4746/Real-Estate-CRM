import { createContext, useContext, useState, type ReactNode } from 'react'

const AUTH_STORAGE_KEY = 'akg-authed'

// Demo credentials for this local, single-tenant admin panel. There is no
// backend, so authentication is a simple gate that lives entirely in the
// browser — swap this out for real auth before deploying anywhere public.
export const ADMIN_USERNAME = 'admin'
export const ADMIN_PASSWORD = 'admin123'

interface AuthContextValue {
  isAuthed: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  })

  const login = (username: string, password: string): boolean => {
    const ok = username.trim().toLowerCase() === ADMIN_USERNAME && password === ADMIN_PASSWORD
    if (ok) {
      setIsAuthed(true)
      try { window.localStorage.setItem(AUTH_STORAGE_KEY, 'true') } catch { /* storage unavailable */ }
    }
    return ok
  }

  const logout = () => {
    setIsAuthed(false)
    try { window.localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* storage unavailable */ }
  }

  return <AuthContext.Provider value={{ isAuthed, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
