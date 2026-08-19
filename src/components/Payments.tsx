import { useState } from 'react'
import { Search, Download, MessageCircle, Printer, X, DollarSign, Clock, AlertCircle, TrendingUp, Receipt } from 'lucide-react'
import { formatPKR, formatPKRFull, type Payment } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import { useToast } from './Toast'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import jsPDF from 'jspdf'

const PAGE_SIZE = 8

const TYPE_LABELS: Record<string, string> = {
  'down-payment': 'Down Payment',
  'installment': 'Installment',
  'development-charges': 'Development Charges',
  'transfer-fee': 'Transfer Fee',
}

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-600',
  partial: 'bg-blue-50 text-blue-700',
}

const emptyForm = {
  bookingId: '', amount: '', type: 'installment' as Payment['type'],
  date: new Date().toISOString().slice(0, 10), collectedBy: 'Office', notes: '',
}

// Blends a hex color toward white by `amount` (0-1) for a light tint —
// used for the PDF receipt's amount-box background.
function lightenHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '#F0FDFA'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export default function Payments() {
  const { payments, bookings, customers, recordPayment, themeColor } = useAppStore()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saved, setSaved] = useState(false)
  const [page, setPage] = useState(1)

  const setField = <K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) =>
    setForm(p => ({ ...p, [key]: value }))

  const selectedBooking = bookings.find(b => b.id === form.bookingId)

  const buildReceiptHTML = (p: Payment) => `
    <!DOCTYPE html><html><head><meta charset="utf-8" />
    <title>Receipt ${p.receiptNumber}</title>
    <style>
      body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 480px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
      .business { font-size: 20px; font-weight: 800; }
      .tag { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
      .receipt-no { font-family: monospace; font-weight: 700; font-size: 15px; }
      .amount-box { text-align: center; background: ${themeColor}14; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
      .amount { font-size: 32px; font-weight: 900; color: ${themeColor}; }
      .type { font-size: 13px; color: #64748b; margin-top: 4px; }
      .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 8px 0; font-size: 13px; }
      .row .label { color: #94a3b8; }
      .row .value { font-weight: 600; }
      .notes { background: #f8fafc; border-radius: 10px; padding: 12px; font-size: 12px; color: #64748b; margin-top: 16px; }
      @media print { body { padding: 12px; } }
    </style></head>
    <body>
      <div class="header">
        <p class="tag">Receipt</p>
        <p class="receipt-no">${p.receiptNumber}</p>
        <p class="business" style="margin-top:10px;">Al-Khidmat Gujjar Real Estate</p>
        <p class="tag" style="text-transform:none;">Property Advisors · Gujranwala</p>
      </div>
      <div class="amount-box">
        <p class="amount">${formatPKRFull(p.amount)}</p>
        <p class="type">${TYPE_LABELS[p.type]}</p>
      </div>
      ${[
        ['Customer', p.customerName], ['Society', p.societyName], ['Plot', p.plotNumber],
        ['Booking #', p.bookingNumber], ['Date', new Date(p.date).toLocaleDateString('en-PK', { dateStyle: 'long' })],
        ['Collected By', p.collectedBy || 'Office'], ['Status', p.status.charAt(0).toUpperCase() + p.status.slice(1)],
      ].map(([l, v]) => `<div class="row"><span class="label">${l}</span><span class="value">${v}</span></div>`).join('')}
      ${p.notes ? `<div class="notes"><strong>Notes:</strong> ${p.notes}</div>` : ''}
    </body></html>`

  const handlePrint = (p: Payment) => {
    const w = window.open('', '_blank', 'width=480,height=700')
    if (!w) {
      showToast('Your browser blocked the receipt pop-up — please allow pop-ups for this site', 'error')
      return
    }
    w.document.write(buildReceiptHTML(p))
    w.document.close()
    w.onload = () => w.print()
  }

  const handleDownload = (p: Payment) => {
    // Builds an actual PDF client-side with jsPDF and saves it straight to
    // disk — no print dialog, no "choose destination" step.
    const doc = new jsPDF({ unit: 'pt', format: [340, 520] })
    const pageW = 340
    const brand = themeColor || '#0F766E'

    let y = 36
    doc.setTextColor('#94A3B8')
    doc.setFontSize(9)
    doc.text('RECEIPT', pageW / 2, y, { align: 'center' })
    y += 16
    doc.setTextColor('#1E293B')
    doc.setFont('courier', 'bold')
    doc.setFontSize(12)
    doc.text(p.receiptNumber, pageW / 2, y, { align: 'center' })
    y += 22
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('Al-Khidmat Gujjar Real Estate', pageW / 2, y, { align: 'center' })
    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor('#94A3B8')
    doc.text('Property Advisors · Gujranwala', pageW / 2, y, { align: 'center' })
    y += 14
    doc.setDrawColor('#CBD5E1')
    doc.setLineDashPattern([2, 2], 0)
    doc.line(24, y, pageW - 24, y)
    doc.setLineDashPattern([], 0)
    y += 24

    // Amount box (light tint background computed from the brand color)
    doc.setFillColor(lightenHex(brand, 0.9))
    doc.roundedRect(24, y, pageW - 48, 64, 10, 10, 'F')
    doc.setTextColor(brand)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text(formatPKRFull(p.amount), pageW / 2, y + 32, { align: 'center' })
    doc.setTextColor('#64748B')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(TYPE_LABELS[p.type], pageW / 2, y + 50, { align: 'center' })
    y += 84

    const rows: [string, string][] = [
      ['Customer', p.customerName],
      ['Society', p.societyName],
      ['Plot', p.plotNumber],
      ['Booking #', p.bookingNumber],
      ['Date', new Date(p.date).toLocaleDateString('en-PK', { dateStyle: 'long' })],
      ['Collected By', p.collectedBy || 'Office'],
      ['Status', p.status.charAt(0).toUpperCase() + p.status.slice(1)],
    ]
    doc.setFontSize(10)
    rows.forEach(([label, value]) => {
      doc.setTextColor('#94A3B8')
      doc.setFont('helvetica', 'normal')
      doc.text(label, 24, y)
      doc.setTextColor('#1E293B')
      doc.setFont('helvetica', 'bold')
      doc.text(value, pageW - 24, y, { align: 'right' })
      doc.setDrawColor('#F1F5F9')
      y += 6
      doc.line(24, y, pageW - 24, y)
      y += 16
    })

    if (p.notes) {
      y += 4
      doc.setFillColor('#F8FAFC')
      const lines = doc.splitTextToSize(p.notes, pageW - 64)
      const boxH = 24 + lines.length * 12
      doc.roundedRect(24, y, pageW - 48, boxH, 8, 8, 'F')
      doc.setTextColor('#64748B')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text('Notes:', 32, y + 16)
      doc.setFont('helvetica', 'normal')
      doc.text(lines, 32, y + 28)
    }

    doc.save(`Receipt-${p.receiptNumber}.pdf`)
    showToast(`Receipt ${p.receiptNumber} downloaded`, 'success')
  }

  const handleWhatsApp = (p: Payment) => {
    const customer = customers.find(c => c.id === p.customerId)
    const message = `Receipt ${p.receiptNumber}\nAmount: ${formatPKRFull(p.amount)} (${TYPE_LABELS[p.type]})\nPlot: ${p.plotNumber}, ${p.societyName}\nDate: ${new Date(p.date).toLocaleDateString('en-PK', { dateStyle: 'long' })}`
    const phone = customer?.whatsapp?.replace(/\D/g, '') || customer?.phone?.replace(/\D/g, '') || ''
    if (!phone) {
      showToast('This customer has no WhatsApp or phone number on file', 'error')
      return
    }
    const url = `https://wa.me/${phone.startsWith('0') ? '92' + phone.slice(1) : phone}?text=${encodeURIComponent(message)}`
    const w = window.open(url, '_blank')
    if (!w) showToast('Your browser blocked the WhatsApp pop-up — please allow pop-ups for this site', 'error')
  }

  const handleSave = () => {
    if (!form.bookingId) { setFormError('Select a booking first'); return }
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Enter a valid amount'); return }
    setFormError('')
    recordPayment({
      bookingId: form.bookingId,
      amount: Number(form.amount),
      type: form.type,
      date: form.date,
      collectedBy: form.collectedBy.trim(),
      notes: form.notes.trim(),
    })
    setSaved(true)
    showToast(`Payment of ${formatPKR(Number(form.amount))} recorded`, 'success')
    setTimeout(() => { setSaved(false); setShowModal(false); setForm(emptyForm) }, 1200)
  }

  const filtered = payments.filter(p => {
    const m = !search || p.customerName.toLowerCase().includes(search.toLowerCase()) || p.receiptNumber.toLowerCase().includes(search.toLowerCase())
    const mt = !filterType || p.type === filterType
    const ms = !filterStatus || p.status === filterStatus
    return m && mt && ms
  })

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateSearch = (v: string) => { setSearch(v); setPage(1) }
  const updateFilterType = (v: string) => { setFilterType(v); setPage(1) }
  const updateFilterStatus = (v: string) => { setFilterStatus(v); setPage(1) }

  const totalCollected = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  const thisMonth = payments.filter(p => p.status === 'paid' && p.date.startsWith('2025-07')).reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-sm text-slate-500 mt-0.5">{payments.length} total transactions</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setFormError(''); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
          + Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Collected', value: formatPKR(totalCollected), icon: <TrendingUp size={18} />, color: 'var(--brand)', bg: 'color-mix(in srgb, var(--brand) 12%, transparent)' },
          { label: 'This Month', value: formatPKR(thisMonth), icon: <DollarSign size={18} />, color: '#2563EB', bg: '#2563EB15' },
          { label: 'Pending', value: formatPKR(totalPending), icon: <Clock size={18} />, color: '#C9A227', bg: '#C9A22715' },
          { label: 'Overdue', value: formatPKR(totalOverdue), icon: <AlertCircle size={18} />, color: '#EF4444', bg: '#EF444415' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-52 bg-slate-50 rounded-xl px-3 py-2 border border-slate-200">
          <Search size={14} className="text-slate-400" />
          <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search customer, receipt..." value={search} onChange={e => updateSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" value={filterType} onChange={e => updateFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="down-payment">Down Payment</option>
          <option value="installment">Installment</option>
          <option value="development-charges">Development Charges</option>
          <option value="transfer-fee">Transfer Fee</option>
        </select>
        <select className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none" value={filterStatus} onChange={e => updateFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full premium-table">
                <thead>
                  <tr>
                    <th className="text-left">Receipt #</th>
                    <th className="text-left">Customer</th>
                    <th className="text-left">Plot</th>
                    <th className="text-left">Society</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Date</th>
                    <th className="text-right">Amount</th>
                    <th className="text-left">Status</th>
                    <th className="text-left">Collected By</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setSelectedPayment(p)}>
                      <td className="font-mono text-xs font-semibold text-slate-600">{p.receiptNumber}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {p.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{p.customerName}</span>
                        </div>
                      </td>
                      <td className="font-semibold text-sm text-slate-800">{p.plotNumber}</td>
                      <td className="text-sm text-slate-500">{p.societyName}</td>
                      <td>
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[p.type]}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">
                        {new Date(p.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="text-right font-bold text-slate-800">{formatPKR(p.amount)}</td>
                      <td>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[p.status]}`}>
                          {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-sm text-slate-500">{p.collectedBy || '—'}</td>
                      <td>
                        <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handlePrint(p)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700" title="Print">
                            <Printer size={13} />
                          </button>
                          <button onClick={() => handleWhatsApp(p)} className="w-7 h-7 rounded-lg hover:bg-green-50 flex items-center justify-center text-slate-400 hover:text-green-600" title="WhatsApp">
                            <MessageCircle size={13} />
                          </button>
                          <button onClick={() => handleDownload(p)} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600" title="Download PDF">
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageCount={pageCount} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={<Receipt size={26} />}
            title={payments.length === 0 ? 'No payments yet' : 'No payments match your filters'}
            description={payments.length === 0
              ? 'Record your first payment to start tracking collections and receipts.'
              : 'Try adjusting your search or filters to find what you\'re looking for.'}
            actionLabel={payments.length === 0 ? 'Record Payment' : undefined}
            onAction={payments.length === 0 ? () => { setForm(emptyForm); setFormError(''); setShowModal(true) } : undefined}
          />
        )}
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Record Payment</h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Booking</label>
                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={form.bookingId} onChange={e => setField('bookingId', e.target.value)}>
                  <option value="">Select booking...</option>
                  {bookings.filter(b => b.status === 'active').map(b => (
                    <option key={b.id} value={b.id}>{b.bookingNumber} · {b.customerName} · {b.plotNumber}</option>
                  ))}
                </select>
              </div>
              {selectedBooking && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Total Amount</span><span className="font-semibold text-slate-800">{formatPKR(selectedBooking.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Remaining Balance</span><span className="font-semibold text-slate-800">{formatPKR(selectedBooking.remainingBalance)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Installments Paid</span><span className="font-semibold text-slate-800">{selectedBooking.installmentsPaid}/{selectedBooking.totalInstallments}</span></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Amount (PKR)</label>
                  <input type="number" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="73333" value={form.amount} onChange={e => setField('amount', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                  <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={form.type} onChange={e => setField('type', e.target.value as Payment['type'])}>
                    <option value="installment">Installment</option>
                    <option value="down-payment">Down Payment</option>
                    <option value="development-charges">Development Charges</option>
                    <option value="transfer-fee">Transfer Fee</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Date</label>
                  <input type="date" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    value={form.date} onChange={e => setField('date', e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Collected By</label>
                  <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="Office" value={form.collectedBy} onChange={e => setField('collectedBy', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Notes</label>
                <textarea rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none resize-none"
                  placeholder="Optional notes..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
              </div>
              {formError && <p className="text-xs font-medium text-red-500">{formError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                {saved ? 'Saved!' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedPayment(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Receipt Header */}
            <div className="px-6 py-5 text-center border-b border-dashed border-slate-200" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand) 3%, transparent), color-mix(in srgb, var(--brand) 2%, transparent))' }}>
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setSelectedPayment(null)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                  <X size={14} />
                </button>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Receipt</p>
                  <p className="font-mono font-bold text-slate-800">{selectedPayment.receiptNumber}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handlePrint(selectedPayment)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center" title="Print">
                    <Printer size={13} className="text-slate-600" />
                  </button>
                  <button onClick={() => handleWhatsApp(selectedPayment)} className="w-8 h-8 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center" title="WhatsApp">
                    <MessageCircle size={13} className="text-green-600" />
                  </button>
                </div>
              </div>
              <p className="font-bold text-slate-800 text-lg">Al-Khidmat Gujjar Real Estate</p>
              <p className="text-xs text-slate-500">Property Advisors · Gujranwala</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="text-center p-4 rounded-xl" style={{ background: selectedPayment.status === 'paid' ? 'color-mix(in srgb, var(--brand) 8%, transparent)' : '#EF444410' }}>
                <p className="text-3xl font-black" style={{ color: selectedPayment.status === 'paid' ? 'var(--brand)' : '#EF4444' }}>
                  {formatPKRFull(selectedPayment.amount)}
                </p>
                <p className="text-sm text-slate-500 mt-1">{TYPE_LABELS[selectedPayment.type]}</p>
              </div>

              {/* Details */}
              <div className="space-y-2.5">
                {[
                  { label: 'Customer', value: selectedPayment.customerName },
                  { label: 'Society', value: selectedPayment.societyName },
                  { label: 'Plot', value: selectedPayment.plotNumber },
                  { label: 'Booking #', value: selectedPayment.bookingNumber },
                  { label: 'Date', value: new Date(selectedPayment.date).toLocaleDateString('en-PK', { dateStyle: 'long' }) },
                  { label: 'Collected By', value: selectedPayment.collectedBy || 'Office' },
                  { label: 'Status', value: selectedPayment.status.charAt(0).toUpperCase() + selectedPayment.status.slice(1) },
                ].map(f => (
                  <div key={f.label} className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="text-xs text-slate-400">{f.label}</span>
                    <span className="text-xs font-semibold text-slate-800">{f.value}</span>
                  </div>
                ))}
              </div>

              {selectedPayment.notes && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500">
                  <span className="font-semibold text-slate-600">Notes: </span>
                  {selectedPayment.notes}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => handleDownload(selectedPayment)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Download size={14} /> PDF
                </button>
                <button onClick={() => handleWhatsApp(selectedPayment)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{ background: '#25D366' }}>
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
