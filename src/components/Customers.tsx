import { useRef, useState } from 'react'
import { Search, User, Phone, Mail, MapPin, CreditCard, X, FileText, Calendar, TrendingUp, Camera, Upload, Users } from 'lucide-react'
import { formatPKR, type Customer } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

const PAGE_SIZE = 10

export default function Customers() {
  const { customers, bookings, payments, updateCustomerPhoto } = useAppStore()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [page, setPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoFile = (file: File | null) => {
    if (!file || !selected) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateCustomerPhoto(selected.id, dataUrl)
      setSelected(prev => prev ? { ...prev, photo: dataUrl } : prev)
    }
    reader.readAsDataURL(file)
  }

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cnic.includes(search) ||
    c.phone.includes(search)
  )

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const updateSearch = (v: string) => { setSearch(v); setPage(1) }

  const customerBookings = selected ? bookings.filter(b => b.customerId === selected.id) : []
  const customerPayments = selected ? payments.filter(p => p.customerId === selected.id) : []
  const totalPaid = customerPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalDue = customerPayments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Customer List */}
      <div className={`flex flex-col ${selected ? 'w-72 border-r border-slate-100' : 'flex-1'} bg-white`}>
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-lg font-bold text-slate-800 flex-1">Customers</h1>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">{customers.length}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
            <Search size={14} className="text-slate-400" />
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search name, CNIC, phone..." value={search} onChange={e => updateSearch(e.target.value)} />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {paginated.map(c => {
            const cBookings = bookings.filter(b => b.customerId === c.id)
            const isSelected = selected?.id === c.id
            return (
              <div
                key={c.id}
                onClick={() => setSelected(isSelected ? null : c)}
                className={`px-4 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {c.photo ? <img src={c.photo} alt={c.name} className="w-full h-full object-cover" /> : c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                  <p className="text-xs text-slate-400 truncate">{c.phone} · {c.city}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-emerald-600">{cBookings.length} plot{cBookings.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-slate-400">{c.occupation}</p>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <EmptyState
              icon={<Users size={26} />}
              title={customers.length === 0 ? 'No customers yet' : 'No customers found'}
              description={customers.length === 0
                ? 'Customers appear automatically once you create a booking for them.'
                : 'Try a different name, CNIC or phone number.'}
            />
          )}
        </div>
        {filtered.length > 0 && (
          <Pagination page={currentPage} pageCount={pageCount} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>

      {/* Right: Customer Profile */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {/* Profile Header */}
          <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-start gap-5">
            <div className="relative flex-shrink-0 group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold overflow-hidden">
                {selected.photo ? <img src={selected.photo} alt={selected.name} className="w-full h-full object-cover" /> : selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex gap-1">
                <button onClick={() => cameraInputRef.current?.click()} title="Take photo"
                  className="w-6 h-6 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow">
                  <Camera size={11} />
                </button>
                <button onClick={() => fileInputRef.current?.click()} title="Upload photo"
                  className="w-6 h-6 rounded-full bg-slate-600 hover:bg-slate-700 flex items-center justify-center text-white shadow">
                  <Upload size={11} />
                </button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handlePhotoFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.fatherName} S/O · {selected.occupation}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { icon: <Phone size={13} />, value: selected.phone },
                  { icon: <Mail size={13} />, value: selected.email },
                  { icon: <MapPin size={13} />, value: `${selected.address}, ${selected.city}` },
                  { icon: <CreditCard size={13} />, value: selected.cnic },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="text-slate-400">{f.icon}</span>
                    {f.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Investment', value: formatPKR(customerBookings.reduce((s, b) => s + b.totalAmount, 0)), color: 'var(--brand)', icon: <TrendingUp size={16} /> },
                { label: 'Total Paid', value: formatPKR(totalPaid), color: '#2563EB', icon: <FileText size={16} /> },
                { label: 'Outstanding', value: formatPKR(totalDue), color: '#EF4444', icon: <Calendar size={16} /> },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + '15', color: s.color }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Booked Plots */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Booked Plots ({customerBookings.length})</h3>
              </div>
              {customerBookings.length > 0 ? (
                <table className="w-full premium-table">
                  <thead>
                    <tr>
                      <th className="text-left">Booking #</th>
                      <th className="text-left">Plot</th>
                      <th className="text-left">Society</th>
                      <th className="text-right">Amount</th>
                      <th className="text-left">Progress</th>
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerBookings.map(b => (
                      <tr key={b.id}>
                        <td className="text-xs font-mono text-slate-500">{b.bookingNumber}</td>
                        <td className="font-semibold text-slate-800">{b.plotNumber} <span className="text-xs text-slate-400">· {b.plotSize}</span></td>
                        <td className="text-sm text-slate-600">{b.societyName}</td>
                        <td className="text-right text-sm font-semibold text-slate-800">{formatPKR(b.totalAmount)}</td>
                        <td>
                          <div className="w-20">
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(b.installmentsPaid / b.totalInstallments) * 100}%` }} />
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{b.installmentsPaid}/{b.totalInstallments}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm">No bookings yet</div>
              )}
            </div>

            {/* Payment Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Payment Timeline ({customerPayments.length})</h3>
              </div>
              <div className="p-5 space-y-3">
                {customerPayments.map(p => (
                  <div key={p.id} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-emerald-500' : p.status === 'overdue' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{p.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — {p.receiptNumber}</p>
                      <p className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{formatPKR(p.amount)}</p>
                      <span className={`text-xs font-medium ${p.status === 'paid' ? 'text-emerald-600' : p.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>{p.status}</span>
                    </div>
                  </div>
                ))}
                {customerPayments.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No payments yet</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-3">
              <User size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm">Select a customer to view their profile</p>
          </div>
        </div>
      )}
    </div>
  )
}
