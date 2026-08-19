import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  societies as initialSocieties,
  plots as initialPlots,
  bookings as initialBookings,
  customers as initialCustomers,
  payments as initialPayments,
  dealers as initialDealers,
  investors as initialInvestors,
  type Society,
  type Plot,
  type Booking,
  type Customer,
  type Payment,
  type PlotStatus,
  type Dealer,
  type Investor,
} from '../data/mockData'

export type Page =
  | 'dashboard' | 'societies' | 'inventory' | 'bookings' | 'customers'
  | 'payments' | 'dealers' | 'investors' | 'map' | 'reports' | 'settings'

export interface NewSocietyInput {
  name: string
  developer: string
  city: string
  address: string
  description: string
  blocks: string[]
  status: Society['status']
}

export interface NewBookingInput {
  // Customer
  customerName: string
  fatherName: string
  cnic: string
  phone: string
  whatsapp: string
  email: string
  photo?: string
  customerAddress: string
  customerCity: string
  occupation: string
  // Plot
  societyId: string
  block: string
  plotNumber: string
  size: string
  category: string
  facing: string
  // Payment plan
  totalAmount: number
  downPayment: number
  installmentMonths: number
  bookingDate: string
  possessionDate: string
  dealerName: string
  notes: string
}

export interface NewDealerInput {
  name: string
  phone: string
  email: string
  city: string
  societies: string[]
  photo?: string
}

export interface NewInvestorInput {
  name: string
  phone: string
  investmentAmount: number
  projects: string[]
  photo?: string
}

export interface NewPaymentInput {
  bookingId: string
  amount: number
  type: Payment['type']
  date: string
  collectedBy: string
  notes: string
}

interface MapTarget {
  societyId: string
  block?: string
}

// Breakdown of how many plots to create per facing direction when adding a
// block or topping up an existing one. Any direction left at 0/undefined is
// simply skipped.
export interface FacingCounts {
  North?: number
  South?: number
  East?: number
  West?: number
}

export interface SystemUser {
  id: string
  name: string
  email: string
  role: 'Super Admin' | 'Manager' | 'Dealer' | 'Accountant'
  status: 'active' | 'inactive'
  invitedAt: string
}

export interface NewUserInput {
  name: string
  email: string
  role: SystemUser['role']
}

export interface TemplateOverride {
  footer: string
  note: string
}

export interface BackupSnapshot {
  version: 1
  exportedAt: string
  societies: Society[]
  plots: Plot[]
  bookings: Booking[]
  customers: Customer[]
  payments: Payment[]
  dealers: Dealer[]
  investors: Investor[]
  users: SystemUser[]
  templateOverrides: Record<string, TemplateOverride>
  themeColor: string
}

interface AppState {
  societies: Society[]
  plots: Plot[]
  bookings: Booking[]
  customers: Customer[]
  payments: Payment[]
  dealers: Dealer[]
  investors: Investor[]
  users: SystemUser[]
  templateOverrides: Record<string, TemplateOverride>
  page: Page
  mapTarget: MapTarget | null
  themeColor: string
  darkMode: boolean
}

interface AppActions {
  navigate: (page: Page, target?: MapTarget) => void
  clearMapTarget: () => void
  addSociety: (input: NewSocietyInput) => Society
  addBooking: (input: NewBookingInput) => Booking
  addBlockToSociety: (societyId: string, blockName: string, facingCounts: FacingCounts) => void
  addPlotsToBlock: (societyId: string, block: string, facingCounts: FacingCounts) => void
  updatePlotStatus: (plotId: string, status: PlotStatus) => void
  updateCustomerPhoto: (customerId: string, photo: string) => void
  recordPayment: (input: NewPaymentInput) => Payment
  addDealer: (input: NewDealerInput) => Dealer
  addInvestor: (input: NewInvestorInput) => Investor
  inviteUser: (input: NewUserInput) => SystemUser
  updateUserStatus: (userId: string, status: SystemUser['status']) => void
  setTemplateOverride: (title: string, override: TemplateOverride) => void
  setThemeColor: (color: string) => void
  setDarkMode: (value: boolean) => void
  exportBackup: () => BackupSnapshot
  restoreBackup: (snapshot: BackupSnapshot) => void
  resetToDemoData: () => void
}

