import type { ReactNode } from 'react'
import { useAuth } from '../store/AuthStore'
import Login from './Login'

export default function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthed } = useAuth()
  if (!isAuthed) return <Login />
  return <>{children}</>
}
