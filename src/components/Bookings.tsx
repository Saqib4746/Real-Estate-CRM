import { useRef, useState } from 'react'
import { Plus, Search, X, Check, Camera, Upload, User, BookOpen } from 'lucide-react'
import { formatPKR } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

const CNIC_RE = /^\d{5}-\d{7}-\d$/
const PHONE_RE = /^0\d{3}-\d{7}$/
const PAGE_SIZE = 8

const STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
  transferred: 'bg-purple-50 text-purple-700',
}

type Step = 0 | 1 | 2 | 3

const emptyForm = {
  customerName: '', fatherName: '', cnic: '', phone: '', whatsapp: '', email: '', photo: '' as string,
  customerAddress: '', customerCity: '',
  societyId: '', block: '', plotNumber: '', size: '5 Marla', category: 'Residential', facing: 'North',
  totalAmount: '', downPayment: '', installmentMonths: '60',
  bookingDate: new Date().toISOString().slice(0, 10), possessionDate: '', dealerName: 'Tariq Mahmood', notes: '',
}

export default function Bookings() {
  const { bookings, societies, addBooking } = useAppStore()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [filterSociety, setFilterSociety] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [page, setPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const setField = (key: keyof typeof emptyForm, value: string) => setForm(p => ({ ...p, [key]: value }))

  const selectedSociety = societies.find(s => s.id === form.societyId)
  const blockOptions = selectedSociety?.blocks ?? []

  const filtered = bookings.filter(b => {
    const m = !search || b.customerName.toLowerCase().includes(search.toLowerCase()) || b.bookingNumber.toLowerCase().includes(search.toLowerCase())
    const ms = !filterSociety || b.societyId === filterSociety
    const mst = !filterStatus || b.status === filterStatus
    return m && ms && mst
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateSearch = (v: string) => { setSearch(v); setPage(1) }
  const updateFilterSociety = (v: string) => { setFilterSociety(v); setPage(1) }
  const updateFilterStatus = (v: string) => { setFilterStatus(v); setPage(1) }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, color: 'var(--brand)' },
    { label: 'Active', value: bookings.filter(b => b.status === 'active').length, color: '#2563EB' },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: '#7C3AED' },
    { label: 'This Month', value: bookings.filter(b => b.bookingDate.startsWith('2025-07')).length, color: '#C9A227' },
  ]

  const handlePhotoFile = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField('photo', reader.result as string)
    reader.readAsDataURL(file)
  }

  const validateStep = (s: Step): string => {
    if (s === 0) {
      if (!form.customerName.trim()) return 'Customer name is required'
      if (!form.cnic.trim()) return 'CNIC is required'
      if (!CNIC_RE.test(form.cnic.trim())) return 'CNIC must be in the format 35202-1234567-9'
      if (!form.phone.trim()) return 'Phone number is required'
      if (!PHONE_RE.test(form.phone.trim())) return 'Phone must be in the format 0300-1234567'
      if (form.whatsapp.trim() && !PHONE_RE.test(form.whatsapp.trim())) return 'WhatsApp number must be in the format 0300-1234567'
    }
    if (s === 1) {
      if (!form.societyId) return 'Please select a society'
      if (!form.block) return 'Please select a block'
      if (!form.plotNumber.trim()) return 'Plot number is required'
    }
    if (s === 2) {
      if (!form.totalAmount || Number(form.totalAmount) <= 0) return 'Total price is required'
      if (form.downPayment === '' || Number(form.downPayment) < 0) return 'Down payment is required'
      if (Number(form.downPayment) > Number(form.totalAmount)) return 'Down payment cannot exceed the total price'
    }
    return ''
  }

  const goNext = () => {
    const err = validateStep(step)
    if (err) { setFormError(err); return }
    setFormError('')
    setStep(s => Math.min(3, s + 1) as Step)
  }

  const resetForm = () => { setForm(emptyForm); setStep(0); setFormError('') }

  const handleSubmit = () => {
    const err = validateStep(0) || validateStep(1) || validateStep(2)
    if (err) { setFormError(err); return }
    setFormError('')
    addBooking({
      customerName: form.customerName.trim(),
      fatherName: form.fatherName.trim(),
      cnic: form.cnic.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      photo: form.photo || undefined,
      customerAddress: form.customerAddress.trim(),
      customerCity: form.customerCity.trim(),
      occupation: '',
      societyId: form.societyId,
      block: form.block,
      plotNumber: form.plotNumber.trim(),
      size: form.size,
      category: form.category,
      facing: form.facing,
      totalAmount: Number(form.totalAmount) || 0,
      downPayment: Number(form.downPayment) || 0,
      installmentMonths: Number(form.installmentMonths) || 60,
      bookingDate: form.bookingDate,
      possessionDate: form.possessionDate,
      dealerName: form.dealerName,
      notes: form.notes.trim(),
    })
    setSubmitted(true)
    showToast(`Booking saved for ${form.customerName.trim()}`, 'success')
    setTimeout(() => { setSubmitted(false); setShowModal(false); resetForm() }, 1500)
  }

  const steps = ['Customer Info', 'Plot Details', 'Payment Plan', 'Review']

  return (
    <div className="p-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{bookings.length} total bookings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}
        >
          <Plus size={15} />
          New Booking
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-52 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
          <Search size={14} className="text-slate-400" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search by customer or booking #..." value={search} onChange={e => updateSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" value={filterSociety} onChange={e => updateFilterSociety(e.target.value)}>
          <option value="">All Societies</option>
          {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" value={filterStatus} onChange={e => updateFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full premium-table">
                <thead>
                  <tr>
                    <th className="text-left">Booking #</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Plot</th>
                    <th className="text-left">Society</th>
                    <th className="text-left">Date</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Remaining</th>
                    <th className="text-left">Progress</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Dealer</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(b => (
                    <tr key={b.id} className="cursor-pointer">
                      <td className="font-mono text-xs font-semibold text-slate-600">{b.bookingNumber}</td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {b.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{b.customerName}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="font-semibold text-slate-800">{b.plotNumber}</span>
                        <span className="text-xs text-slate-400 ml-1">· {b.plotSize}</span>
                      </td>
                      <td className="text-sm text-slate-600">{b.societyName}</td>
                      <td className="text-sm text-slate-500">{new Date(b.bookingDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="text-right font-semibold text-slate-800 text-sm">{formatPKR(b.totalAmount)}</td>
                      <td className="text-right text-sm text-slate-600">{formatPKR(b.remainingBalance)}</td>
                      <td>
                        <div className="w-24">
                          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                            <span>{b.installmentsPaid}/{b.totalInstallments}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(b.installmentsPaid / b.totalInstallments) * 100}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${(STATUS_STYLE as any)[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">{b.dealerName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageCount={pageCount} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={<BookOpen size={26} />}
            title={bookings.length === 0 ? 'No bookings yet' : 'No bookings match your filters'}
            description={bookings.length === 0
              ? 'Create your first booking to start tracking customers, plots and payment plans.'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
            actionLabel={bookings.length === 0 ? 'New Booking' : undefined}
            onAction={bookings.length === 0 ? () => { resetForm(); setShowModal(true) } : undefined}
          />
        )}
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">New Booking</h2>
                  <p className="text-white/70 text-sm">Al-Khidmat Gujjar Real Estate</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                  <X size={15} />
                </button>
              </div>
              {/* Steps */}
              <div className="flex items-center gap-0">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? 'bg-white text-emerald-700' : 'bg-white/20 text-white/60'}`}>
                        {i < step ? <Check size={12} /> : i + 1}
                      </div>
                      <span className={`text-xs font-medium ${i <= step ? 'text-white' : 'text-white/50'}`}>{s}</span>
                    </div>
                    {i < steps.length - 1 && <div className={`h-px w-8 mx-2 ${i < step ? 'bg-white' : 'bg-white/25'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 min-h-64">
              {step === 0 && (
                <div className="space-y-5">
                  {/* Photo capture */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {form.photo ? (
                        <img src={form.photo} alt="Customer" className="w-full h-full object-cover" />
                      ) : (
                        <User size={28} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer Photo</p>
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
                      {/* capture="environment" opens the rear camera directly on mobile devices */}
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { label: 'Full Name', key: 'customerName', placeholder: 'Muhammad Ali Khan' },
                      { label: 'Father Name', key: 'fatherName', placeholder: 'Abdul Rehman Khan' },
                      { label: 'CNIC', key: 'cnic', placeholder: '35202-1234567-9' },
                      { label: 'Phone', key: 'phone', placeholder: '0300-1234567' },
                      { label: 'WhatsApp', key: 'whatsapp', placeholder: '0300-1234567' },
                      { label: 'Email', key: 'email', placeholder: 'name@email.com' },
                      { label: 'Address', key: 'customerAddress', placeholder: 'House / Street / Area' },
                      { label: 'City', key: 'customerCity', placeholder: 'Gujranwala' },
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
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Society</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.societyId} onChange={e => { setField('societyId', e.target.value); setField('block', '') }}>
                      <option value="">Select society...</option>
                      {societies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Block</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.block} onChange={e => setField('block', e.target.value)} disabled={!form.societyId}>
                      <option value="">{form.societyId ? 'Select block...' : 'Select society first'}</option>
                      {blockOptions.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Plot Number</label>
                    <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="A-001" value={form.plotNumber} onChange={e => setField('plotNumber', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Plot Size</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.size} onChange={e => setField('size', e.target.value)}>
                      {['3 Marla', '5 Marla', '7 Marla', '10 Marla', '1 Kanal', '2 Kanal'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Category</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.category} onChange={e => setField('category', e.target.value)}>
                      {['Residential', 'Commercial'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Facing</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.facing} onChange={e => setField('facing', e.target.value)}>
                      {['North', 'South', 'East', 'West', 'Corner', 'Park'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Total Price (PKR)</label>
                    <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="5500000" value={form.totalAmount} onChange={e => setField('totalAmount', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Down Payment (PKR)</label>
                    <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="1100000" value={form.downPayment} onChange={e => setField('downPayment', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Installment Plan</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.installmentMonths} onChange={e => setField('installmentMonths', e.target.value)}>
                      {['24', '36', '48', '60', '72'].map(o => <option key={o} value={o}>{o} months</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Monthly Installment</label>
                    <input disabled className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
                      value={form.totalAmount && form.installmentMonths ? formatPKR(Math.round((Number(form.totalAmount) - Number(form.downPayment || 0)) / Number(form.installmentMonths))) : 'Auto calculated'} readOnly />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Booking Date</label>
                    <input type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.bookingDate} onChange={e => setField('bookingDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Possession Date</label>
                    <input type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.possessionDate} onChange={e => setField('possessionDate', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Assigned Dealer</label>
                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={form.dealerName} onChange={e => setField('dealerName', e.target.value)}>
                      {['Tariq Mahmood', 'Asad Ullah Khan', 'Bilal Aslam', 'Naeem Akhtar', 'Adnan Riaz'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">Booking Summary</p>
                    <div className="space-y-1.5">
                      {[
                        ['Customer', form.customerName || '—'],
                        ['Plot', `${form.plotNumber || '—'} · ${form.size} · ${form.block || '—'}`],
                        ['Society', selectedSociety?.name || '—'],
                        ['Total Amount', form.totalAmount ? formatPKR(Number(form.totalAmount)) : '—'],
                        ['Down Payment', form.downPayment ? formatPKR(Number(form.downPayment)) : '—'],
                        ['Monthly Installment', form.totalAmount && form.installmentMonths ? `${formatPKR(Math.round((Number(form.totalAmount) - Number(form.downPayment || 0)) / Number(form.installmentMonths)))} × ${form.installmentMonths} months` : '—'],
                        ['Dealer', form.dealerName],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span className="text-slate-500">{k}</span>
                          <span className="font-semibold text-slate-800">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Notes</label>
                    <textarea rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none" placeholder="Additional notes..."
                      value={form.notes} onChange={e => setField('notes', e.target.value)} />
                  </div>
                </div>
              )}
              {formError && <p className="text-xs font-medium text-red-500 mt-3">{formError}</p>}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                disabled={step === 0}
                onClick={() => setStep(s => Math.max(0, s - 1) as Step)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button onClick={() => { setShowModal(false); resetForm() }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">
                  Cancel
                </button>
                {step < 3 ? (
                  <button onClick={goNext}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                    Next
                  </button>
                ) : (
                  <button onClick={handleSubmit}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: submitted ? '#10B981' : 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                    {submitted ? <><Check size={14} /> Booking Saved!</> : 'Save Booking'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
