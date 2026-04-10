'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus,
  Columns3,
  List,
  Star,
  Calendar,
  MapPin,
  MoreVertical,
  Trash2,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AddAppModal, type AppFormData } from '@/components/applications/add-app-modal'
import { statusConfig } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { authFetch } from '@/lib/api'
import type { Application, ApplicationStatus } from '@/types'
import toast from 'react-hot-toast'

const stages: ApplicationStatus[] = ['applied', 'phone_screen', 'interviewing', 'offer', 'rejected', 'ghosted']

function AppCard({ app, onDelete }: { app: Application; onDelete: (id: string) => void }) {
  const config = statusConfig[app.status]
  const isOverdue = app.next_action_date && new Date(app.next_action_date) < new Date()

  return (
    <div className="group rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <Link href={`/applications/${app.id}`} className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
            {app.company_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{app.company_name}</p>
            <p className="truncate text-xs text-slate-500">{app.role_title}</p>
          </div>
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault()
            onDelete(app.id)
          }}
          className="ml-1 rounded p-1 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 cursor-pointer"
        >
          <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>

      {app.location && (
        <div className="mb-2 flex items-center gap-1 text-xs text-slate-400">
          <MapPin className="h-3 w-3" />
          {app.location}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-3 w-3 ${n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-400">{app.applied_date}</span>
      </div>

      {app.next_action_date && (
        <div className={`mt-2 flex items-center gap-1 text-[11px] ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
          <Calendar className="h-3 w-3" />
          {app.next_action || 'Follow up'} · {app.next_action_date}
        </div>
      )}

      <div className="mt-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>
    </div>
  )
}

const badgeVariant = (status: string): 'info' | 'warning' | 'success' | 'danger' | 'ghost' | 'default' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'ghost'> = {
    applied: 'info',
    phone_screen: 'info',
    interviewing: 'warning',
    offer: 'success',
    rejected: 'danger',
    ghosted: 'ghost',
  }
  return map[status] || 'default'
}

export default function ApplicationsPage() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showAddModal, setShowAddModal] = useState(false)
  const { applications, loading, fetchApplications, deleteApplication, setApplications } = useApplications()

  const getAppsByStatus = useCallback(
    (status: ApplicationStatus) => applications.filter((a) => a.status === status),
    [applications]
  )

  const handleSave = async (data: AppFormData) => {
    try {
      const res = await authFetch('/api/applications/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: data.company_name,
          role_title: data.role_title,
          job_url: data.job_url || null,
          job_description: data.job_description || null,
          location: data.location || null,
          salary_min: data.salary_min ? parseInt(data.salary_min) : null,
          salary_max: data.salary_max ? parseInt(data.salary_max) : null,
          status: data.status,
          applied_date: data.applied_date,
          next_action: data.next_action || null,
          next_action_date: data.next_action_date || null,
          notes: data.notes || null,
          contacts: [],
          interview_rounds: [],
          excitement_level: data.excitement_level,
          source: data.source,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to save')
      }

      const created = await res.json()
      toast.success('Application added!')
      setApplications((prev) => [created, ...prev.filter((app) => app.id !== created.id)])
      setShowAddModal(false)
      fetchApplications()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add application')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return
    const { error } = await deleteApplication(id)
    if (error) toast.error('Failed to delete')
    else toast.success('Application deleted')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6 animate-fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900">Applications</h2>
            <Badge variant="default">{applications.length}</Badge>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              <button
                onClick={() => setView('kanban')}
                aria-pressed={view === 'kanban'}
                title="Board view"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  view === 'kanban' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Columns3 className="h-4 w-4" />
                Board
              </button>
              <button
                onClick={() => setView('list')}
                aria-pressed={view === 'list'}
                title="List view"
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  view === 'list' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>

            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        </div>

        {applications.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="mb-4 text-sm text-slate-400">No applications yet. Add your first one!</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        )}

        {view === 'kanban' && applications.length > 0 && (
          <div className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 items-start">
            {stages.map((stage) => {
              const config = statusConfig[stage]
              const stageApps = getAppsByStatus(stage)

              return (
                <section key={stage} className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${config.bg} ${config.text}`}>
                        {stageApps.length}
                      </span>
                    </div>
                    <button
                      className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-white"
                      onClick={() => setShowAddModal(true)}
                      title={`Add application to ${config.label}`}
                    >
                      <Plus className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {stageApps.map((app, i) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <AppCard app={app} onDelete={handleDelete} />
                      </motion.div>
                    ))}

                    {stageApps.length === 0 && (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/60 p-6 text-center">
                        <p className="text-xs text-slate-400">No applications in {config.label.toLowerCase()}</p>
                      </div>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {view === 'list' && applications.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-3 lg:hidden">
              {applications.map((app) => {
                const config = statusConfig[app.status]
                return (
                  <div key={app.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={`/applications/${app.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                          {app.company_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{app.company_name}</p>
                          <p className="truncate text-xs text-slate-500">{app.role_title}</p>
                        </div>
                      </Link>
                      <Badge variant={badgeVariant(app.status)}>{config.label}</Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Applied {app.applied_date}</span>
                      <span className="truncate">{app.next_action || 'No next step yet'}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3 w-3 ${n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/applications/${app.id}`}>
                          <button className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Card className="hidden overflow-hidden p-0 shadow-sm lg:block">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-slate-500 sm:table-cell">Applied</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-slate-500 md:table-cell">Next Action</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-slate-500 lg:table-cell">Excitement</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const config = statusConfig[app.status]
                    return (
                      <tr key={app.id} className="border-b border-slate-50 transition-colors hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <Link href={`/applications/${app.id}`} className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                              {app.company_name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-slate-900 transition-colors hover:text-emerald-600">
                              {app.company_name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{app.role_title}</td>
                        <td className="px-4 py-3">
                          <Badge variant={badgeVariant(app.status)}>{config.label}</Badge>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-slate-500 sm:table-cell">{app.applied_date}</td>
                        <td className="hidden px-4 py-3 text-sm text-slate-500 md:table-cell">{app.next_action || '—'}</td>
                        <td className="hidden px-4 py-3 lg:table-cell">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`h-3 w-3 ${
                                  n <= app.excitement_level ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/applications/${app.id}`}>
                              <button className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-slate-100">
                                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(app.id)}
                              className="cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </div>

      <AddAppModal open={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleSave} />
    </>
  )
}
