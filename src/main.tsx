import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppStoreProvider } from './store/AppStore'
import { AuthProvider } from './store/AuthStore'
import AuthGate from './components/AuthGate'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AuthGate>
            <AppStoreProvider>
              <App />
            </AppStoreProvider>
          </AuthGate>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
