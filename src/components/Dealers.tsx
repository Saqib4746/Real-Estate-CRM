import { useRef, useState } from 'react'
import { Star, MapPin, Phone, Mail, X, Check, Camera, Upload, User, Briefcase } from 'lucide-react'
import { formatPKR } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'
import EmptyState from './EmptyState'

const emptyForm = { name: '', phone: '', email: '', city: '', societies: [] as string[], photo: '' as string }

export default function Dealers() {
  const { societies, dealers, addDealer } = useAppStore()
  const { showToast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setField = (key: keyof typeof emptyForm, value: string) => setForm(p => ({ ...p, [key]: value }))
  const toggleSociety = (id: string) => setForm(p => ({
    ...p,
    societies: p.societies.includes(id) ? p.societies.filter(s => s !== id) : [...p.societies, id],
  }))

  const handlePhotoFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField('photo', reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.name.trim()) { setFormError('Dealer name is required'); return }
    if (!form.phone.trim()) { setFormError('Phone number is required'); return }
    setFormError('')
    addDealer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      societies: form.societies,
      photo: form.photo || undefined,
    })
    setSaved(true)
    showToast(`${form.name.trim()} added as a dealer`, 'success')
    setTimeout(() => { setSaved(false); setShowModal(false); setForm(emptyForm) }, 1200)
  }

  return (
    <div className="p-6 max-w-screen-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dealers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{dealers.length} active dealers</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setFormError(''); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
          + Add Dealer
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Dealers', value: dealers.length, color: 'var(--brand)' },
          { label: 'Total Bookings', value: dealers.reduce((s, d) => s + d.totalBookings, 0), color: '#2563EB' },
          { label: 'Total Revenue', value: formatPKR(dealers.reduce((s, d) => s + d.totalRevenue, 0)), color: '#7C3AED' },
          { label: 'Total Commission', value: formatPKR(dealers.reduce((s, d) => s + d.commission, 0)), color: '#C9A227' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Dealer Cards */}
      {dealers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {dealers.map((dealer, idx) => {
          const assignedSocieties = dealer.societies.map(sid => societies.find(s => s.id === sid)?.name).filter(Boolean)
          const rankColors = ['#C9A227', '#94A3B8', '#CD7F32']
          const rank = idx < 3 ? idx : null
          return (
            <div key={dealer.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold overflow-hidden">
                      {dealer.photo ? (
                        <img src={dealer.photo} alt={dealer.name} className="w-full h-full object-cover" />
                      ) : (
                        dealer.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                      )}
                    </div>
                    {rank !== null && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: rankColors[rank] }}>
                        {rank + 1}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{dealer.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < Math.floor(dealer.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">{dealer.rating}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dealer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {dealer.status}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone size={13} className="text-slate-400" />
                  {dealer.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail size={13} className="text-slate-400" />
                  {dealer.email}
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={13} className="text-slate-400" />
                  {dealer.city}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Bookings', value: dealer.totalBookings, color: '#2563EB' },
                  { label: 'Revenue', value: formatPKR(dealer.totalRevenue), color: 'var(--brand)' },
                  { label: 'Commission', value: formatPKR(dealer.commission), color: '#C9A227' },
                  { label: 'Since', value: new Date(dealer.joinDate).getFullYear(), color: '#64748B' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2.5 rounded-xl bg-slate-50">
                    <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1.5">Assigned Societies</p>
                <div className="flex flex-wrap gap-1">
                  {assignedSocieties.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={<Briefcase size={26} />}
            title="No dealers yet"
            description="Add your first dealer to start assigning them to societies and tracking their bookings and commission."
            actionLabel="Add Dealer"
            onAction={() => { setForm(emptyForm); setFormError(''); setShowModal(true) }}
          />
        </div>
      )}

      {/* Add Dealer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Add Dealer</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Photo capture */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.photo ? (
                    <img src={form.photo} alt="Dealer" className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} className="text-slate-300" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dealer Photo</p>
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

              {([
                { label: 'Full Name', key: 'name', placeholder: 'Tariq Mahmood' },
                { label: 'Phone', key: 'phone', placeholder: '0300-1234567' },
                { label: 'Email', key: 'email', placeholder: 'name@email.com' },
                { label: 'City', key: 'city', placeholder: 'Gujranwala' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{f.label}</label>
                  <input
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => setField(f.key, e.target.value)}
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Assign Societies</label>
                <div className="flex flex-wrap gap-2">
                  {societies.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSociety(s.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${form.societies.includes(s.id) ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600'}`}
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
                style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                {saved ? <><Check size={14} /> Saved!</> : 'Save Dealer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
