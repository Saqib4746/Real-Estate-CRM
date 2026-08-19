import { TrendingUp, Building2, MapPin, CheckCircle2, XCircle, Clock, Calendar, Bell, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { monthlyRevenue, recentActivity, notifications, formatPKR } from '../data/mockData'
import { useAppStore } from '../store/AppStore'

const EMERALD = 'var(--brand)'
const BLUE = '#2563EB'
const GOLD = '#C9A227'
const RED = '#EF4444'

interface StatCardProps {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
  trend?: number
}

function StatCard({ label, value, sub, icon, color, trend }: StatCardProps) {
  const isPos = (trend ?? 0) >= 0
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: color + '18', color }}
        >
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPos ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
        <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.name === 'Revenue' ? formatPKR(p.value) : p.value}</p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { societies, bookings, payments } = useAppStore()
  const recentBookings = bookings.slice(0, 5)
  const topSociety = [...societies].sort((a, b) => b.sold - a.sold)[0]

  const pieData = [
    { name: 'Available', value: societies.reduce((s, x) => s + x.available, 0), color: EMERALD },
    { name: 'Booked', value: societies.reduce((s, x) => s + x.booked, 0), color: GOLD },
    { name: 'Sold', value: societies.reduce((s, x) => s + x.sold, 0), color: RED },
    { name: 'Reserved', value: societies.reduce((s, x) => s + x.reserved, 0), color: BLUE },
  ]
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const pendingAmount = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPlots = societies.reduce((s, x) => s + x.totalPlots, 0)
  const availablePlots = societies.reduce((s, x) => s + x.available, 0)
  const bookedPlots = societies.reduce((s, x) => s + x.booked, 0)
  const soldPlots = societies.reduce((s, x) => s + x.sold, 0)

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Monday, 21 July 2026 — Welcome back, Admin</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
          <Calendar size={15} />
          July 2026
        </button>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Societies" value={String(societies.length)} sub="2 active, 1 pre-launch" icon={<Building2 size={20} />} color={EMERALD} trend={12} />
        <StatCard label="Available Plots" value={availablePlots.toLocaleString()} sub={`${totalPlots.toLocaleString()} total`} icon={<MapPin size={20} />} color={BLUE} />
        <StatCard label="Booked Plots" value={bookedPlots.toLocaleString()} sub="Active bookings" icon={<Clock size={20} />} color={GOLD} trend={8} />
        <StatCard label="Sold Plots" value={soldPlots.toLocaleString()} sub="All time" icon={<CheckCircle2 size={20} />} color="#7C3AED" trend={15} />
        <StatCard label="Total Revenue" value={formatPKR(totalRevenue)} sub="Collected" icon={<TrendingUp size={20} />} color={EMERALD} trend={22} />
        <StatCard label="Pending" value={formatPKR(pendingAmount)} sub="Outstanding" icon={<XCircle size={20} />} color={RED} trend={-5} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Revenue Overview</h3>
              <p className="text-xs text-slate-400">Monthly collection — Aug 2025 to Jul 2026</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+22% YoY</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={EMERALD} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={BLUE} stopOpacity={0.1} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatPKR(v)} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={EMERALD} strokeWidth={2} fill="url(#revGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-1">Plot Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Across all societies</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => [v + ' plots', '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-slate-500">{d.name}</span>
                <span className="font-semibold text-slate-700 ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Bookings + Recent Bookings + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Booking Bar Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-1">Monthly Bookings</h3>
          <p className="text-xs text-slate-400 mb-4">New bookings per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="bookings" name="Bookings" fill={BLUE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Recent Bookings</h3>
            <span className="text-xs text-emerald-600 font-medium cursor-pointer hover:underline">View all</span>
          </div>
          <div className="divide-y divide-slate-50">
            {recentBookings.map(b => (
              <div key={b.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold flex-shrink-0">
                  {b.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{b.customerName}</p>
                  <p className="text-xs text-slate-400 truncate">{b.plotNumber} · {b.societyName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-slate-700">{formatPKR(b.totalAmount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'active' ? 'bg-emerald-50 text-emerald-700' : b.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Activity</h3>
          </div>
          <div className="px-5 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: 280 }}>
            {recentActivity.map(a => (
              <div key={a.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color }} />
                  <div className="w-px flex-1 bg-slate-100 mt-1" />
                </div>
                <div className="pb-3">
                  <p className="text-xs text-slate-700 leading-relaxed">{a.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Society + Payment Reminders + Notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Top Selling Society */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4">Top Performing Society</h3>
          <div className="p-4 rounded-xl" style={{ background: topSociety.color + '10', borderLeft: `3px solid ${topSociety.color}` }}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800">{topSociety.name}</p>
                <p className="text-xs text-slate-500">{topSociety.city} · {topSociety.developer}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: topSociety.color }}>{topSociety.status}</span>
            </div>
            {[
              { label: 'Total Plots', value: topSociety.totalPlots, color: '#64748B' },
              { label: 'Sold', value: topSociety.sold, color: RED },
              { label: 'Booked', value: topSociety.booked, color: GOLD },
              { label: 'Available', value: topSociety.available, color: EMERALD },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className="text-sm font-semibold" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Reminders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Payment Reminders</h3>
            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">2 Overdue</span>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.filter(p => p.status !== 'paid').map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{p.customerName}</p>
                  <p className="text-xs text-slate-400 truncate">{p.plotNumber} · {p.societyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatPKR(p.amount)}</p>
                  <span className={`text-xs font-medium ${p.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            <Bell size={16} className="text-slate-400" />
          </div>
          <div className="divide-y divide-slate-50">
            {notifications.map(n => (
              <div key={n.id} className="px-5 py-3 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'warning' ? 'bg-amber-400' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-400'}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
