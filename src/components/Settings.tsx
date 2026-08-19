import { useEffect, useRef, useState } from 'react'
import { Building2, Palette, Users, FileText, Database, Save, Check, Upload, X, Eye, Pencil, UploadCloud, AlertTriangle, UserPlus, RotateCcw } from 'lucide-react'
import { useAppStore, type BackupSnapshot, type SystemUser } from '../store/AppStore'
import { useToast } from './Toast'

const tabs = [
  { id: 'company', label: 'Company Profile', icon: <Building2 size={15} /> },
  { id: 'theme', label: 'Theme', icon: <Palette size={15} /> },
  { id: 'users', label: 'Users', icon: <Users size={15} /> },
  { id: 'templates', label: 'Templates', icon: <FileText size={15} /> },
  { id: 'backup', label: 'Backup', icon: <Database size={15} /> },
]

const ROLE_OPTIONS: SystemUser['role'][] = ['Super Admin', 'Manager', 'Dealer', 'Accountant']

interface TemplateMeta {
  title: string
  fields: string[]
}

const TEMPLATES: TemplateMeta[] = [
  { title: 'Booking Form', fields: ['Customer Name', 'CNIC', 'Plot Number', 'Total Price', 'Down Payment', 'Booking Date'] },
  { title: 'Payment Receipt', fields: ['Receipt #', 'Customer Name', 'Amount', 'Payment Type', 'Date', 'Collected By'] },
  { title: 'Installment Schedule', fields: ['Booking #', 'Monthly Installment', 'Total Installments', 'Start Date'] },
  { title: 'Transfer Letter', fields: ['From Customer', 'To Customer', 'Plot Number', 'Transfer Fee', 'Date'] },
  { title: 'Possession Certificate', fields: ['Customer Name', 'Plot Number', 'Possession Date', 'Society'] },
]

const emptyInviteForm = { name: '', email: '', role: 'Manager' as SystemUser['role'] }

const COMPANY_STORAGE_KEY = 'akg-company-profile'

const defaultCompanyForm = {
  name: 'Al-Khidmat Gujjar Real Estate',
  tagline: 'Property Advisors',
  phone: '0300-1234567',
  email: 'info@alkhidmat.pk',
  address: 'Main Office, GT Road, Gujranwala',
  city: 'Gujranwala',
  ntn: '1234567-8',
  website: 'www.alkhidmatrealestate.pk',
  logo: '' as string,
}

function loadCompanyForm(): typeof defaultCompanyForm {
  if (typeof window === 'undefined') return defaultCompanyForm
  try {
    const raw = window.localStorage.getItem(COMPANY_STORAGE_KEY)
    if (!raw) return defaultCompanyForm
    return { ...defaultCompanyForm, ...JSON.parse(raw) }
  } catch {
    return defaultCompanyForm
  }
}

