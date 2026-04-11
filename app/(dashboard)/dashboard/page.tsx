'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase, Calendar, TrendingUp, BarChart3,
  Plus, Clock, AlertCircle, CheckCircle2,
  ArrowRight, ChevronRight, Loader2, Zap,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { statusConfig } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { useUser } from '@/hooks/useUser'
import { authFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Stats { total: number; interviews: number; offerRate: number; responseRate: number }
interface ActivityEntry { id: string; event_type: string; event_data: Record<string, string>; created_at: string }

const statConfig = [
  { key: 'total', label: 'Applied', sub: 'total tracked', icon: Briefcase, accent: 'bg-blue-500', soft: 'bg-blue-50', text: 'text-blue-600', border: 'border-t-blue-400' },
  { key: 'interviews', label: 'Interviews', sub: 'in progress', icon: Calendar, accent: 'bg-violet-500', soft: 'bg-violet-50', text: 'text-violet-600', border: 'border-t-violet-400' },
  { key: 'offerRate', label: 'Offer Rate', sub: 'of all apps', icon: TrendingUp, accent: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-t-emerald-400', pct: true },
  { key: 'responseRate', label: 'Response', sub: 'response rate', icon: BarChart3, accent: 'bg-amber-500', soft: 'bg-amber-50', text: 'text-amber-600', border: 'border-t-amber-400', pct: true },
]

const activityIcons: Record<string, { icon: string; color: string }> = {
  applied: { icon: '📋', color: 'bg-blue-50 text-blue-500' },
  stage_change: { icon: '🔄', color: 'bg-violet-50 text-violet-500' },
  note_added: { icon: '📝', color: 'bg-amber-50 text-amber-500' },
  interview_scheduled: { icon: '📅', color: 'bg-emerald-50 text-emerald-500' },
}

export default function DashboardPage() {
  const { applications, loading: appsLoading } = useApplications()
  const { user, profile } = useUser()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [now] = useState(() => Date.now())

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  useEffect(() => {
    authFetch('/api/applications/stats')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fetchActivity = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
        .limit(8)
      if (data) setActivity(data)
    }
    fetchActivity()
  }, [])

  const pipeline = {
    applied: applications.filter((a) => a.status === 'applied'),
    phone_screen: applications.filter((a) => a.status === 'phone_screen'),
    interviewing: applications.filter((a) => a.status === 'interviewing'),
    offer: applications.filter((a) => a.status === 'offer'),
    rejected: applications.filter((a) => a.status === 'rejected'),
    ghosted: applications.filter((a) => a.status === 'ghosted'),
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = applications.filter((a) => a.next_action_date && new Date(a.next_action_date) < today)
  const upcoming = applications.filter((a) => {
    if (!a.next_action_date) return false
    const d = new Date(a.next_action_date)
    return d >= today && d <= new Date(today.getTime() + 3 * 86400000)
  })

  const formatActivity = (entry: ActivityEntry) => {
    const d = entry.event_data
    if (entry.event_type === 'applied') return `Applied to ${d.company} — ${d.role}`
    if (entry.event_type === 'stage_change') return `${d.company || 'Application'} moved to ${d.new_status?.replace(/_/g, ' ')}`
    return entry.event_type.replace(/_/g, ' ')
  }

  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const statValue = (cfg: typeof statConfig[number]) => {
    if (!stats) return applications.length.toString()
    const raw = stats[cfg.key as keyof Stats] ?? 0
    return cfg.pct ? `${raw}%` : String(raw)
  }

  return (
    <div className="space-y-6 animate-fade-up">

      {/* ─── Welcome ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-[22px] font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-tight">
              {greeting()}, {userName} 👋
            </h2>
          </div>
          <p className="text-slate-400 text-[13px]">
            {todayLabel}
            {overdue.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-500 font-medium">
                · <AlertCircle className="w-3 h-3" /> {overdue.length} overdue
              </span>
            )}
          </p>
        </div>
        <Link href="/applications">
          <Button size="sm" className="shadow-[0_2px_8px_rgba(47,133,90,0.20)]">
            <Plus className="w-3.5 h-3.5" /> New application
          </Button>
        </Link>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statConfig.map((cfg, i) => (
          <motion.div
            key={cfg.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card
              hover
              padding="md"
              className={`border-t-2 ${cfg.border} transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${cfg.soft} flex items-center justify-center`}>
                  <cfg.icon className={`w-[17px] h-[17px] ${cfg.text}`} />
                </div>
              </div>
              <p className="text-[26px] font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-tight leading-none mb-1.5">
                {appsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300 inline" /> : statValue(cfg)}
              </p>
              <p className="text-[12px] text-slate-400">
                <span className="font-medium text-slate-500">{cfg.label}</span>
                <span className="text-slate-300 mx-1">·</span>
                {cfg.sub}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* Pipeline */}
        <div className="lg:col-span-3">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900">Pipeline</h3>
                {!appsLoading && (
                  <p className="text-[12px] text-slate-400 mt-0.5">{applications.length} total applications</p>
                )}
              </div>
              <Link href="/applications" className="text-[12px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {appsLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : (
              <>
                {/* Distribution bar */}
                {applications.length > 0 && (
                  <div className="flex rounded-full overflow-hidden h-1.5 mb-5 gap-px">
                    {Object.entries(pipeline).map(([status, apps]) => {
                      if (apps.length === 0) return null
                      const pct = (apps.length / applications.length) * 100
                      const cfg = statusConfig[status]
                      return (
                        <div
                          key={status}
                          style={{ width: `${pct}%` }}
                          className={`h-full ${cfg?.barColor || 'bg-slate-200'} transition-all`}
                          title={`${cfg?.label}: ${apps.length}`}
                        />
                      )
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(pipeline).map(([status, apps]) => {
                    const config = statusConfig[status]
                    return (
                      <div key={status} className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-[11px] font-semibold text-slate-500 truncate">{config.label}</span>
                          <span className="text-[10px] text-slate-400 ml-auto shrink-0 font-medium">{apps.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {apps.slice(0, 3).map((app) => (
                            <Link key={app.id} href={`/applications/${app.id}`}>
                              <div className="px-2.5 py-2 rounded-lg bg-slate-50/80 border border-slate-100/80 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-150 cursor-pointer group">
                                <p className="text-[11px] font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">{app.company_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{app.role_title}</p>
                              </div>
                            </Link>
                          ))}
                          {apps.length === 0 && (
                            <div className="px-2.5 py-3 rounded-lg border border-dashed border-slate-200 text-center">
                              <p className="text-[10px] text-slate-300">Empty</p>
                            </div>
                          )}
                          {apps.length > 3 && (
                            <Link href="/applications">
                              <p className="text-[10px] text-slate-400 hover:text-emerald-600 text-center py-1 transition-colors">
                                +{apps.length - 3} more
                              </p>
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Today / Action items */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900">Today</h3>
              {(overdue.length > 0 || upcoming.length > 0) && (
                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {overdue.length + upcoming.length} items
                </span>
              )}
            </div>

            {overdue.length === 0 && upcoming.length === 0 ? (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-[13px] font-medium text-slate-700">All caught up!</p>
                <p className="text-[12px] text-slate-400 mt-0.5">No urgent items today.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {overdue.slice(0, 3).map((a) => (
                  <Link key={a.id} href={`/applications/${a.id}`}>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer group">
                      <div className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-red-100 transition-colors">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700 truncate">{a.company_name}</p>
                        <p className="text-[11px] text-red-400">{a.next_action || 'Follow up'} · overdue</p>
                      </div>
                    </div>
                  </Link>
                ))}
                {upcoming.slice(0, 3).map((a) => (
                  <Link key={a.id} href={`/applications/${a.id}`}>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all cursor-pointer group">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-100 transition-colors">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-700 truncate">{a.company_name}</p>
                        <p className="text-[11px] text-slate-400">{a.next_action || 'Follow up'} · {a.next_action_date}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/reminders">
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 text-[12px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 py-2 rounded-lg transition-colors font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> View all reminders <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </Card>

          {/* Quick actions */}
          <Card padding="sm">
            <h3 className="text-[13px] font-semibold text-slate-700 px-1 mb-2">Quick actions</h3>
            <div className="space-y-0.5">
              {[
                { href: '/applications', label: 'Add new application', icon: Plus, color: 'text-emerald-600' },
                { href: '/coach', label: 'Practice interview', icon: Zap, color: 'text-violet-600' },
                { href: '/resume', label: 'Analyze resume', icon: BarChart3, color: 'text-blue-600' },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                    <action.icon className={`w-4 h-4 ${action.color} shrink-0`} />
                    <span className="text-[13px] text-slate-600 group-hover:text-slate-900 transition-colors">{action.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>

        </div>
      </div>

      {/* ─── Activity ─── */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900">Recent activity</h3>
          {activity.length > 0 && (
            <span className="text-[11px] text-slate-400">{activity.length} events</span>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[13px] text-slate-400">No activity yet.</p>
            <Link href="/applications">
              <p className="text-[12px] text-emerald-600 hover:underline mt-1">Add your first application →</p>
            </Link>
          </div>
        ) : (
          <div className="space-y-0">
            {activity.map((item, i) => {
              const iconCfg = activityIcons[item.event_type] || { icon: '📌', color: 'bg-slate-50 text-slate-500' }
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[13px] shrink-0 ${iconCfg.color}`}>
                      {iconCfg.icon}
                    </div>
                    <p className="text-[13px] text-slate-600">{formatActivity(item)}</p>
                  </div>
                  <span className="text-[11px] text-slate-300 whitespace-nowrap ml-4 tabular-nums">{timeAgo(item.created_at)}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