const COLOR_PALETTE = ['#0F766E', '#2563EB', '#C9A227', '#7C3AED', '#DC2626', '#0891B2', '#B45309']

const THEME_STORAGE_KEY = 'akg-theme-color'
const DEFAULT_THEME = '#0F766E'
const DARK_MODE_STORAGE_KEY = 'akg-dark-mode'

// Everything that should survive a refresh lives under one JSON blob so a
// single load/save pair keeps all the business data in sync.
const DATA_STORAGE_KEY = 'akg-app-data-v1'

const defaultUsers: SystemUser[] = [
  { id: 'U1', name: 'Admin User', email: 'admin@alkhidmat.pk', role: 'Super Admin', status: 'active', invitedAt: '2023-01-01' },
  { id: 'U2', name: 'Tariq Mahmood', email: 'tariq@alkhidmat.pk', role: 'Dealer', status: 'active', invitedAt: '2023-03-15' },
  { id: 'U3', name: 'Asad Khan', email: 'asad@alkhidmat.pk', role: 'Manager', status: 'active', invitedAt: '2023-04-02' },
  { id: 'U4', name: 'Sara Accounts', email: 'sara@alkhidmat.pk', role: 'Accountant', status: 'inactive', invitedAt: '2023-06-20' },
]

interface PersistedData {
  societies: Society[]
  plots: Plot[]
  bookings: Booking[]
  customers: Customer[]
  payments: Payment[]
  dealers: Dealer[]
  investors: Investor[]
  users: SystemUser[]
  templateOverrides: Record<string, TemplateOverride>
}

function loadPersistedData(): PersistedData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DATA_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as PersistedData
  } catch {
    return null
  }
}

function defaultData(): PersistedData {
  return {
    societies: initialSocieties,
    plots: initialPlots,
    bookings: initialBookings,
    customers: initialCustomers,
    payments: initialPayments,
    dealers: initialDealers,
    investors: initialInvestors,
    users: defaultUsers,
    templateOverrides: {},
  }
}