export default function Settings() {
  const { themeColor, setThemeColor, darkMode, setDarkMode, exportBackup, restoreBackup, users, inviteUser, updateUserStatus, templateOverrides, setTemplateOverride, resetToDemoData } = useAppStore()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState('company')
  const [saved, setSaved] = useState(false)
  const [companyForm, setCompanyForm] = useState(loadCompanyForm)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = useState('')

  const handleLogoFile = (file: File | null) => {
    if (!file) return
    setLogoError('')
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG or JPG)')
      showToast('Logo upload failed — not an image file', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Image must be 2MB or smaller')
      showToast('Logo upload failed — file is larger than 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCompanyForm(p => ({ ...p, logo: reader.result as string }))
      showToast('Logo uploaded', 'success')
    }
    reader.onerror = () => {
      setLogoError('Could not read that file — please try another image')
      showToast('Logo upload failed', 'error')
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setCompanyForm(p => ({ ...p, logo: '' }))
    if (logoInputRef.current) logoInputRef.current.value = ''
    showToast('Logo removed', 'info')
  }

  // Company profile (including the logo) saves to localStorage as it
  // changes, so it survives a refresh without waiting for "Save Changes".
  useEffect(() => {
    try { window.localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyForm)) } catch { /* storage unavailable */ }
  }, [companyForm])

  // Invite User modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState(emptyInviteForm)
  const [inviteError, setInviteError] = useState('')

  // Reset to demo data confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Per-template editable content — Edit modal writes here, Preview reads from here.
  // Persisted via the app store so edits survive a refresh.
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMeta | null>(null)
  const [editTemplate, setEditTemplate] = useState<TemplateMeta | null>(null)
  const [editDraft, setEditDraft] = useState({ footer: '', note: '' })

  // Backup / restore
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('akg-last-backup-at')
  })
  const [lastBackupJSON, setLastBackupJSON] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('akg-last-backup-json')
  })
  const [restoreError, setRestoreError] = useState('')
  const [restoreSuccess, setRestoreSuccess] = useState(false)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    setSaved(true)
    showToast('Company profile saved', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  const handleApplyTheme = () => {
    setSaved(true)
    showToast('Theme applied', 'success')
    setTimeout(() => setSaved(false), 2000)
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const handleInvite = () => {
    if (!inviteForm.name.trim()) { setInviteError('Name is required'); return }
    if (!EMAIL_RE.test(inviteForm.email.trim())) { setInviteError('Enter a valid email address'); return }
    if (users.some(u => u.email.toLowerCase() === inviteForm.email.trim().toLowerCase())) {
      setInviteError('A user with this email already exists'); return
    }
    setInviteError('')
    inviteUser({ name: inviteForm.name.trim(), email: inviteForm.email.trim(), role: inviteForm.role })
    showToast(`Invite sent to ${inviteForm.name.trim()}`, 'success')
    setShowInvite(false)
    setInviteForm(emptyInviteForm)
  }

  const handleToggleUserStatus = (u: SystemUser) => {
    const next = u.status === 'active' ? 'inactive' : 'active'
    updateUserStatus(u.id, next)
    showToast(`${u.name} is now ${next}`, 'info')
  }

  const handleResetToDemo = () => {
    resetToDemoData()
    setShowResetConfirm(false)
    showToast('Data reset to the original demo dataset', 'success')
  }

  const downloadJSON = (filename: string, data: unknown) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return json
  }

  const handleBackupNow = () => {
    const snapshot = exportBackup()
    const json = downloadJSON(`akg-backup-${new Date().toISOString().slice(0, 10)}.json`, snapshot)
    const now = new Date().toISOString()
    setLastBackupAt(now)
    setLastBackupJSON(json)
    try {
      window.localStorage.setItem('akg-last-backup-at', now)
      window.localStorage.setItem('akg-last-backup-json', json)
    } catch { /* storage unavailable */ }
    showToast('Backup created and downloaded', 'success')
  }

  const handleDownloadLastBackup = () => {
    if (!lastBackupJSON) { handleBackupNow(); return }
    downloadJSON(`akg-backup-${(lastBackupAt ?? new Date().toISOString()).slice(0, 10)}.json`, JSON.parse(lastBackupJSON))
  }

  const handleRestoreFile = (file: File | null) => {
    if (!file) return
    setRestoreError('')
    setRestoreSuccess(false)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const snapshot = JSON.parse(reader.result as string) as BackupSnapshot
        if (!snapshot.societies || !snapshot.plots) throw new Error('Not a valid Al-Khidmat backup file')
        restoreBackup(snapshot)
        setRestoreSuccess(true)
        showToast('Data restored from backup', 'success')
        setTimeout(() => setRestoreSuccess(false), 2500)
      } catch {
        setRestoreError('This file could not be read as a valid backup — please choose a JSON backup exported from this app.')
        showToast('Restore failed — invalid backup file', 'error')
      }
    }
    reader.readAsText(file)
  }

  const openPreview = (t: TemplateMeta) => setPreviewTemplate(t)
  const openEdit = (t: TemplateMeta) => {
    setEditTemplate(t)
    setEditDraft(templateOverrides[t.title] ?? { footer: 'Thank you for choosing Al-Khidmat Gujjar Real Estate.', note: '' })
  }
  const saveEdit = () => {
    if (!editTemplate) return
    setTemplateOverride(editTemplate.title, editDraft)
    showToast(`${editTemplate.title} template updated`, 'success')
    setEditTemplate(null)
  }

  const buildTemplatePreviewHTML = (t: TemplateMeta) => {
    const override = templateOverrides[t.title]
    const rows = t.fields.map(f => `<div class="row"><span class="label">${f}</span><span class="value">—</span></div>`).join('')
    return `
      <!DOCTYPE html><html><head><meta charset="utf-8" /><title>${t.title} — Preview</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1e293b; max-width: 520px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
        .business { font-size: 20px; font-weight: 800; }
        .tag { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
        h2 { font-size: 15px; margin: 0 0 16px; text-align: center; }
        .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 8px 0; font-size: 13px; }
        .row .label { color: #94a3b8; }
        .row .value { font-weight: 600; color: #cbd5e1; }
        .note { background: #f8fafc; border-radius: 10px; padding: 12px; font-size: 12px; color: #64748b; margin-top: 16px; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; }
        .watermark { text-align: center; font-size: 10px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; }
        @media print { body { padding: 12px; } }
      </style></head>
      <body>
        <p class="watermark">Template preview — sample data</p>
        <div class="header">
          <p class="business">Al-Khidmat Gujjar Real Estate</p>
          <p class="tag">Property Advisors · Gujranwala</p>
        </div>
        <h2>${t.title}</h2>
        ${rows}
        ${override?.note ? `<div class="note"><strong>Note:</strong> ${override.note}</div>` : ''}
        <p class="footer">${override?.footer || 'Thank you for choosing Al-Khidmat Gujjar Real Estate.'}</p>
      </body></html>`
  }

  const handlePreviewOpen = (t: TemplateMeta) => {
    const w = window.open('', '_blank', 'width=560,height=760')
    if (!w) { openPreview(t); return }
    w.document.write(buildTemplatePreviewHTML(t))
    w.document.close()
  }

  return (
    <div className="p-6 max-w-screen-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage company profile, users, and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-52 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left border-b border-slate-50 last:border-0 ${activeTab === tab.id ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className={activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Company Profile</h2>
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                  {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
              <div className="p-6">
                {/* Logo Upload */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleLogoFile(e.target.files?.[0] ?? null)}
                />
                {companyForm.logo ? (
                  <div className="mb-6 p-4 border border-slate-200 rounded-xl flex items-center gap-4">
                    <img src={companyForm.logo} alt="Company logo" className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-100 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">Company logo</p>
                      <p className="text-xs text-slate-400">Shown on the login screen</p>
                      <p className="text-xs text-slate-300 mt-0.5">Saved automatically — no need to click Save Changes for this</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') logoInputRef.current?.click() }}
                    className="mb-6 p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-300 transition-colors text-center cursor-pointer group"
                  >
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-200 transition-colors">
                      <Upload size={24} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Upload Company Logo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB · Recommended 200×200px</p>
                  </div>
                )}
                {logoError && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1.5 -mt-4 mb-6"><AlertTriangle size={13} /> {logoError}</p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Company Name', key: 'name' },
                    { label: 'Tagline', key: 'tagline' },
                    { label: 'Phone', key: 'phone' },
                    { label: 'Email', key: 'email' },
                    { label: 'NTN Number', key: 'ntn' },
                    { label: 'Website', key: 'website' },
                    { label: 'City', key: 'city' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                      <input
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                        value={(companyForm as any)[f.key]}
                        onChange={e => setCompanyForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Address</label>
                    <input
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      value={companyForm.address}
                      onChange={e => setCompanyForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-800 mb-5">Theme & Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">Primary Color</label>
                  <div className="flex items-center gap-4">
                    <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200" />
                    <div className="flex gap-2">
                      {['#0F766E', '#2563EB', '#C9A227', '#7C3AED', '#DC2626', '#0369A1'].map(c => (
                        <button key={c} onClick={() => setThemeColor(c)}
                          className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${themeColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2' : ''}`}
                          style={{ background: c, ['--tw-ring-color' as any]: c }} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Applies instantly across the whole app — sidebar, buttons, charts and headers all follow this color.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">Dark Mode</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !darkMode
                      setDarkMode(next)
                      showToast(next ? 'Dark mode enabled' : 'Dark mode disabled', 'info')
                    }}
                    className="flex items-center gap-3"
                  >
                    <span
                      className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                      style={{ background: darkMode ? 'var(--brand)' : '#CBD5E1' }}
                    >
                      <span
                        className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                        style={{ transform: darkMode ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </span>
                    <span className="text-sm text-slate-600">{darkMode ? 'Dark mode on' : 'Light mode (default)'}</span>
                  </button>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 block">Font Size</label>
                  <div className="flex gap-2">
                    {['Small', 'Medium', 'Large'].map((size, i) => (
                      <button key={size} className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${i === 1 ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleApplyTheme} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: saved ? '#10B981' : 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                  {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Apply Theme</>}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">System Users</h2>
                <button
                  onClick={() => { setInviteForm(emptyInviteForm); setInviteError(''); setShowInvite(true) }}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                  <UserPlus size={14} /> Invite User
                </button>
              </div>
              {users.length > 0 ? (
                <table className="w-full premium-table">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Role</th>
                      <th className="text-left">Status</th>
                      <th className="text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="font-medium text-sm text-slate-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="text-sm text-slate-500">{u.email}</td>
                        <td>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{u.role}</span>
                        </td>
                        <td>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleToggleUserStatus(u)} className="text-xs text-slate-400 hover:text-slate-700 font-medium">
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-14 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Users size={22} />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">No users yet</p>
                  <p className="text-xs text-slate-400">Invite your team to give them access to this dashboard.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="font-semibold text-slate-800">Document Templates</h2>
              {TEMPLATES.map(t => (
                <div key={t.title} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-400">
                        PDF Template · {templateOverrides[t.title] ? 'Customized' : 'Default'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handlePreviewOpen(t)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium">
                      <Eye size={12} /> Preview
                    </button>
                    <button onClick={() => openEdit(t)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium">
                      <Pencil size={12} /> Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
              <h2 className="font-semibold text-slate-800">Data Backup & Restore</h2>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-800">Last Backup</p>
                <p className="text-xs text-emerald-600 mt-1">
                  {lastBackupAt
                    ? new Date(lastBackupAt).toLocaleString('en-PK', { dateStyle: 'long', timeStyle: 'short' })
                    : 'No backup created yet in this session'}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Database size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Create Manual Backup</p>
                      <p className="text-xs text-slate-400">Downloads all societies, plots, bookings, customers, payments, dealers and investors as a JSON file</p>
                    </div>
                  </div>
                  <button onClick={handleBackupNow} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: 'var(--brand)' }}>
                    Backup Now
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Database size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Download Last Backup</p>
                      <p className="text-xs text-slate-400">{lastBackupAt ? new Date(lastBackupAt).toLocaleDateString('en-PK', { dateStyle: 'medium' }) : 'Creates one first if none exists yet'}</p>
                    </div>
                  </div>
                  <button onClick={handleDownloadLastBackup} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: 'var(--brand)' }}>
                    Download
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                      <UploadCloud size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Restore from Backup</p>
                      <p className="text-xs text-slate-400">Upload a backup JSON file to restore data — this replaces all current data</p>
                    </div>
                  </div>
                  <button onClick={() => restoreInputRef.current?.click()} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: 'var(--brand)' }}>
                    Restore
                  </button>
                  <input ref={restoreInputRef} type="file" accept="application/json" className="hidden"
                    onChange={e => { handleRestoreFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
                </div>

                {restoreError && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1.5"><AlertTriangle size={13} /> {restoreError}</p>
                )}
                {restoreSuccess && (
                  <p className="text-xs font-medium text-emerald-600 flex items-center gap-1.5"><Check size={13} /> Data restored successfully.</p>
                )}
              </div>

              {/* Danger zone */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 mt-4">Danger Zone</p>
                <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                      <RotateCcw size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Reset to Demo Data</p>
                      <p className="text-xs text-slate-400">Wipes all your changes and restores the original sample dataset — an escape hatch back to a clean slate</p>
                    </div>
                  </div>
                  <button onClick={() => setShowResetConfirm(true)} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-600 flex-shrink-0">
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Invite User</h2>
              <button onClick={() => setShowInvite(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="Muhammad Ali Khan" value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Email</label>
                <input type="email" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="name@alkhidmat.pk" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Role</label>
                <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value as SystemUser['role'] }))}>
                  {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {inviteError && <p className="text-xs font-medium text-red-500 flex items-center gap-1.5"><AlertTriangle size={13} /> {inviteError}</p>}
              <p className="text-xs text-slate-400">This is a local demo — invited users are added instantly with no email actually sent.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowInvite(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={handleInvite} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                <UserPlus size={14} /> Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Demo Data confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-2">Reset all data?</h2>
              <p className="text-sm text-slate-500">
                This permanently replaces every society, booking, payment, customer, dealer, investor, user and template customization with the original demo dataset. This can't be undone.
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleResetToDemo} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600">Reset Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback in-app preview — shown only if the browser blocked the pop-up window */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPreviewTemplate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">{previewTemplate.title} — Preview</h2>
              <button onClick={() => setPreviewTemplate(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-2">
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-2">Your browser blocked the pop-up preview window, so here's an inline preview with sample data instead.</p>
              {previewTemplate.fields.map(f => (
                <div key={f} className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-400">{f}</span>
                  <span className="text-xs font-semibold text-slate-300">—</span>
                </div>
              ))}
              {templateOverrides[previewTemplate.title]?.note && (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500 mt-2">
                  <span className="font-semibold text-slate-600">Note: </span>{templateOverrides[previewTemplate.title].note}
                </div>
              )}
              <p className="text-xs text-slate-400 text-center pt-3">
                {templateOverrides[previewTemplate.title]?.footer || 'Thank you for choosing Al-Khidmat Gujjar Real Estate.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditTemplate(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
              <h2 className="text-lg font-bold text-white">Edit {editTemplate.title}</h2>
              <button onClick={() => setEditTemplate(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Fields on this document</label>
                <div className="flex flex-wrap gap-1.5">
                  {editTemplate.fields.map(f => (
                    <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">{f}</span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Extra Note (optional)</label>
                <textarea rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  placeholder="e.g. Valid only with company stamp"
                  value={editDraft.note} onChange={e => setEditDraft(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Footer Text</label>
                <input className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  value={editDraft.footer} onChange={e => setEditDraft(p => ({ ...p, footer: e.target.value }))} />
              </div>
              <p className="text-xs text-slate-400">Layout and field order for this template type are fixed; this saves the note and footer that print on it.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setEditTemplate(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50">Cancel</button>
              <button onClick={saveEdit} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-light))' }}>
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
