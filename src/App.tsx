import { useState } from 'react'
import {
  LayoutDashboard, Building2, Layers, BookOpen, Users, CreditCard,
  UserCheck, TrendingUp, Map, BarChart3, Settings as SettingsIcon,
  Bell, Search, Menu, X, ChevronRight, LogOut,
} from 'lucide-react'
import companyLogo from '@/imports/WhatsApp_Image_2026-07-21_at_9.41.55_AM.jpeg'

import Dashboard from './components/Dashboard'
import Societies from './components/Societies'
import Inventory from './components/Inventory'
import Bookings from './components/Bookings'
import Customers from './components/Customers'
import Payments from './components/Payments'
import MapView from './components/MapView'
import Reports from './components/Reports'
import Dealers from './components/Dealers'
import Investors from './components/Investors'
import Settings from './components/Settings'
import { useAppStore, type Page } from './store/AppStore'
import { useAuth } from './store/AuthStore'

interface NavItem {
  id: Page
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'societies', label: 'Societies', icon: <Building2 size={18} /> },
  { id: 'inventory', label: 'Inventory', icon: <Layers size={18} /> },
  { id: 'bookings', label: 'Bookings', icon: <BookOpen size={18} /> },
  { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard size={18} />, badge: 2 },
  { id: 'dealers', label: 'Dealers', icon: <UserCheck size={18} /> },
  { id: 'investors', label: 'Investors', icon: <TrendingUp size={18} /> },
  { id: 'map', label: 'Map View', icon: <Map size={18} /> },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} /> },
]

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  societies: 'Society Management',
  inventory: 'Plot Inventory',
  bookings: 'Bookings',
  customers: 'Customers',
  payments: 'Payments',
  dealers: 'Dealers',
  investors: 'Investors',
  map: 'Interactive Map',
  reports: 'Reports',
  settings: 'Settings',
}

function Sidebar({ active, onNavigate, onClose, onLogout }: { active: Page; onNavigate: (p: Page) => void; onClose?: () => void; onLogout: () => void }) {
  return (
    <aside
      className="flex flex-col h-full sidebar-scroll overflow-y-auto"
      style={{ background: '#0A2E2B', width: 256 }}
    >
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#ffffff15' }}>
        <img
          src={companyLogo}
          alt="Al-Khidmat Gujjar Real Estate"
          className="w-10 h-10 rounded-xl object-contain bg-white p-0.5 flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-white text-sm leading-tight truncate">Al-Khidmat</p>
          <p className="text-xs leading-tight truncate" style={{ color: '#C9A227' }}>Gujjar Real Estate</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(item => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose?.() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group relative"
              style={{
                background: isActive ? 'var(--brand)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.6)',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#143D38'; (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)' } }}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: '#EF4444', color: 'white' }}>
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight size={13} className="text-white/60" />}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t" style={{ borderColor: '#ffffff15' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: '#143D38' }}>
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            SA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Super Admin</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>admin@alkhidmat.pk</p>
          </div>
          <button onClick={onLogout} title="Log out" className="text-white/40 hover:text-white/80 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function App() {
  const { page: activePage, navigate } = useAppStore()
  const { logout } = useAuth()
  const setActivePage = (p: Page) => navigate(p)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />
      case 'societies': return <Societies />
      case 'inventory': return <Inventory />
      case 'bookings': return <Bookings />
      case 'customers': return <Customers />
      case 'payments': return <Payments />
      case 'dealers': return <Dealers />
      case 'investors': return <Investors />
      case 'map': return <MapView />
      case 'reports': return <Reports />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  const isFullHeight = activePage === 'map' || activePage === 'customers'

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 256 }}>
        <Sidebar active={activePage} onNavigate={setActivePage} onLogout={logout} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar active={activePage} onNavigate={setActivePage} onClose={() => setSidebarOpen(false)} onLogout={logout} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-100 shadow-sm flex items-center gap-3 px-4 md:px-6 h-16 flex-shrink-0">
          {/* Mobile menu toggle */}
          <button className="lg:hidden w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500"
            onClick={() => setSidebarOpen(true)}>
            <Menu size={17} />
          </button>

          {/* Page Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Al-Khidmat</span>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="text-sm font-semibold text-slate-800">{PAGE_TITLES[activePage]}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Global Search */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-60">
            <Search size={14} className="text-slate-400" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-700" placeholder="Search anything..." />
            <kbd className="text-xs text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 relative"
            >
              <Bell size={17} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Notifications</span>
                  <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                </div>
                {[
                  { t: 'Payment Overdue', m: 'Fatima Malik — Installment #5 overdue', c: '#EF4444', time: '2h ago' },
                  { t: 'New Booking', m: 'Raja Muhammad Usman booked B-004', c: 'var(--brand)', time: '4h ago' },
                  { t: 'Possession Due', m: 'Hafiz Abdul Razzaq — June 2026', c: '#2563EB', time: '1d ago' },
                ].map((n, i) => (
                  <div key={i} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.c }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{n.t}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.m}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 text-center">
                  <button className="text-xs font-semibold text-emerald-600 hover:underline">View all notifications</button>
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            SA
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-auto ${isFullHeight ? 'overflow-hidden' : ''}`}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
