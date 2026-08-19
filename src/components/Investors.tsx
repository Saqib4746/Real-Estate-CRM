import { useRef, useState } from 'react'
import { TrendingUp, DollarSign, Users, BarChart3, X, Check, Camera, Upload, User, Wallet } from 'lucide-react'
import { formatPKR } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useToast } from './Toast'
import EmptyState from './EmptyState'

const COLORS = ['var(--brand)', '#2563EB', '#C9A227', '#7C3AED', '#EF4444', '#0891B2', '#B45309']
const emptyForm = { name: '', phone: '', investmentAmount: '', projects: [] as string[], photo: '' as string }

export default function Investors() {
  const { societies, investors, addInvestor } = useAppStore()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setField = (key: 'name' | 'phone' | 'investmentAmount' | 'photo', value: string) => setForm(p => ({ ...p, [key]: value }))
  const toggleProject = (id: string) => setForm(p => ({
    ...p,
    projects: p.projects.includes(id) ? p.projects.filter(s => s !== id) : [...p.projects, id],
  }))

  const handlePhotoFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField('photo', reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Investor name is required'); return }
    if (!form.investmentAmount || Number(form.investmentAmount) <= 0) { setFormError('Investment amount is required'); return }
    setFormError('')
    addInvestor({
      name: form.name.trim(),
      phone: form.phone.trim(),
      investmentAmount: Number(form.investmentAmount),
      projects: form.projects,
      photo: form.photo || undefined,
    })
    setSaved(true)
    showToast(`${form.name.trim()} added as an investor`, 'success')
    setTimeout(() => { setSaved(false); setShowModal(false); setForm(emptyForm) }, 1200)
  }

  const totalInvestment = investors.reduce((s, i) => s + i.investmentAmount, 0)
  const totalProfit = investors.reduce((s, i) => s + i.profit, 0)
  const avgROI = investors.length > 0 ? investors.reduce((s, i) => s + i.roi, 0) / investors.length : 0

  const chartData = investors.map(inv => ({
    name: inv.name.split(' ')[0] + ' ' + inv.name.split(' ')[1],
    investment: inv.investmentAmount / 1000000,
    profit: inv.profit / 1000000,
  }))

  const pieData = investors.map((inv, i) => ({
    name: inv.name.split(' ')[0],
    value: inv.investmentAmount,
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="p-6 max-w-screen-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Investors</h1>
          <p className="text-sm text-slate-500 mt-0.5">{investors.length} active investors</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setFormError(''); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #C9A227, #D4A017)' }}>
          + Add Investor
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Investment', value: formatPKR(totalInvestment), icon: <DollarSign size={18} />, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
          { label: 'Total Profit', value: formatPKR(totalProfit), icon: <TrendingUp size={18} />, color: '#C9A227', bg: '#C9A22715' },
          { label: 'Avg. ROI', value: `${avgROI.toFixed(1)}%`, icon: <BarChart3 size={18} />, color: '#2563EB', bg: '#2563EB15' },
          { label: 'Total Investors', value: investors.length, icon: <Users size={18} />, color: '#7C3AED', bg: '#7C3AED15' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {investors.length > 0 ? (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Investment vs. Profit (in Millions PKR)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}M`} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}M PKR`, '']} />
                  <Bar dataKey="investment" name="Investment" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#C9A227" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Investment Share</h3>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [formatPKR(Number(v)), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-500 flex-1">{d.name}</span>
                    <span className="font-semibold text-slate-700">{formatPKR(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {investors.map((inv, idx) => {
          const assignedProjects = inv.projects.map(pid => societies.find(s => s.id === pid)?.name).filter(Boolean)
          return (
            <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold overflow-hidden" style={{ background: COLORS[idx % COLORS.length] }}>
                    {inv.photo ? (
                      <img src={inv.photo} alt={inv.name} className="w-full h-full object-cover" />
                    ) : (
                      inv.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{inv.name}</h3>
                    <p className="text-xs text-slate-500">{inv.phone}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{inv.status}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Investment', value: formatPKR(inv.investmentAmount), color: 'var(--brand)' },
                  { label: 'Profit', value: formatPKR(inv.profit), color: '#C9A227' },
                  { label: 'ROI', value: `${inv.roi}%`, color: '#2563EB' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 rounded-xl bg-slate-50">
                    <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ROI Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>ROI Progress</span>
                  <span>{inv.roi}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(inv.roi / 25) * 100}%`, background: COLORS[idx % COLORS.length] }} />
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1.5">Projects</p>
                <div className="flex flex-wrap gap-1">
                  {assignedProjects.map(p => (
                    <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={<Wallet size={26} />}
            title="No investors yet"
            description="Add your first investor to start tracking their investment, profit and ROI across projects."
            actionLabel="Add Investor"
            onAction={() => { setForm(emptyForm); setFormError(''); setShowModal(true) }}
          />
        </div>
      )}

      {/* Add Investor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #C9A227, #D4A017)' }}>
              <h2 className="text-lg font-bold text-white">Add Investor</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo capture */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.photo ? (
                    <img src={form.photo} alt="Investor" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Investor Photo</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <Camera size={13} /> Take Photo
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <Upload size={13} /> Upload
                    </button>
                    {form.photo && (
                      <button type="button" onClick={() => setField('photo', '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50">
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Sheikh Nadeem Ashraf" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Phone</label>
                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="0300-1234567" value={form.phone} onChange={e => setField('phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Investment Amount (PKR)</label>
                <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  placeholder="10000000" value={form.investmentAmount} onChange={e => setField('investmentAmount', e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Invested Projects</label>
                <div className="flex flex-wrap gap-2">
                  {societies.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleProject(s.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${form.projects.includes(s.id) ? 'text-white border-transparent' : 'border-slate-200 text-slate-600'}`}
                      style={form.projects.includes(s.id) ? { background: '#C9A227' } : {}}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              {formError && <p className="text-xs font-medium text-red-500">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, #C9A227, #D4A017)' }}>
                {saved ? <><Check size={14} /> Saved!</> : 'Save Investor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
