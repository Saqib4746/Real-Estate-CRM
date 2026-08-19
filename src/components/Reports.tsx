import { Download, FileSpreadsheet, BarChart3 } from 'lucide-react'
import { monthlyRevenue, formatPKR } from '../data/mockData'
import { useAppStore } from '../store/AppStore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line,
} from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? formatPKR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reports() {
  const { societies, bookings, payments, dealers, plots } = useAppStore()
  const societyData = societies.map(s => ({
    name: s.name.split(' ')[0],
    sold: s.sold,
    booked: s.booked,
    available: s.available,
    revenue: s.sold * 4500000,
  }))

  const reports = [
    { title: 'Society Wise Sales', description: 'Plot sales breakdown by society', badge: 'Monthly' },
    { title: 'Dealer Performance', description: 'Revenue and commission by dealer', badge: 'Quarterly' },
    { title: 'Payment Collection', description: 'Received vs outstanding amounts', badge: 'Monthly' },
    { title: 'Installment Due', description: 'Upcoming and overdue installments', badge: 'Weekly' },
    { title: 'Defaulters Report', description: 'Customers with overdue payments', badge: 'Alert' },
    { title: 'Available Inventory', description: 'Unsold plots by society and block', badge: 'Live' },
  ]

  const toCSV = (headers: string[], rows: (string | number)[][]) => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    return [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  }

  const downloadCSV = (filename: string, csv: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    const csv = toCSV(
      ['Society', 'Sold', 'Booked', 'Available', 'Est. Revenue (PKR)'],
      societyData.map(s => [s.name, s.sold, s.booked, s.available, s.revenue]),
    )
    downloadCSV('society-sales-report.csv', csv)
  }

  const handleExportPDF = () => {
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) {
      alert('Your browser blocked the PDF preview pop-up. Please allow pop-ups for this site and try again.')
      return
    }
    const rowsHtml = societyData.map(s => `<tr><td>${s.name}</td><td>${s.sold}</td><td>${s.booked}</td><td>${s.available}</td><td>${formatPKR(s.revenue)}</td></tr>`).join('')
    const monthlyHtml = monthlyRevenue.map((m: any) => `<tr><td>${m.month}</td><td>${m.bookings}</td><td>${formatPKR(m.payments)}</td></tr>`).join('')
    w.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8" /><title>Reports & Analytics</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        p.sub { color: #94a3b8; font-size: 12px; margin-bottom: 20px; }
        h2 { font-size: 14px; margin: 24px 0 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #f1f5f9; }
        th { color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 10px; }
        @media print { body { padding: 12px; } }
      </style></head>
      <body>
        <h1>Reports & Analytics</h1>
        <p class="sub">Comprehensive business intelligence · exported ${new Date().toLocaleDateString('en-PK', { dateStyle: 'long' })}</p>
        <h2>Society Wise Sales</h2>
        <table><thead><tr><th>Society</th><th>Sold</th><th>Booked</th><th>Available</th><th>Est. Revenue</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <h2>Monthly Bookings & Collections</h2>
        <table><thead><tr><th>Month</th><th>Bookings</th><th>Payments Collected</th></tr></thead><tbody>${monthlyHtml}</tbody></table>
      </body></html>`)
    w.document.close()
    w.onload = () => w.print()
  }

  const handleQuickReport = (title: string) => {
    switch (title) {
      case 'Society Wise Sales':
        downloadCSV('society-wise-sales.csv', toCSV(
          ['Society', 'Sold', 'Booked', 'Available', 'Est. Revenue (PKR)'],
          societyData.map(s => [s.name, s.sold, s.booked, s.available, s.revenue]),
        ))
        break
      case 'Dealer Performance':
        downloadCSV('dealer-performance.csv', toCSV(
          ['Dealer', 'City', 'Total Bookings', 'Total Revenue (PKR)', 'Commission (PKR)', 'Rating'],
          dealers.map(d => [d.name, d.city, d.totalBookings, d.totalRevenue, d.commission, d.rating]),
        ))
        break
      case 'Payment Collection':
        downloadCSV('payment-collection.csv', toCSV(
          ['Receipt #', 'Customer', 'Society', 'Plot', 'Amount (PKR)', 'Type', 'Date', 'Status'],
          payments.map(p => [p.receiptNumber, p.customerName, p.societyName, p.plotNumber, p.amount, p.type, p.date, p.status]),
        ))
        break
      case 'Installment Due':
        downloadCSV('installment-due.csv', toCSV(
          ['Booking #', 'Customer', 'Plot', 'Monthly Installment (PKR)', 'Remaining Balance (PKR)', 'Installments Paid'],
          bookings.filter(b => b.remainingBalance > 0).map(b => [b.bookingNumber, b.customerName, b.plotNumber, b.monthlyInstallment, b.remainingBalance, `${b.installmentsPaid}/${b.totalInstallments}`]),
        ))
        break
      case 'Defaulters Report':
        downloadCSV('defaulters-report.csv', toCSV(
          ['Booking #', 'Customer', 'Plot', 'Remaining Balance (PKR)', 'Installments Paid'],
          bookings.filter(b => b.status === 'active' && b.installmentsPaid === 0).map(b => [b.bookingNumber, b.customerName, b.plotNumber, b.remainingBalance, `${b.installmentsPaid}/${b.totalInstallments}`]),
        ))
        break
      case 'Available Inventory':
        downloadCSV('available-inventory.csv', toCSV(
          ['Society', 'Block', 'Plot #', 'Size', 'Category', 'Price (PKR)'],
          plots.filter(p => p.status === 'available').map(p => [p.societyName, p.block, p.number, p.size, p.category, p.price]),
        ))
        break
    }
  }

  return (
    <div className="p-6 max-w-screen-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Comprehensive business intelligence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            <FileSpreadsheet size={15} /> Export Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Monthly Revenue Trend</h3>
              <p className="text-xs text-slate-400">PKR — Last 12 months</p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-full">+22%</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rptRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => formatPKR(v)} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--brand)" strokeWidth={2} fill="url(#rptRevGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Society Sales */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Society Wise Sales</h3>
          <p className="text-xs text-slate-400 mb-4">Sold vs Booked vs Available</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={societyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sold" name="Sold" fill="#EF4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="booked" name="Booked" fill="#C9A227" radius={[3, 3, 0, 0]} />
              <Bar dataKey="available" name="Available" fill="var(--brand)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bookings Line */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Booking Trend</h3>
          <p className="text-xs text-slate-400 mb-4">New bookings per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="bookings" name="Bookings" stroke="#2563EB" strokeWidth={2} dot={{ fill: '#2563EB', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Collection */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-1">Payment Collection</h3>
          <p className="text-xs text-slate-400 mb-4">Payments collected per month</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="payments" name="Payments" fill="#C9A227" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Reports */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-4">Quick Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map(r => (
            <div key={r.title} onClick={() => handleQuickReport(r.title)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                <BarChart3 size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{r.title}</p>
                <p className="text-xs text-slate-400">{r.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full">{r.badge}</span>
                <Download size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
