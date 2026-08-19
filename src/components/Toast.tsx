import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const VARIANT_STYLE: Record<ToastVariant, { bg: string; icon: ReactNode }> = {
  success: { bg: '#0F766E', icon: <CheckCircle2 size={18} /> },
  error: { bg: '#DC2626', icon: <XCircle size={18} /> },
  info: { bg: '#2563EB', icon: <Info size={18} /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, variant }])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3200)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast stack — fixed top-right, slides in and auto-dismisses */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 340 }}>
        {toasts.map(t => {
          const style = VARIANT_STYLE[t.variant]
          return (
            <div
              key={t.id}
              className="toast-slide-in pointer-events-auto flex items-start gap-2.5 rounded-xl shadow-lg px-4 py-3 text-white text-sm font-medium"
              style={{ background: style.bg }}
            >
              <span className="flex-shrink-0 mt-0.5">{style.icon}</span>
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="flex-shrink-0 text-white/70 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
