'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, Plus, Check, Clock, AlertCircle, Calendar,
  Mail, MessageSquare, Target, BookOpen, Loader2, Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { authFetch } from '@/lib/api'
import type { Reminder, ReminderType } from '@/types'
import toast from 'react-hot-toast'

const reminderTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  follow_up:      { icon: Mail,          label: 'Follow Up' },
  thank_you:      { icon: MessageSquare, label: 'Thank You' },
  check_in:       { icon: Clock,         label: 'Check In' },
  deadline:       { icon: Target,        label: 'Deadline' },
  interview_prep: { icon: BookOpen,      label: 'Interview Prep' },
}

function getDateGroup(dateStr: string, isDone: boolean): string {
  if (isDone) return 'Done'
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff <= 7) return 'This Week'
  return 'Later'
}

function getBorderColor(group: string): string {
  switch (group) {
    case 'Overdue':   return 'border-l-red-500'
    case 'Today':     return 'border-l-amber-500'
    case 'Tomorrow':  return 'border-l-amber-400'
    case 'This Week': return 'border-l-emerald-500'
    case 'Later':     return 'border-l-emerald-400'
    default:          return 'border-l-slate-300'
  }
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<ReminderType>('follow_up')
  const [dueDate, setDueDate] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    authFetch('/api/reminders')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setReminders(d) })
      .catch(() => toast.error('Failed to load reminders'))
      .finally(() => setLoading(false))
  }, [])

  const toggleDone = async (id: string, currentDone: boolean) => {
    const res = await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !currentDone }),
    })
    if (res.ok) {
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, is_done: !currentDone } : r))
    } else {
      toast.error('Failed to update reminder')
    }
  }

  const snooze = async (id: string) => {
    const newDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    const res = await fetch(`/api/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ due_date: newDate }),
    })
    if (res.ok) {
      setReminders((prev) => prev.map((r) => r.id === id ? { ...r, due_date: newDate } : r))
      toast.success('Snoozed 3 days')
    } else {
      toast.error('Failed to snooze')
    }
  }

  const deleteReminder = async (id: string) => {
    // Optimistic
    setReminders((prev) => prev.filter((r) => r.id !== id))
    const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Failed to delete')
      // Re-fetch to restore
      authFetch('/api/reminders').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setReminders(d) })
    }
  }

  const handleSave = async () => {
    if (!title || !dueDate) { toast.error('Title and due date are required'); return }
    setSaving(true)
    try {
      const res = await authFetch('/api/reminders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          reminder_type: selectedType,
          due_date: new Date(dueDate).toISOString(),
          description: note || null,
          is_done: false,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const created = await res.json()
      setReminders((prev) => [created, ...prev])
      toast.success('Reminder added!')
      setShowAddModal(false)
      setTitle(''); setDueDate(''); setNote(''); setSelectedType('follow_up')
    } catch {
      toast.error('Failed to add reminder')
    } finally {
      setSaving(false)
    }
  }

  const filteredReminders = reminders.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'done') return r.is_done
    const group = getDateGroup(r.due_date, r.is_done)
    if (filter === 'overdue') return group === 'Overdue'
    if (filter === 'today') return group === 'Today'
    if (filter === 'week') return ['Today', 'Tomorrow', 'This Week'].includes(group)
    return true
  })

  const grouped = filteredReminders.reduce<Record<string, Reminder[]>>((acc, r) => {
    const group = getDateGroup(r.due_date, r.is_done)
    if (!acc[group]) acc[group] = []
    acc[group].push(r)
    return acc
  }, {})

  const groupOrder = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Later', 'Done']

  const overdue  = reminders.filter((r) => !r.is_done && getDateGroup(r.due_date, false) === 'Overdue').length
  const todayCnt = reminders.filter((r) => !r.is_done && getDateGroup(r.due_date, false) === 'Today').length
  const upcoming = reminders.filter((r) => !r.is_done && !['Overdue', 'Today'].includes(getDateGroup(r.due_date, false))).length
  const done     = reminders.filter((r) => r.is_done).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Overdue',   value: overdue,   color: 'text-red-500',     bg: 'bg-red-50',     icon: AlertCircle, topBorder: 'border-t-2 border-t-red-400' },
          { label: 'Due Today', value: todayCnt,  color: 'text-amber-500',   bg: 'bg-amber-50',   icon: Clock,       topBorder: 'border-t-2 border-t-amber-400' },
          { label: 'Upcoming',  value: upcoming,  color: 'text-emerald-500', bg: 'bg-emerald-50', icon: Calendar,    topBorder: 'border-t-2 border-t-emerald-400' },
          { label: 'Done',      value: done,      color: 'text-slate-500',   bg: 'bg-slate-100',  icon: Check,       topBorder: 'border-t-2 border-t-slate-300' },
        ].map((stat) => (
          <Card key={stat.label} className={`relative ${stat.topBorder}`}>
            <div className={`absolute top-3 right-3 w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <div className="pt-1 pr-10">
              <p className="text-3xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'done', label: 'Done' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filter === f.key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> Add Reminder
        </Button>
      </div>

      {reminders.length === 0 && (
        <div className="text-center py-16">
          <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No reminders yet. Add your first one!</p>
        </div>
      )}

      {/* Reminder Groups */}
      {groupOrder.map((group) => {
        const items = grouped[group]
        if (!items || items.length === 0) return null
        return (
          <div key={group}>
            <h3 className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
              group === 'Overdue' ? 'text-red-500' : 'text-slate-400'
            }`}>{group}</h3>
            <div className="space-y-2">
              {items.map((reminder, i) => {
                const typeConfig = reminderTypeConfig[reminder.reminder_type]
                const TypeIcon = typeConfig?.icon || Bell
                return (
                  <motion.div
                    key={reminder.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className={`border-l-4 ${getBorderColor(group)} ${reminder.is_done ? 'opacity-60' : ''} px-5 py-4`}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleDone(reminder.id, reminder.is_done)} className="mt-0.5 cursor-pointer flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            reminder.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'
                          }`}>
                            {reminder.is_done && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <p className={`text-[15px] font-semibold ${reminder.is_done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {reminder.title}
                            </p>
                          </div>
                          {(reminder as Reminder & { application?: { company_name: string; role_title: string } }).application && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {(reminder as Reminder & { application?: { company_name: string; role_title: string } }).application?.company_name} —{' '}
                              {(reminder as Reminder & { application?: { company_name: string; role_title: string } }).application?.role_title}
                            </p>
                          )}
                          {reminder.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-[12px] font-medium text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(reminder.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="mt-1.5">
                            <Badge variant="default">{typeConfig?.label || reminder.reminder_type}</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!reminder.is_done && (
                            <Button variant="ghost" size="sm" onClick={() => snooze(reminder.id)}>
                              Snooze 3d
                            </Button>
                          )}
                          <button
                            onClick={() => deleteReminder(reminder.id)}
                            className="p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 transition-colors" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Add Reminder Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Reminder" size="md">
        <div className="p-6 space-y-4">
          <Input
            id="reminderTitle"
            label="Title"
            placeholder="Follow up with..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(reminderTypeConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedType(key as ReminderType)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    selectedType === key
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-emerald-400'
                  }`}
                >
                  <config.icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            id="dueDate"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Note (optional)</label>
            <textarea
              rows={3}
              placeholder="Optional note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !title || !dueDate}>
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Reminder'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
