'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase, Calendar, TrendingUp, BarChart3,
  Plus, Clock, AlertCircle, CheckCircle2,
  ArrowRight, ChevronRight, Loader2,
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

  const userName = profile?.name || user?.email?.split('@')[0] || 'there'

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

  // Build pipeline from real applications
  const pipeline = {
    applied: applications.filter((a) => a.status === 'applied'),
    phone_screen: applications.filter((a) => a.status === 'phone_screen'),
    interviewing: applications.filter((a) => a.status === 'interviewing'),
    offer: applications.filter((a) => a.status === 'offer'),
    rejected: applications.filter((a) => a.status === 'rejected'),
    ghosted: applications.filter((a) => a.status === 'ghosted'),
  }

  // Build action items from real data
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
    if (entry.event_type === 'stage_change') return `Status changed → ${d.new_status?.replace('_', ' ')}`
    return entry.event_type
  }

  const timeAgo = (dateStr: string) => {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-slate-900">
            {greeting()}, {userName}
          </h2>
          <p className="text-slate-400 text-[13px] mt-0.5">
            {overdue.length > 0
              ? `${overdue.length} overdue item${overdue.length > 1 ? 's' : ''} need your attention`
              : `${applications.length} application${applications.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>
        <Link href="/applications">
          <Button size="sm">
            <Plus className="w-3.5 h-3.5" /> New application
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Applied', value: appsLoading ? '…' : String(stats?.total ?? applications.length), sub: 'total', icon: Briefcase },
          { label: 'Interviews', value: appsLoading ? '…' : String(stats?.interviews ?? 0), sub: 'in progress', icon: Calendar },
          { label: 'Offer Rate', value: appsLoading ? '…' : `${stats?.offerRate ?? 0}%`, sub: 'of apps', icon: TrendingUp },
          { label: 'Response', value: appsLoading ? '…' : `${stats?.responseRate ?? 0}%`, sub: 'response rate', icon: BarChart3 },
        ].map((stat) => (
          <Card key={stat.label} hover padding="md">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
                <stat.icon className="w-[18px] h-[18px] text-slate-400" />
              </div>
            </div>
            <p className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-tight">
              {appsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-300 inline" /> : stat.value}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">{stat.label} · {stat.sub}</p>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Pipeline */}
        <div className="lg:col-span-3">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900">Pipeline</h3>
              <Link href="/applications" className="text-[12px] text-slate-400 hover:text-emerald-600 flex items-center gap-0.5 transition-colors">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {appsLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {Object.entries(pipeline).map(([status, apps]) => {
                  const config = statusConfig[status]
                  return (
                    <div key={status} className="min-w-[130px] flex-shrink-0">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[11px] font-semibold text-slate-500">{config.label}</span>
                        <span className="text-[10px] text-slate-400 ml-auto">{apps.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {apps.slice(0, 3).map((app) => (
                          <Link key={app.id} href={`/applications/${app.id}`}>
                            <div className="px-2.5 py-2 rounded-lg bg-slate-50/80 border border-slate-100/80 hover:border-emerald-200 transition-colors cursor-pointer">
                              <p className="text-[11px] font-semibold text-slate-800 truncate">{app.company_name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{app.role_title}</p>
                            </div>
                          </Link>
                        ))}
                        {apps.length === 0 && (
                          <div className="px-2.5 py-3 rounded-lg border border-dashed border-slate-200 text-center">
                            <p className="text-[10px] text-slate-300">Empty</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          {/* Action items */}
          <Card padding="md">
            <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-3">Today</h3>
            {overdue.length === 0 && upcoming.length === 0 ? (
              <p className="text-[12px] text-slate-400">No urgent items — you&apos;re on top of things!</p>
            ) : (
              <div className="space-y-2">
                {overdue.slice(0, 3).map((a) => (
                  <Link key={a.id} href={`/applications/${a.id}`}>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                      <div className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      </div>
                      <p className="text-[13px] text-slate-600 leading-snug">
                        {a.next_action || 'Follow up'} — {a.company_name} <span className="text-red-400">(overdue)</span>
                      </p>
                    </div>
                  </Link>
                ))}
                {upcoming.slice(0, 3).map((a) => (
                  <Link key={a.id} href={`/applications/${a.id}`}>
                    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                      <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <p className="text-[13px] text-slate-600 leading-snug">
                        {a.next_action || 'Follow up'} — {a.company_name} · {a.next_action_date}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/reminders">
              <button className="mt-3 flex items-center gap-1 text-[12px] text-emerald-600 hover:underline">
                <CheckCircle2 className="w-3.5 h-3.5" /> View all reminders <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </Card>

        </div>
      </div>

      {/* Activity */}
      <Card padding="md">
        <h3 className="text-[14px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-3">Recent activity</h3>
        {activity.length === 0 ? (
          <p className="text-[12px] text-slate-400">No activity yet. Start by adding an application!</p>
        ) : (
          <div className="space-y-0">
            {activity.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <p className="text-[13px] text-slate-600">{formatActivity(item)}</p>
                </div>
                <span className="text-[11px] text-slate-300 whitespace-nowrap ml-4">{timeAgo(item.created_at)}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
