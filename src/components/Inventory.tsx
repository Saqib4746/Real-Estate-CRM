import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { type PlotStatus } from '../data/mockData'
import { useAppStore } from '../store/AppStore'

const STATUS_COLORS: Record<PlotStatus, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  booked: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  sold: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  reserved: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400' },
}

function formatPrice(p: number) {
  if (p >= 10000000) return `${(p / 10000000).toFixed(2)} Cr`
  return `${(p / 100000).toFixed(1)} L`
}

export default function Inventory() {
  const { plots, societies } = useAppStore()
  const [search, setSearch] = useState('')
  const [filterSociety, setFilterSociety] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSize, setFilterSize] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 15

  const filtered = plots.filter(p => {
    const matchSearch = !search || p.number.toLowerCase().includes(search.toLowerCase()) || p.societyName.toLowerCase().includes(search.toLowerCase())
    const matchSociety = !filterSociety || p.societyId === filterSociety
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchSize = !filterSize || p.size === filterSize
    return matchSearch && matchSociety && matchStatus && matchSize
  })

  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const sizes = [...new Set(plots.map(p => p.size))]

  const statusCounts = (['available', 'booked', 'sold', 'reserved', 'cancelled'] as PlotStatus[]).map(s => ({
    status: s,
    count: plots.filter(p => p.status === s).length,
  }))

  return (
    <div className="p-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plot Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{plots.length} total plots across all societies</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap gap-3 mb-5">
        {statusCounts.map(({ status, count }) => {
          const c = STATUS_COLORS[status]
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? '' : status)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${filterStatus === status ? 'border-slate-300 shadow-sm' : 'border-transparent'} ${c.bg} ${c.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="font-bold ml-1">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-52 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
          <Search size={15} className="text-slate-400" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search plot number, society..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          value={filterSociety}
          onChange={e => { setFilterSociety(e.target.value); setPage(0) }}
        >
          <option value="">All Societies</option>
          {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          value={filterSize}
          onChange={e => { setFilterSize(e.target.value); setPage(0) }}
        >
          <option value="">All Sizes</option>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
        >
          <option value="">All Status</option>
          {(['available', 'booked', 'sold', 'reserved', 'cancelled'] as PlotStatus[]).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full premium-table">
            <thead>
              <tr>
                <th className="text-left">Plot No.</th>
                <th className="text-left">Society</th>
                <th className="text-left">Block</th>
                <th className="text-left">Size</th>
                <th className="text-left">Category</th>
                <th className="text-left">Facing</th>
                <th className="text-right">Price</th>
                <th className="text-left">Status</th>
                <th className="text-left">Special</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(plot => {
                const sc = STATUS_COLORS[plot.status]
                return (
                  <tr key={plot.id} className="cursor-pointer">
                    <td className="font-semibold text-slate-800">{plot.number}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-slate-600 text-sm">{plot.societyName}</span>
                      </div>
                    </td>
                    <td className="text-slate-600">{plot.block}</td>
                    <td>
                      <span className="font-medium text-slate-800">{plot.size}</span>
                    </td>
                    <td className="text-slate-500 text-sm">{plot.category}</td>
                    <td className="text-slate-500 text-sm">{plot.facing}</td>
                    <td className="text-right font-semibold text-slate-800">
                      PKR {formatPrice(plot.price)}
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {plot.status.charAt(0).toUpperCase() + plot.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {plot.corner && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">Corner</span>}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">No plots match the current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === i ? 'text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                  style={page === i ? { background: 'var(--brand)' } : {}}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
