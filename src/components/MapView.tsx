import { useEffect, useState } from 'react'
import { X, Search, ZoomIn, ZoomOut, MapPin, Settings2, Plus } from 'lucide-react'
import { formatPKRFull, type PlotStatus, type Plot } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'

const STATUS_COLOR: Record<PlotStatus, string> = {
  available: '#10B981',
  booked: '#F59E0B',
  sold: '#EF4444',
  reserved: '#3B82F6',
  cancelled: '#9CA3AF',
}

const STATUS_LABEL: Record<PlotStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  sold: 'Sold',
  reserved: 'Reserved',
  cancelled: 'Cancelled',
}

export default function MapView() {
  const { societies, plots, bookings, customers, payments, mapTarget, clearMapTarget, updatePlotStatus, addBlockToSociety, addPlotsToBlock, navigate } = useAppStore()
  const { showToast } = useToast()
  const [selectedSociety, setSelectedSociety] = useState(mapTarget?.societyId ?? societies[0]?.id ?? '')
  const [selectedBlock, setSelectedBlock] = useState(mapTarget?.block ?? '')
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [zoom, setZoom] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<PlotStatus | ''>('')
  const [adminMode, setAdminMode] = useState(false)
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [newBlockName, setNewBlockName] = useState('')
  const [newBlockNorth, setNewBlockNorth] = useState('5')
  const [newBlockSouth, setNewBlockSouth] = useState('5')
  const [showAddPlots, setShowAddPlots] = useState(false)
  const [addPlotsNorth, setAddPlotsNorth] = useState('5')
  const [addPlotsSouth, setAddPlotsSouth] = useState('5')
  const [addBlockError, setAddBlockError] = useState('')

  // When the user navigates here from "View on Map" in Societies, jump straight to that society.
  useEffect(() => {
    if (mapTarget) {
      setSelectedSociety(mapTarget.societyId)
      setSelectedBlock(mapTarget.block ?? '')
      setSelectedPlot(null)
      clearMapTarget()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapTarget])

  const society = societies.find(s => s.id === selectedSociety) ?? societies[0]
  const blocks = society?.blocks ?? []

  const STATUS_CYCLE: PlotStatus[] = ['available', 'booked', 'sold', 'reserved']

  const handlePlotClick = (plot: Plot) => {
    if (adminMode) {
      const currentIdx = STATUS_CYCLE.indexOf(plot.status)
      const next = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
      updatePlotStatus(plot.id, next)
      setSelectedPlot(prev => prev?.id === plot.id ? { ...prev, status: next } : prev)
      return
    }
    setSelectedPlot(selectedPlot?.id === plot.id ? null : plot)
  }

  const handleAddBlock = () => {
    if (!society) return
    if (!newBlockName.trim()) { setAddBlockError('Enter a block name first'); return }
    const north = Math.max(0, Number(newBlockNorth) || 0)
    const south = Math.max(0, Number(newBlockSouth) || 0)
    if (north + south <= 0) { setAddBlockError('Add at least one plot facing North or South'); return }
    addBlockToSociety(society.id, newBlockName.trim(), { North: north, South: south })
    showToast(`Block ${newBlockName.trim()} added with ${north + south} plots`, 'success')
    setNewBlockName('')
    setNewBlockNorth('5')
    setNewBlockSouth('5')
    setAddBlockError('')
    setShowAddBlock(false)
  }

  const handleAddPlots = () => {
    if (!society || !selectedBlock) return
    const north = Math.max(0, Number(addPlotsNorth) || 0)
    const south = Math.max(0, Number(addPlotsSouth) || 0)
    if (north + south <= 0) return
    addPlotsToBlock(society.id, selectedBlock, { North: north, South: south })
    showToast(`${north + south} plots added to Block ${selectedBlock}`, 'success')
    setAddPlotsNorth('5')
    setAddPlotsSouth('5')
    setShowAddPlots(false)
  }

  const filteredPlots = plots.filter(p => {
    const inSociety = p.societyId === selectedSociety
    const inBlock = !selectedBlock || p.block === selectedBlock
    const matchSearch = !search || p.number.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    return inSociety && inBlock && matchSearch && matchStatus
  })

  const booking = selectedPlot ? bookings.find(b => b.plotId === selectedPlot.id) : null
  const customer = booking ? customers.find(c => c.id === booking.customerId) : null
  const plotPayments = booking ? payments.filter(p => p.bookingId === booking.id) : []
  const totalPaid = plotPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  // Arrange plots in a grid. When a single block is selected we show one grid.
  // When "All" is selected, plots are grouped by block — each block gets its
  // own labelled mini-grid so blocks stay visually distinct instead of
  // blurring into one continuous, unlabeled sheet of numbers.
  const COLS = 10
  const PER_BLOCK_CAP = 200
  const buildRows = (blockPlots: Plot[]): (Plot | null)[][] => {
    const capped = blockPlots.slice(0, PER_BLOCK_CAP)
    const out: (Plot | null)[][] = []
    for (let r = 0; r < Math.ceil(capped.length / COLS); r++) {
      out.push(capped.slice(r * COLS, (r + 1) * COLS))
    }
    return out
  }

  // Groups, in the society's own block order, each with only the plots that
  // survive the current search/status filters.
  const blockGroups = (selectedBlock ? [selectedBlock] : blocks)
    .map(b => ({ block: b, plots: filteredPlots.filter(p => p.block === b) }))
    .filter(g => g.plots.length > 0)

  if (!society) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center text-center p-6">
        <div>
          <MapPin size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No societies yet — create one first to see it on the map.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Map Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-slate-100 px-5 py-3 flex flex-wrap items-center gap-3">
          <select
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            value={selectedSociety}
            onChange={e => { setSelectedSociety(e.target.value); setSelectedBlock(''); setSelectedPlot(null) }}
          >
            {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="flex items-center gap-1 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
            <button
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${!selectedBlock ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              onClick={() => setSelectedBlock('')}
            >
              All
            </button>
            {blocks.map(b => (
              <button
                key={b}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${selectedBlock === b ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                onClick={() => setSelectedBlock(b)}
              >
                {b.replace('Block ', '').replace(' Block', '')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 max-w-48">
            <Search size={13} className="text-slate-400" />
            <input
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
              placeholder="Search plot..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 focus:outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as PlotStatus | '')}
          >
            <option value="">All Status</option>
            {(['available', 'booked', 'sold', 'reserved', 'cancelled'] as PlotStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
              <ZoomOut size={14} />
            </button>
            <span className="text-xs text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.8, z + 0.2))} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600">
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Admin controls */}
          <div className="flex items-center gap-2">
            {selectedBlock && (
              <button
                onClick={() => setShowAddPlots(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Plus size={13} /> Add Plots
              </button>
            )}
            <button
              onClick={() => { setShowAddBlock(true); setAddBlockError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Plus size={13} /> Add Block
            </button>
            <button
              onClick={() => { setAdminMode(v => !v); setSelectedPlot(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${adminMode ? 'text-white border-transparent' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              style={adminMode ? { background: 'var(--brand)' } : {}}
            >
              <Settings2 size={13} /> {adminMode ? 'Admin Mode: On' : 'Admin Mode'}
            </button>
          </div>
        </div>

        {adminMode && (
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-2 text-xs text-amber-700 font-medium">
            Admin Mode is on — click any plot on the map to cycle its status (Available → Booked → Sold → Reserved).
          </div>
        )}

        {/* Legend */}
        <div className="bg-white border-b border-slate-100 px-5 py-2 flex items-center gap-5">
          {(Object.entries(STATUS_LABEL) as [PlotStatus, string][]).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLOR[status] }} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-auto">{filteredPlots.length} plots shown</span>
        </div>

        {/* Plot Grid */}
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
          {/* Map Header Banner */}
          <div className="text-center mb-4">
            <h2 className="text-base font-bold text-slate-700">{society.name}</h2>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <MapPin size={11} />{society.address}
              {selectedBlock && <span className="font-semibold ml-1">· {selectedBlock}</span>}
            </p>
          </div>

          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
            {/* Road at top */}
            <div className="bg-slate-400 h-6 rounded-t-lg flex items-center px-3 mb-1 max-w-[640px] mx-auto">
              <span className="text-white text-xs font-medium tracking-widest opacity-70">MAIN ROAD</span>
            </div>

            {/* Each block renders as its own clearly-labeled section so blocks never
                blend into one another — this is what makes a newly-added block
                (e.g. Block E) show up distinctly instead of disappearing into a
                single shared grid. */}
            {blockGroups.length > 0 ? (
              <div className="space-y-5">
                {blockGroups.map(({ block, plots: blockPlots }) => {
                  const rows = buildRows(blockPlots)
                  const truncated = blockPlots.length > PER_BLOCK_CAP
                  return (
                    <div key={block} className="bg-white rounded-lg shadow-sm border border-slate-200 max-w-[640px] mx-auto">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--brand)' }} />
                          <h3 className="text-sm font-bold text-slate-700">{block}</h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{blockPlots.length} plot{blockPlots.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="p-4">
                        {rows.map((row, ri) => (
                          <div key={ri} className="flex gap-1.5 mb-1.5">
                            <div className="w-5 flex items-center justify-center text-xs text-slate-400 font-mono flex-shrink-0">
                              {ri + 1}
                            </div>
                            {row.map((plot, ci) => plot ? (
                              <div
                                key={plot.id}
                                className="plot-cell"
                                style={{
                                  width: 52,
                                  height: 40,
                                  background: STATUS_COLOR[plot.status],
                                  opacity: selectedPlot?.id === plot.id ? 1 : 0.85,
                                  border: selectedPlot?.id === plot.id
                                    ? '2px solid #0F172A'
                                    : adminMode ? '1px dashed rgba(255,255,255,0.9)' : `1px solid ${STATUS_COLOR[plot.status]}AA`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                }}
                                onClick={() => handlePlotClick(plot)}
                                title={adminMode ? `${block} · ${plot.number} · click to change status (currently ${plot.status})` : `${block} · ${plot.number} · ${plot.size} · ${plot.status}`}
                              >
                                <span style={{ fontSize: 9, color: 'white', fontWeight: 700, lineHeight: 1.1 }}>
                                  {plot.number.split('-').pop()}
                                </span>
                                <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.1 }}>
                                  {plot.size.replace(' Marla', 'M').replace('1 Kanal', '1K').replace('2 Kanal', '2K')}
                                </span>
                              </div>
                            ) : (
                              <div key={ci} style={{ width: 52, height: 40 }} />
                            ))}
                          </div>
                        ))}
                        {truncated && (
                          <p className="text-center text-xs text-slate-400 pt-1">
                            +{blockPlots.length - PER_BLOCK_CAP} more plots in this block — use "Search plot..." to find a specific one
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 max-w-[640px] mx-auto">
                <div className="text-center py-16 text-slate-400 text-sm">No plots match filters</div>
              </div>
            )}

            {/* Park strip */}
            <div className="bg-emerald-100 border border-emerald-200 h-10 rounded-b-lg flex items-center justify-center mt-2 max-w-[640px] mx-auto">
              <span className="text-emerald-600 text-xs font-semibold">🌳 PARK AREA 🌳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <div className={`w-80 bg-white border-l border-slate-100 shadow-lg flex flex-col transition-all duration-300 ${selectedPlot ? 'translate-x-0' : 'translate-x-full'} overflow-hidden`}
        style={{ position: selectedPlot ? 'relative' : 'absolute', right: 0, top: 0, height: '100%' }}>
        {selectedPlot ? (
          <>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between"
              style={{ background: `${STATUS_COLOR[selectedPlot.status]}12` }}>
              <div>
                <h3 className="font-bold text-slate-800">{selectedPlot.number}</h3>
                <p className="text-xs text-slate-500">{selectedPlot.block}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: STATUS_COLOR[selectedPlot.status] }}>
                  {STATUS_LABEL[selectedPlot.status]}
                </span>
                <button onClick={() => setSelectedPlot(null)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Plot Details */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Plot Details</p>
                <div className="space-y-2">
                  {[
                    { label: 'Size', value: selectedPlot.size },
                    { label: 'Category', value: selectedPlot.category },
                    { label: 'Facing', value: selectedPlot.facing },
                    { label: 'Price', value: formatPKRFull(selectedPlot.price) },
                    { label: 'Corner', value: selectedPlot.corner ? 'Yes' : 'No' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                      <span className="text-xs text-slate-500">{f.label}</span>
                      <span className="text-xs font-semibold text-slate-800">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              {customer && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Customer</p>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.phone}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{customer.cnic}</p>
                  </div>
                </div>
              )}

              {/* Booking Info */}
              {booking && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Booking</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Booking #', value: booking.bookingNumber },
                      { label: 'Total Amount', value: formatPKRFull(booking.totalAmount) },
                      { label: 'Down Payment', value: formatPKRFull(booking.downPayment) },
                      { label: 'Monthly', value: formatPKRFull(booking.monthlyInstallment) },
                      { label: 'Remaining', value: formatPKRFull(booking.remainingBalance) },
                      { label: 'Progress', value: `${booking.installmentsPaid}/${booking.totalInstallments} paid` },
                    ].map(f => (
                      <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                        <span className="text-xs text-slate-500">{f.label}</span>
                        <span className="text-xs font-semibold text-slate-800">{f.value}</span>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(booking.installmentsPaid / booking.totalInstallments) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1 text-right">{Math.round((booking.installmentsPaid / booking.totalInstallments) * 100)}% complete</p>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              {plotPayments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Payments</p>
                  <div className="p-3 rounded-xl bg-emerald-50">
                    <p className="text-xs text-slate-500">Total Paid</p>
                    <p className="text-lg font-bold text-emerald-700">{formatPKRFull(totalPaid)}</p>
                  </div>
                </div>
              )}

              {selectedPlot.status === 'available' && (
                <button onClick={() => navigate('bookings')} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                  Book This Plot
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <MapPin size={20} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">Click any plot to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Add Block Modal — full-screen so it can never get clipped by the map's scroll container */}
      {showAddBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddBlock(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Add a New Block</h2>
              <button onClick={() => setShowAddBlock(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Society</label>
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700">
                  {society?.name}
                </div>
                <p className="text-xs text-slate-400 mt-1">This block will be added to the society currently open on the map. Switch societies using the dropdown above before adding if you meant a different one.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Block Name</label>
                <input
                  autoFocus
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="e.g. Block D"
                  value={newBlockName}
                  onChange={e => { setNewBlockName(e.target.value); setAddBlockError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Plots to Start With, by Facing</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Facing North</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={newBlockNorth}
                      onChange={e => { setNewBlockNorth(e.target.value); setAddBlockError('') }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Facing South</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={newBlockSouth}
                      onChange={e => { setNewBlockSouth(e.target.value); setAddBlockError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleAddBlock()}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Total: {Math.max(0, Number(newBlockNorth) || 0) + Math.max(0, Number(newBlockSouth) || 0)} plots, all created as "Available" — you can change any plot's status afterward using Admin Mode on the map.
                </p>
              </div>
              {addBlockError && <p className="text-xs font-medium text-red-500">{addBlockError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAddBlock(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddBlock} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Plots to Existing Block Modal */}
      {showAddPlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddPlots(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Add Plots to a Block</h2>
              <button onClick={() => setShowAddPlots(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Society</label>
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700">
                  {society?.name}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Block</label>
                <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700">
                  {selectedBlock || '— none selected —'}
                </div>
                <p className="text-xs text-slate-400 mt-1">Plots are added to whichever block tab is currently selected above the map. Close this, pick a different block tab, then reopen Add Plots to target a different one.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Additional Plots, by Facing</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Facing North</label>
                    <input
                      autoFocus
                      type="number"
                      min={0}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={addPlotsNorth}
                      onChange={e => setAddPlotsNorth(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Facing South</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={addPlotsSouth}
                      onChange={e => setAddPlotsSouth(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddPlots()}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Total: {Math.max(0, Number(addPlotsNorth) || 0) + Math.max(0, Number(addPlotsSouth) || 0)} new plots, created as "Available" — change their status afterward using Admin Mode.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowAddPlots(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddPlots} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                Add Plots
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
