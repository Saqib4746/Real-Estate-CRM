import { useState } from 'react'
import { Plus, Building2, MapPin, Users, BarChart3, ChevronRight, X, Check } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import type { Society } from '../data/mockData'
import { useToast } from './Toast'
import EmptyState from './EmptyState'

function SocietyCard({ society, onClick }: { society: Society; onClick: () => void }) {
  const soldPct = Math.round((society.sold / society.totalPlots) * 100)
  const bookedPct = Math.round((society.booked / society.totalPlots) * 100)

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Banner */}
      <div className="h-32 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${society.color}CC, ${society.color}66)` }}>
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=200&fit=crop")', backgroundSize: 'cover' }} />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${society.status === 'active' ? 'bg-emerald-500 text-white' : society.status === 'pre-launch' ? 'bg-amber-400 text-slate-900' : 'bg-slate-600 text-white'}`}>
            {society.status === 'pre-launch' ? 'Pre-Launch' : society.status === 'active' ? 'Active' : 'Completed'}
          </span>
        </div>
        <div className="absolute bottom-3 left-4">
          <p className="text-white font-bold text-lg leading-tight drop-shadow">{society.name}</p>
          <p className="text-white/80 text-xs flex items-center gap-1"><MapPin size={11} />{society.city}</p>
        </div>
      </div>

      <div className="p-5">
        <p className="text-xs text-slate-500 mb-4">{society.developer}</p>

        {/* Plot Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Total', value: society.totalPlots, color: '#64748B' },
            { label: 'Available', value: society.available, color: 'var(--brand)' },
            { label: 'Booked', value: society.booked, color: '#C9A227' },
            { label: 'Sold', value: society.sold, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-slate-50">
              <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Sales Progress</span>
            <span>{soldPct + bookedPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full rounded-full" style={{ width: `${soldPct}%`, background: '#EF4444' }} />
            <div className="h-full" style={{ width: `${bookedPct}%`, background: '#C9A227' }} />
          </div>
        </div>

        {/* Blocks */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {society.blocks.map(b => (
            <span key={b} className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: society.color + '15', color: society.color }}>
              {b}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{society.blocks.length} blocks · {society.address}</span>
          <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}

const emptyForm = { name: '', developer: '', city: '', address: '', description: '', blocks: '', status: 'active' as const }

export default function Societies() {
  const { societies, dealers, addSociety, navigate } = useAppStore()
  const { showToast } = useToast()
  const [selected, setSelected] = useState<Society | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Society name is required'); return }
    setFormError('')
    addSociety({
      name: form.name.trim(),
      developer: form.developer.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      description: form.description.trim(),
      blocks: form.blocks.split(',').map(b => b.trim()).filter(Boolean),
      status: form.status,
    })
    setSaved(true)
    showToast(`${form.name.trim()} created successfully`, 'success')
    setTimeout(() => { setSaved(false); setShowCreate(false); setForm(emptyForm) }, 1200)
  }

  const handleViewOnMap = () => {
    if (!selected) return
    navigate('map', { societyId: selected.id })
    setSelected(null)
  }

  return (
    <div className="p-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Societies</h1>
          <p className="text-sm text-slate-500 mt-0.5">{societies.length} societies managed</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}
        >
          <Plus size={16} />
          New Society
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Societies', value: societies.length, icon: <Building2 size={18} />, color: 'var(--brand)' },
          { label: 'Total Plots', value: societies.reduce((s, x) => s + x.totalPlots, 0).toLocaleString(), icon: <MapPin size={18} />, color: '#2563EB' },
          { label: 'Total Blocks', value: societies.reduce((s, x) => s + x.blocks.length, 0), icon: <BarChart3 size={18} />, color: '#C9A227' },
          { label: 'Total Dealers', value: dealers.length, icon: <Users size={18} />, color: '#7C3AED' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '18', color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Society Cards */}
      {societies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {societies.map(s => <SocietyCard key={s.id} society={s} onClick={() => setSelected(s)} />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={<Building2 size={26} />}
            title="No societies yet"
            description="Create your first society to start tracking blocks, plots, bookings and sales progress."
            actionLabel="New Society"
            onAction={() => setShowCreate(true)}
          />
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl">
            <div className="h-48 relative" style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}99)` }}>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white">
                <X size={16} />
              </button>
              <div className="absolute bottom-4 left-5">
                <h2 className="text-white text-xl font-bold">{selected.name}</h2>
                <p className="text-white/80 text-sm">{selected.city} · {selected.country}</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Developer', value: selected.developer },
                  { label: 'Status', value: selected.status },
                  { label: 'Address', value: selected.address },
                  { label: 'Blocks', value: selected.blocks.length + ' blocks' },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{f.label}</p>
                    <p className="text-sm font-semibold text-slate-800">{f.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Plot Statistics</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total', value: selected.totalPlots, c: '#64748B' },
                    { label: 'Available', value: selected.available, c: 'var(--brand)' },
                    { label: 'Booked', value: selected.booked, c: '#C9A227' },
                    { label: 'Sold', value: selected.sold, c: '#EF4444' },
                    { label: 'Reserved', value: selected.reserved, c: '#2563EB' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-xs text-slate-500">{s.label}</span>
                      <span className="font-bold text-sm" style={{ color: s.c }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Blocks</p>
                <div className="flex flex-wrap gap-2">
                  {selected.blocks.map(b => (
                    <span key={b} className="text-sm px-3 py-1 rounded-lg font-medium" style={{ background: selected.color + '15', color: selected.color }}>{b}</span>
                  ))}
                </div>
              </div>
              <button onClick={handleViewOnMap} className="w-full py-3 rounded-xl text-sm font-semibold text-white" style={{ background: selected.color }}>
                View on Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand) 3%, transparent), color-mix(in srgb, var(--brand) 2%, transparent))' }}>
              <h2 className="text-lg font-bold text-slate-800">Create New Society</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {[
                { label: 'Society Name', key: 'name', placeholder: 'e.g. Al-Khidmat City' },
                { label: 'Developer Name', key: 'developer', placeholder: 'e.g. Al-Khidmat Group' },
                { label: 'City', key: 'city', placeholder: 'e.g. Gujranwala' },
                { label: 'Address', key: 'address', placeholder: 'Full address' },
                { label: 'Blocks (comma separated)', key: 'blocks', placeholder: 'Block A, Block B, Executive Block' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">{f.label}</label>
                  <input
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block uppercase tracking-wide">Description</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                  placeholder="Society description..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              {formError && <p className="text-xs font-medium text-red-500">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                {saved ? <><Check size={15} /> Saved!</> : 'Create Society'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
