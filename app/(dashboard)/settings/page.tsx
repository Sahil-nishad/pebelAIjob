'use client'

import { useState, useEffect } from 'react'
import {
  Download,
  Trash2,
  Send,
  CheckCircle2,
  Loader2,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/api'
import { useUser } from '@/hooks/useUser'
import toast from 'react-hot-toast'

const tabs = [
  { key: 'profile', label: 'Profile' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'danger', label: 'Danger' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, profile, signOut } = useUser()

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  // Profile
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [location, setLocation] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Preferences
  const [targetRoles, setTargetRoles] = useState('')
  const [targetCompanies, setTargetCompanies] = useState('')
  const [jobTypes, setJobTypes] = useState<string[]>([])
  const [expLevel, setExpLevel] = useState('')
  const [salaryMin, setSalaryMin] = useState('')
  const [salaryMax, setSalaryMax] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)

  // Notifications
  const [emailDigest, setEmailDigest] = useState('daily')
  const [followUpDays, setFollowUpDays] = useState(7)
  const [prepDays, setPrepDays] = useState(2)
  const [savingNotif, setSavingNotif] = useState(false)
  const [testEmailSent, setTestEmailSent] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deletingApps, setDeletingApps] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile])

  async function saveProfile() {
    setSavingProfile(true)
    try {
      const res = await authFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, title, linkedin, location }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePreferences() {
    setSavingPrefs(true)
    try {
      const res = await authFetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_roles: targetRoles.split(',').map((s) => s.trim()).filter(Boolean),
          target_companies: targetCompanies.split(',').map((s) => s.trim()).filter(Boolean),
          job_type: jobTypes.join(',') || null,
          experience_level: expLevel || null,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Preferences saved!')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  async function saveNotificationSettings() {
    setSavingNotif(true)
    try {
      const res = await authFetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_digest: emailDigest,
          follow_up_days: followUpDays,
          interview_prep_days: prepDays,
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Notification settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingNotif(false)
    }
  }

  async function sendTestEmail() {
    setSendingTest(true)
    try {
      const res = await authFetch('/api/email/test', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to send test email')
      }
      setTestEmailSent(true)
      toast.success('Test email sent! Check your inbox.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send test email')
    } finally {
      setSendingTest(false)
    }
  }

  async function exportData() {
    setExporting(true)
    try {
      const res = await authFetch('/api/settings/export')
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pebelai-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Data exported!')
    } catch {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  async function deleteAllApps() {
    if (!confirm('Are you sure you want to delete ALL applications? This cannot be undone.')) return
    setDeletingApps(true)
    try {
      const res = await authFetch('/api/settings/delete-apps', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('All applications deleted')
    } catch {
      toast.error('Failed to delete applications')
    } finally {
      setDeletingApps(false)
    }
  }

  async function deleteAccount() {
    if (!confirm('FINAL WARNING: This will permanently delete your account and all data. Continue?')) return
    setDeletingAccount(true)
    try {
      const res = await authFetch('/api/settings/delete-account', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      toast.success('Account deleted. Redirecting...')
      window.location.href = '/login'
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  const toggleJobType = (type: string) => {
    setJobTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type])
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">

      {/* Mobile user card — only visible on mobile */}
      <div className="md:hidden">
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[18px] font-bold text-white shadow-sm shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-slate-900 truncate">{displayName}</p>
              <p className="text-[12px] text-slate-400 truncate">{displayEmail}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 border border-red-100 text-[13px] font-semibold text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 pb-3">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer rounded-full ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <Card>
          <h3 className="text-[15px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-6">Profile</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg font-bold text-white shadow-sm">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Profile photo coming soon</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input id="fullName" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input id="email" label="Email" value={displayEmail} disabled />
            <Input id="phone" label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input id="title" label="Title" placeholder="Senior Product Manager" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input id="linkedin" label="LinkedIn" placeholder="linkedin.com/in/you" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            <Input id="location" label="Location" placeholder="San Francisco, CA" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save changes'}
            </Button>
          </div>
        </Card>
      )}

      {/* Preferences */}
      {activeTab === 'preferences' && (
        <Card>
          <h3 className="text-[15px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-1">Job Preferences</h3>
          <p className="text-[12px] text-slate-400 mb-6">Used as context for AI Coach personalization.</p>
          <div className="space-y-4">
            <Input id="targetRoles" label="Target Roles" placeholder="Product Manager, Software Engineer" value={targetRoles} onChange={(e) => setTargetRoles(e.target.value)} />
            <Input id="targetCompanies" label="Target Companies" placeholder="Google, Meta, Stripe" value={targetCompanies} onChange={(e) => setTargetCompanies(e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-slate-700">Job Type</label>
              <div className="flex flex-wrap gap-2">
                {['Full-time', 'Part-time', 'Contract', 'Remote only'].map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleJobType(type)}
                    className={`px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                      jobTypes.includes(type)
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-slate-700">Experience Level</label>
              <div className="flex gap-2">
                {['Entry', 'Mid', 'Senior', 'Executive'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setExpLevel(level)}
                    className={`flex-1 py-2 rounded-lg border text-[12px] font-medium transition-all cursor-pointer ${
                      expLevel === level
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                        : 'border-slate-200 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input id="salaryMin" label="Salary Min" type="number" placeholder="100000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
              <Input id="salaryMax" label="Salary Max" type="number" placeholder="200000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={savePreferences} disabled={savingPrefs}>
              {savingPrefs ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save preferences'}
            </Button>
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-[15px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-1">Email Notifications</h3>
            <p className="text-[12px] text-slate-400 mb-6">
              PebelAI sends reminders and updates to your login email address.
            </p>
            <div className="space-y-6">

              {/* Email digest frequency */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-slate-700">Email Frequency</label>
                <p className="text-[11px] text-slate-400">How often you receive reminder emails.</p>
                <div className="flex gap-2 mt-2">
                  {[
                    { key: 'daily', label: 'Daily', desc: 'One digest each morning' },
                    { key: 'weekly', label: 'Weekly', desc: 'Summary every Monday' },
                    { key: 'instant', label: 'Instant', desc: 'Email per reminder' },
                    { key: 'never', label: 'Never', desc: 'No emails' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setEmailDigest(opt.key)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer border text-left ${
                        emailDigest === opt.key
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className={`text-[10px] mt-0.5 ${emailDigest === opt.key ? 'text-emerald-100' : 'text-slate-400'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* What you receive */}
              {emailDigest !== 'never' && (
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-slate-700">What you&apos;ll receive</label>
                  <div className="space-y-2">
                    {[
                      { icon: '✅', label: 'Application confirmed', desc: 'When you add a new application' },
                      { icon: '🔔', label: 'Reminder due', desc: 'When a follow-up or prep reminder is due' },
                      { icon: '🎯', label: 'Interview scheduled', desc: 'Calendar invite + prep tips when you log an interview' },
                      { icon: '📋', label: 'Daily digest', desc: 'Morning summary of all upcoming reminders' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-base mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-[12px] font-medium text-slate-700">{item.label}</p>
                          <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminder timing */}
              {emailDigest !== 'never' && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-slate-700">Follow-up reminder after</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={3} max={14} value={followUpDays} onChange={(e) => setFollowUpDays(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                      <span className="text-[13px] font-medium text-slate-900 w-16 text-right">{followUpDays} days</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Days after applying before we remind you to follow up.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-slate-700">Interview prep reminder</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={1} max={7} value={prepDays} onChange={(e) => setPrepDays(Number(e.target.value))} className="flex-1 accent-emerald-500" />
                      <span className="text-[13px] font-medium text-slate-900 w-20 text-right">{prepDays} days before</span>
                    </div>
                    <p className="text-[11px] text-slate-400">How early we remind you to prep for an interview.</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={sendTestEmail}
                disabled={sendingTest || emailDigest === 'never'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {testEmailSent
                  ? <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Test sent!</>
                  : <><Send className="w-3.5 h-3.5" /> {sendingTest ? 'Sending…' : 'Send test email'}</>
                }
              </button>
              <Button onClick={saveNotificationSettings} disabled={savingNotif}>
                {savingNotif ? 'Saving…' : 'Save settings'}
              </Button>
            </div>
          </Card>

          {/* Calendar info card */}
          <Card>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900 mb-1">Calendar Integration</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Every reminder and interview email includes a <strong>Google Calendar</strong> link and an
                  <strong> .ics file</strong> for Apple Calendar and Outlook — so events are automatically
                  added to your calendar with one click.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-slate-900">Export All Data</h3>
                <p className="text-[12px] text-slate-400">Download everything as JSON</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportData} disabled={exporting}>
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Export
              </Button>
            </div>
          </Card>
          <Card className="border-red-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-red-600">Delete All Applications</h3>
                <p className="text-[12px] text-slate-400">This cannot be undone</p>
              </div>
              <Button variant="danger" size="sm" onClick={deleteAllApps} disabled={deletingApps}>
                {deletingApps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
              </Button>
            </div>
          </Card>
          <Card className="border-red-200/60">
            <h3 className="text-[13px] font-semibold text-red-600 mb-2">Delete Account</h3>
            <p className="text-[12px] text-slate-400 mb-3">Type &quot;DELETE MY ACCOUNT&quot; to confirm.</p>
            <div className="flex gap-2">
              <Input id="deleteConfirm" placeholder='Type "DELETE MY ACCOUNT"' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
              <Button
                variant="danger"
                disabled={deleteConfirm !== 'DELETE MY ACCOUNT' || deletingAccount}
                onClick={deleteAccount}
              >
                {deletingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
