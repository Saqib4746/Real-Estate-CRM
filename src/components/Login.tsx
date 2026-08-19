import { useState, type FormEvent } from 'react'
import { Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import defaultLogo from '@/imports/WhatsApp_Image_2026-07-21_at_9.41.55_AM.jpeg'
import { useAuth, ADMIN_USERNAME, ADMIN_PASSWORD } from '../store/AuthStore'

// Settings > Company Profile writes the uploaded logo here (see Settings.tsx),
// so the login screen can show the same branding without needing the app
// store — which isn't mounted yet at the login stage.
function getCompanyLogo(): string {
  if (typeof window === 'undefined') return defaultLogo
  try {
    const raw = window.localStorage.getItem('akg-company-profile')
    if (!raw) return defaultLogo
    const parsed = JSON.parse(raw)
    return parsed?.logo || defaultLogo
  } catch {
    return defaultLogo
  }
}

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [companyLogo] = useState(getCompanyLogo)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Please enter both username and password')
      return
    }
    setSubmitting(true)
    setError('')
    // Small delay so the button's loading state is visible — there's no
    // real network call since this is a local, browser-only auth gate.
    window.setTimeout(() => {
      const ok = login(username, password)
      if (!ok) {
        setError('Incorrect username or password')
        setSubmitting(false)
      }
    }, 350)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0A2E2B, #0F766E)' }}>
      <div className="w-full max-w-sm login-rise-in">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <img
              src={companyLogo}
              alt="Al-Khidmat Gujjar Real Estate"
              className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-100 shadow-sm p-1 mx-auto mb-4"
            />
            <h1 className="text-lg font-bold text-slate-800">Al-Khidmat Gujjar</h1>
            <p className="text-xs text-slate-400 mt-0.5">Real Estate Management</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Username</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500">
                <User size={15} className="text-slate-400 flex-shrink-0" />
                <input
                  autoFocus
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-700"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500">
                <Lock size={15} className="text-slate-400 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-700"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
                <AlertTriangle size={13} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0F766E, #0D9488)' }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Demo credentials: <span className="font-mono font-semibold text-slate-500">{ADMIN_USERNAME}</span> / <span className="font-mono font-semibold text-slate-500">{ADMIN_PASSWORD}</span>
              </p>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-white/50 mt-5">© {new Date().getFullYear()} Al-Khidmat Gujjar Real Estate</p>
      </div>
    </div>
  )
}
