import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Something went wrong' }
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Logged for local debugging only — nothing is sent anywhere.
    // eslint-disable-next-line no-console
    console.error('Al-Khidmat app crashed:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-500 mb-1">
            The app hit an unexpected error and couldn't continue.
          </p>
          <p className="text-xs text-slate-400 mb-6 font-mono bg-slate-50 rounded-lg px-3 py-2 break-words">
            {this.state.message}
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Your data is safe — it's saved automatically as you work. Reloading will bring you right back.
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #0F766E, #0D9488)' }}
          >
            <RotateCcw size={15} />
            Reload the app
          </button>
        </div>
      </div>
    )
  }
}