// Lighten a hex color by mixing it toward white — used to derive the second
// stop of the app's brand gradient from whatever primary color is chosen.
function lightenHex(hex: string, amount = 0.18): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const num = parseInt(clean, 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, '0')).join('')}`
}

function applyThemeToDocument(color: string) {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--brand', color)
  document.documentElement.style.setProperty('--brand-light', lightenHex(color))
}

const AppStoreContext = createContext<(AppState & AppActions) | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => loadPersistedData(), [])
  const [societies, setSocieties] = useState<Society[]>(persisted?.societies ?? initialSocieties)
  const [plots, setPlots] = useState<Plot[]>(persisted?.plots ?? initialPlots)
  const [bookings, setBookings] = useState<Booking[]>(persisted?.bookings ?? initialBookings)
  const [customers, setCustomers] = useState<Customer[]>(persisted?.customers ?? initialCustomers)
  const [payments, setPayments] = useState<Payment[]>(persisted?.payments ?? initialPayments)
  const [dealers, setDealers] = useState<Dealer[]>(persisted?.dealers ?? initialDealers)
  const [investors, setInvestors] = useState<Investor[]>(persisted?.investors ?? initialInvestors)
  const [users, setUsers] = useState<SystemUser[]>(persisted?.users ?? defaultUsers)
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, TemplateOverride>>(persisted?.templateOverrides ?? {})
  const [page, setPage] = useState<Page>('dashboard')
  const [mapTarget, setMapTarget] = useState<MapTarget | null>(null)
  const [themeColor, setThemeColorState] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME
    return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME
  })
  const [darkMode, setDarkModeState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true'
  })

  // Persist every domain collection to localStorage whenever any of them
  // change, so closing the tab and coming back later keeps all the data —
  // societies, plots, bookings, customers, payments, dealers, investors,
  // system users and document template customizations.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const data: PersistedData = { societies, plots, bookings, customers, payments, dealers, investors, users, templateOverrides }
      window.localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data))
    } catch { /* storage unavailable */ }
  }, [societies, plots, bookings, customers, payments, dealers, investors, users, templateOverrides])

  // Push the current brand color onto the document as CSS variables so every
  // component that styles itself with var(--brand) / var(--brand-light)
  // updates instantly — including on first load, before any user change.
  useEffect(() => {
    applyThemeToDocument(themeColor)
  }, [themeColor])

  // Toggles a `dark` class on <html> so the app-wide dark theme CSS in
  // index.css activates — applied on first load too, not just on toggle.
  // Cleaned up on unmount (e.g. logout) so the login screen never inherits it.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', darkMode)
    return () => document.documentElement.classList.remove('dark')
  }, [darkMode])

  const setThemeColor = (color: string) => {
    setThemeColorState(color)
    applyThemeToDocument(color)
    try { window.localStorage.setItem(THEME_STORAGE_KEY, color) } catch { /* storage unavailable */ }
  }

  const setDarkMode = (value: boolean) => {
    setDarkModeState(value)
    try { window.localStorage.setItem(DARK_MODE_STORAGE_KEY, String(value)) } catch { /* storage unavailable */ }
  }

  const navigate = (nextPage: Page, target?: MapTarget) => {
    setPage(nextPage)
    setMapTarget(target ?? null)
  }
  const clearMapTarget = () => setMapTarget(null)

  const addSociety = (input: NewSocietyInput): Society => {
    const id = `S${Date.now()}`
    const color = COLOR_PALETTE[societies.length % COLOR_PALETTE.length]
    const society: Society = {
      id,
      name: input.name || 'Untitled Society',
      developer: input.developer || '—',
      address: input.address || '—',
      city: input.city || '—',
      country: 'Pakistan',
      totalPlots: 0,
      available: 0,
      booked: 0,
      sold: 0,
      reserved: 0,
      status: input.status,
      color,
      blocks: input.blocks.length ? input.blocks : ['Block A'],
      description: input.description || 'No description provided yet.',
      masterPlan: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
    }
    setSocieties(prev => [society, ...prev])

    // Seed a starter set of available plots for each block so the new society
    // is immediately visible and usable on the Map / Inventory pages.
    const seeded: Plot[] = []
    society.blocks.forEach(block => {
      for (let i = 1; i <= 10; i++) {
        seeded.push({
          id: `${id}-${block}-${i}-${Date.now()}`,
          number: `${block.replace('Block ', '').replace(' Block', '')}-${String(i).padStart(3, '0')}`,
          societyId: id,
          societyName: society.name,
          block,
          size: '5 Marla',
          category: 'Residential',
          price: 2800000,
          facing: 'North',
          corner: i % 7 === 0,
          status: 'available',
        })
      }
    })
    setPlots(prev => [...prev, ...seeded])
    setSocieties(prev => prev.map(s => s.id === id
      ? { ...s, totalPlots: seeded.length, available: seeded.length }
      : s))

    return society
  }

  // Turns { North: 6, South: 4 } into a flat list of ['North', 'North', ..., 'South', ...]
  // in a stable order, so plot numbering stays predictable.
  const expandFacingCounts = (facingCounts: FacingCounts): string[] => {
    const order: (keyof FacingCounts)[] = ['North', 'South', 'East', 'West']
    const list: string[] = []
    order.forEach(dir => {
      const n = Math.max(0, Math.floor(facingCounts[dir] ?? 0))
      for (let i = 0; i < n; i++) list.push(dir)
    })
    return list
  }

  const addBlockToSociety = (societyId: string, blockName: string, facingCounts: FacingCounts) => {
    const trimmed = blockName.trim()
    if (!trimmed) return
    const facingList = expandFacingCounts(facingCounts)
    const plotCount = facingList.length
    if (plotCount === 0) return
    setSocieties(prev => prev.map(s => {
      if (s.id !== societyId || s.blocks.includes(trimmed)) return s
      return { ...s, blocks: [...s.blocks, trimmed], totalPlots: s.totalPlots + plotCount, available: s.available + plotCount }
    }))
    const society = societies.find(s => s.id === societyId)
    if (!society || society.blocks.includes(trimmed)) return
    const seeded: Plot[] = facingList.map((facing, idx) => ({
      id: `${societyId}-${trimmed}-${idx + 1}-${Date.now()}`,
      number: `${trimmed.replace('Block ', '').replace(' Block', '')}-${String(idx + 1).padStart(3, '0')}`,
      societyId,
      societyName: society.name,
      block: trimmed,
      size: '5 Marla',
      category: 'Residential',
      price: 2800000,
      facing,
      corner: false,
      status: 'available',
    }))
    setPlots(prev => [...prev, ...seeded])
  }

  const addPlotsToBlock = (societyId: string, block: string, facingCounts: FacingCounts) => {
    const society = societies.find(s => s.id === societyId)
    const facingList = expandFacingCounts(facingCounts)
    const plotCount = facingList.length
    if (!society || plotCount === 0) return
    const existingInBlock = plots.filter(p => p.societyId === societyId && p.block === block).length
    const seeded: Plot[] = facingList.map((facing, idx) => {
      const num = existingInBlock + idx + 1
      return {
        id: `${societyId}-${block}-${num}-${Date.now()}-${idx}`,
        number: `${block.replace('Block ', '').replace(' Block', '')}-${String(num).padStart(3, '0')}`,
        societyId,
        societyName: society.name,
        block,
        size: '5 Marla',
        category: 'Residential',
        price: 2800000,
        facing,
        corner: false,
        status: 'available' as PlotStatus,
      }
    })
    setPlots(prev => [...prev, ...seeded])
    setSocieties(prev => prev.map(s => s.id === societyId ? { ...s, totalPlots: s.totalPlots + plotCount, available: s.available + plotCount } : s))
  }

  const updatePlotStatus = (plotId: string, status: PlotStatus) => {
    const target = plots.find(p => p.id === plotId)
    if (!target || target.status === status) return
    setPlots(prev => prev.map(p => p.id === plotId ? { ...p, status } : p))
    // keep society-level counters in sync with the map
    setSocieties(prev => prev.map(s => {
      if (s.id !== target.societyId) return s
      const next = { ...s }
      const dec = (key: 'available' | 'booked' | 'sold' | 'reserved') => { (next as any)[key] = Math.max(0, (next as any)[key] - 1) }
      const inc = (key: 'available' | 'booked' | 'sold' | 'reserved') => { (next as any)[key] = ((next as any)[key] ?? 0) + 1 }
      if (['available', 'booked', 'sold', 'reserved'].includes(target.status)) dec(target.status as any)
      if (['available', 'booked', 'sold', 'reserved'].includes(status)) inc(status as any)
      return next
    }))
  }

  const addBooking = (input: NewBookingInput): Booking => {
    const society = societies.find(s => s.id === input.societyId)
    const societyName = society?.name ?? ''

    // Reuse an existing available plot at this block/number if one exists,
    // otherwise mint a new plot so it appears correctly everywhere (Map, Inventory).
    let plot = plots.find(p => p.societyId === input.societyId && p.block === input.block && p.number === input.plotNumber)
    const plotId = plot?.id ?? `${input.societyId}-${input.block}-${input.plotNumber}-${Date.now()}`
    if (!plot) {
      const newPlot: Plot = {
        id: plotId,
        number: input.plotNumber || `NEW-${Math.floor(Math.random() * 900 + 100)}`,
        societyId: input.societyId,
        societyName,
        block: input.block,
        size: input.size,
        category: input.category,
        price: input.totalAmount,
        facing: input.facing,
        corner: false,
        status: 'booked',
      }
      setPlots(prev => [...prev, newPlot])
      setSocieties(prev => prev.map(s => s.id === input.societyId ? { ...s, totalPlots: s.totalPlots + 1, booked: s.booked + 1 } : s))
    } else {
      setPlots(prev => prev.map(p => p.id === plotId ? { ...p, status: 'booked' } : p))
      setSocieties(prev => prev.map(s => {
        if (s.id !== input.societyId) return s
        return { ...s, available: Math.max(0, s.available - 1), booked: s.booked + 1 }
      }))
    }

    // Find or create the customer (match by CNIC).
    let customer = customers.find(c => c.cnic === input.cnic)
    if (!customer) {
      customer = {
        id: `C${Date.now()}`,
        name: input.customerName,
        fatherName: input.fatherName,
        cnic: input.cnic,
        phone: input.phone,
        whatsapp: input.whatsapp || input.phone,
        email: input.email,
        address: input.customerAddress,
        city: input.customerCity,
        occupation: input.occupation,
        dob: '',
        plots: [],
        photo: input.photo,
      }
      setCustomers(prev => [customer as Customer, ...prev])
    }
    const customerId = customer.id
    setCustomers(prev => prev.map(c => c.id === customerId
      ? { ...c, plots: [...c.plots, `${input.plotNumber}`], photo: input.photo ?? c.photo }
      : c))

    const remainingAfterDown = Math.max(0, input.totalAmount - input.downPayment)
    const monthlyInstallment = input.installmentMonths > 0 ? Math.round(remainingAfterDown / input.installmentMonths) : 0
    const bookingNumber = `AKG-${new Date(input.bookingDate || Date.now()).getFullYear()}-${String(bookings.length + 1).padStart(3, '0')}`

    const booking: Booking = {
      id: `B${Date.now()}`,
      bookingNumber,
      customerId,
      customerName: input.customerName,
      plotId,
      plotNumber: input.plotNumber,
      societyId: input.societyId,
      societyName,
      block: input.block,
      plotSize: input.size,
      totalAmount: input.totalAmount,
      downPayment: input.downPayment,
      monthlyInstallment,
      remainingBalance: remainingAfterDown,
      bookingDate: input.bookingDate || new Date().toISOString().slice(0, 10),
      possessionDate: input.possessionDate || new Date().toISOString().slice(0, 10),
      dealerId: '',
      dealerName: input.dealerName || 'Unassigned',
      status: 'active',
      installmentsPaid: 0,
      totalInstallments: input.installmentMonths || 60,
    }
    setBookings(prev => [booking, ...prev])

    if (input.downPayment > 0) {
      const payment: Payment = {
        id: `P${Date.now()}`,
        receiptNumber: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`,
        bookingId: booking.id,
        bookingNumber,
        customerId,
        customerName: input.customerName,
        societyName,
        plotNumber: input.plotNumber,
        amount: input.downPayment,
        type: 'down-payment',
        date: booking.bookingDate,
        status: 'paid',
        collectedBy: input.dealerName || 'Unassigned',
        notes: 'Down payment received at booking',
      }
      setPayments(prev => [payment, ...prev])
    }

    return booking
  }

  const updateCustomerPhoto = (customerId: string, photo: string) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, photo } : c))
  }

  const recordPayment = (input: NewPaymentInput): Payment => {
    const booking = bookings.find(b => b.id === input.bookingId)

    const payment: Payment = {
      id: `P${Date.now()}`,
      receiptNumber: `RCP-${new Date().getFullYear()}-${String(payments.length + 1).padStart(4, '0')}`,
      bookingId: input.bookingId,
      bookingNumber: booking?.bookingNumber ?? '',
      customerId: booking?.customerId ?? '',
      customerName: booking?.customerName ?? '',
      societyName: booking?.societyName ?? '',
      plotNumber: booking?.plotNumber ?? '',
      amount: input.amount,
      type: input.type,
      date: input.date || new Date().toISOString().slice(0, 10),
      status: 'paid',
      collectedBy: input.collectedBy || 'Office',
      notes: input.notes,
    }
    setPayments(prev => [payment, ...prev])

    if (booking) {
      setBookings(prev => prev.map(b => {
        if (b.id !== input.bookingId) return b
        const remainingBalance = Math.max(0, b.remainingBalance - input.amount)
        const installmentsPaid = input.type === 'installment' ? Math.min(b.totalInstallments, b.installmentsPaid + 1) : b.installmentsPaid
        return {
          ...b,
          remainingBalance,
          installmentsPaid,
          status: remainingBalance === 0 ? 'completed' : b.status,
        }
      }))
    }

    return payment
  }

  const addDealer = (input: NewDealerInput): Dealer => {
    const dealer: Dealer = {
      id: `D${Date.now()}`,
      name: input.name,
      phone: input.phone,
      email: input.email,
      city: input.city,
      societies: input.societies,
      totalBookings: 0,
      totalRevenue: 0,
      commission: 0,
      rating: 0,
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      photo: input.photo,
    }
    setDealers(prev => [dealer, ...prev])
    return dealer
  }

  const addInvestor = (input: NewInvestorInput): Investor => {
    const investor: Investor = {
      id: `I${Date.now()}`,
      name: input.name,
      phone: input.phone,
      investmentAmount: input.investmentAmount,
      roi: 0,
      profit: 0,
      projects: input.projects,
      joinDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      photo: input.photo,
    }
    setInvestors(prev => [investor, ...prev])
    return investor
  }

  const inviteUser = (input: NewUserInput): SystemUser => {
    const user: SystemUser = {
      id: `U${Date.now()}`,
      name: input.name,
      email: input.email,
      role: input.role,
      status: 'active',
      invitedAt: new Date().toISOString().slice(0, 10),
    }
    setUsers(prev => [user, ...prev])
    return user
  }

  const updateUserStatus = (userId: string, status: SystemUser['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u))
  }

  const setTemplateOverride = (title: string, override: TemplateOverride) => {
    setTemplateOverrides(prev => ({ ...prev, [title]: override }))
  }

  const exportBackup = (): BackupSnapshot => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    societies, plots, bookings, customers, payments, dealers, investors, users, templateOverrides, themeColor,
  })

  const restoreBackup = (snapshot: BackupSnapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return
    if (Array.isArray(snapshot.societies)) setSocieties(snapshot.societies)
    if (Array.isArray(snapshot.plots)) setPlots(snapshot.plots)
    if (Array.isArray(snapshot.bookings)) setBookings(snapshot.bookings)
    if (Array.isArray(snapshot.customers)) setCustomers(snapshot.customers)
    if (Array.isArray(snapshot.payments)) setPayments(snapshot.payments)
    if (Array.isArray(snapshot.dealers)) setDealers(snapshot.dealers)
    if (Array.isArray(snapshot.investors)) setInvestors(snapshot.investors)
    if (Array.isArray(snapshot.users)) setUsers(snapshot.users)
    if (snapshot.templateOverrides && typeof snapshot.templateOverrides === 'object') setTemplateOverrides(snapshot.templateOverrides)
    if (snapshot.themeColor) setThemeColor(snapshot.themeColor)
  }

  // Wipes all local changes and restores the original demo dataset — the
  // "escape hatch" under Settings > Backup for demos or a fresh start.
  const resetToDemoData = () => {
    const fresh = defaultData()
    setSocieties(fresh.societies)
    setPlots(fresh.plots)
    setBookings(fresh.bookings)
    setCustomers(fresh.customers)
    setPayments(fresh.payments)
    setDealers(fresh.dealers)
    setInvestors(fresh.investors)
    setUsers(fresh.users)
    setTemplateOverrides(fresh.templateOverrides)
    try { window.localStorage.removeItem(DATA_STORAGE_KEY) } catch { /* storage unavailable */ }
  }

  const value = useMemo<AppState & AppActions>(() => ({
    societies, plots, bookings, customers, payments, dealers, investors, users, templateOverrides, page, mapTarget, themeColor, darkMode,
    navigate, clearMapTarget, addSociety, addBooking, addBlockToSociety, addPlotsToBlock, updatePlotStatus,
    updateCustomerPhoto, recordPayment, addDealer, addInvestor, inviteUser, updateUserStatus, setTemplateOverride,
    setThemeColor, setDarkMode, exportBackup, restoreBackup, resetToDemoData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [societies, plots, bookings, customers, payments, dealers, investors, users, templateOverrides, page, mapTarget, themeColor, darkMode])

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
