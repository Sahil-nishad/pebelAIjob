'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase, Calendar, BarChart3, Plus, Clock,
  CheckCircle2, Loader2, Send, Settings,
  Bot, Bell, TrendingUp, ChevronRight, AlertCircle, X, Puzzle,
  Flame, Zap, Target,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { statusConfig, cn } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { useUser } from '@/hooks/useUser'
import { authFetch } from '@/lib/api'
import type { Reminder } from '@/types'
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

type MsgItem = { icon: React.ElementType; iconColor: string; stat: string; body: string }

function buildMotivation(p: {
  total: number; interviews: number; streak: number; todayCount: number; weeklyCount: number
}): MsgItem[] {
  const msgs: MsgItem[] = []

  if (p.total === 0) {
    msgs.push({ icon: Target, iconColor: 'text-slate-400', stat: '0 applications', body: 'Your first application is one click away. Start building your pipeline today.' })
  } else if (p.total < 10) {
    msgs.push({ icon: TrendingUp, iconColor: 'text-emerald-500', stat: `${p.total} applications total`, body: 'Aim for 5 this week to build real momentum and start seeing responses.' })
  } else if (p.total < 50) {
    msgs.push({ icon: TrendingUp, iconColor: 'text-emerald-500', stat: `${p.total} applications submitted`, body: "Most candidates quit before 10. You're already in the active minority." })
  } else {
    msgs.push({ icon: TrendingUp, iconColor: 'text-emerald-500', stat: `${p.total} applications submitted`, body: "You're in the top tier of active job seekers. Volume like this gets results." })
  }

  if (p.streak >= 7) {
    msgs.push({ icon: Zap, iconColor: 'text-amber-500', stat: `${p.streak}-day streak`, body: "You're outworking 90% of job seekers right now. Don't break the chain." })
  } else if (p.streak >= 3) {
    msgs.push({ icon: Zap, iconColor: 'text-amber-500', stat: `${p.streak}-day streak`, body: 'Consistency compounds — every day you apply increases your surface area for luck.' })
  } else if (p.streak === 0 && p.todayCount === 0) {
    msgs.push({ icon: Flame, iconColor: 'text-orange-400', stat: 'No streak yet', body: 'Apply to one job today to start your streak. Habits are built one day at a time.' })
  }

  if (p.weeklyCount > 0) {
    const remaining = 5 - p.weeklyCount
    if (remaining <= 0) {
      msgs.push({ icon: CheckCircle2, iconColor: 'text-emerald-500', stat: `${p.weeklyCount} this week`, body: 'Weekly goal of 5 crushed! Keep the momentum going.' })
    } else {
      msgs.push({ icon: Calendar, iconColor: 'text-blue-400', stat: `${p.weeklyCount} this week`, body: `${remaining} more to hit your weekly goal of 5 applications.` })
    }
  }

  if (p.interviews > 0) {
    msgs.push({ icon: CheckCircle2, iconColor: 'text-emerald-500', stat: `${p.interviews} active interview${p.interviews > 1 ? 's' : ''}`, body: 'The hard work is converting into real opportunities. Keep the pipeline full.' })
  }

  return msgs.slice(0, 3)
}

type StreakData = { currentStreak: number; bestStreak: number; todayCount: number }
type HeatmapData = { days: { date: string; count: number }[]; total: number }

export default function DashboardPage() {
  const { applications, loading: appsLoading } = useApplications()
  const { user, profile } = useUser()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({ days: [], total: 0 })
  const [showExtBanner, setShowExtBanner] = useState(() =>
    typeof window !== 'undefined' && !localStorage.getItem('ext_banner_dismissed')
  )

  const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  function dismissExtBanner() {
    localStorage.setItem('ext_banner_dismissed', '1')
    setShowExtBanner(false)
  }

  useEffect(() => {
    authFetch('/api/reminders')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setReminders(d) })
      .catch(() => {})

    authFetch('/api/applications/streak')
      .then(r => r.json())
      .then(setStreakData)
      .catch(() => {})

    authFetch('/api/applications/heatmap')
      .then(r => r.json())
      .then(d => { if (d.days) setHeatmapData(d) })
      .catch(() => {})
  }, [])

  // ── Stats ──
  const total        = applications.length
  const interviews   = applications.filter(a => ['interviewing', 'phone_screen'].includes(a.status)).length
  const offers       = applications.filter(a => a.status === 'offer').length
  const nonApplied   = applications.filter(a => a.status !== 'applied').length
  const offerRate    = total > 0 ? ((offers / total) * 100).toFixed(1) + '%' : '—'
  const responseRate = total > 0 ? ((nonApplied / total) * 100).toFixed(0) + '%' : '—'

  // Weekly count (Sun–today)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const weeklyCount = applications.filter(a => new Date(a.applied_date) >= startOfWeek).length

  const motivationMsgs = buildMotivation({
    total, interviews,
    streak: streakData?.currentStreak ?? 0,
    todayCount: streakData?.todayCount ?? 0,
    weeklyCount,
  })

  const stats = [
    { label: 'Applications', value: total || '—',      icon: Send,       sub: 'total submitted' },
    { label: 'Interviews',   value: interviews || '—',  icon: Briefcase,  sub: 'active / in progress' },
    { label: 'Offer Rate',   value: offerRate,          icon: TrendingUp, sub: 'of all applications' },
    { label: 'Response Rate',value: responseRate,       icon: BarChart3,  sub: 'have responded' },
  ]

  const pipeline = [
    { label: 'Applied',      count: applications.filter(a => a.status === 'applied').length },
    { label: 'Phone Screen', count: applications.filter(a => a.status === 'phone_screen').length },
    { label: 'Interviewing', count: applications.filter(a => a.status === 'interviewing').length },
    { label: 'Offer',        count: applications.filter(a => a.status === 'offer').length },
    { label: 'Rejected',     count: applications.filter(a => a.status === 'rejected').length },
  ]

  const recentApps = [...applications]
    .sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime())
    .slice(0, 4)

  const upcomingReminders = reminders
    .filter(r => !r.is_done)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3)

  const overdueCount = reminders.filter(r => !r.is_done && new Date(r.due_date) < new Date()).length

  if (appsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 animate-fade-up">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {greeting()}, {userName}.
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <Link href="/applications" className="shrink-0">
              <button className="flex items-center gap-1.5 bg-[#0A6A47] hover:bg-[#085438] text-white text-[13px] font-semibold px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-emerald-900/10">
                <Plus className="w-3.5 h-3.5" />
                New Application
              </button>
            </Link>
          </div>

          {/* Extension banner */}
          {showExtBanner && (
            <div className="flex items-start gap-3 bg-[#0A6A47]/8 border border-[#0A6A47]/20 rounded-2xl px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-[#0A6A47]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Puzzle className="w-4 h-4 text-[#0A6A47]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-900">Auto-track jobs with our Chrome extension</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Apply on LinkedIn or any job site and PebelAI will save it automatically.{' '}
                  <Link href="/extension" className="text-[#0A6A47] font-semibold hover:underline">
                    Install free →
                  </Link>
                </p>
              </div>
              <button onClick={dismissExtBanner} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 border-none shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-[#F1F5F2] flex items-center justify-center">
                      <stat.icon className="w-4 h-4 text-[#0A6A47]" />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{stat.sub}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Consistency Tracker + Your Progress side by side */}
          <Card className="p-6 border-none shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Consistency Tracker</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Each square = one day · last 6 months · darker = more applications.</p>
              </div>
              {streakData && streakData.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-[12px] font-bold text-orange-600">{streakData.currentStreak} day streak</span>
                </div>
              )}
            </div>

            {/* Body: heatmap left, progress right */}
            <div className="flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <ActivityHeatmap days={heatmapData.days} total={heatmapData.total} />
              </div>

              <div className="w-px bg-slate-100 self-stretch flex-shrink-0" />

              <div className="w-[200px] flex-shrink-0">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-900">Your Progress</p>
                </div>
                <div className="space-y-0">
                  {motivationMsgs.map((msg, i) => (
                    <div key={i}>
                      {i > 0 && <div className="border-t border-slate-100 my-3" />}
                      <div className="flex gap-2.5">
                        <div className="mt-0.5 flex-shrink-0">
                          <msg.icon className={cn('w-3.5 h-3.5', msg.iconColor)} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-900 leading-snug">{msg.stat}</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{msg.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {streakData && streakData.bestStreak > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Best streak</span>
                    <span className="text-[11px] font-bold text-slate-600">{streakData.bestStreak} days</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Pipeline */}
          <Card className="p-6 border-none shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-semibold text-slate-900">Application Pipeline</h3>
              <Link href="/applications" className="text-[12px] text-[#0A6A47] font-medium hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {total === 0 ? (
              <div className="text-center py-10">
                <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No applications yet.</p>
                <Link href="/applications" className="text-sm text-[#0A6A47] font-medium mt-2 inline-block hover:underline">Add your first →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {pipeline.filter(p => p.count > 0).map(p => {
                  const pct = total > 0 ? Math.round((p.count / total) * 100) : 0
                  return (
                    <div key={p.label} className="flex items-center gap-3">
                      <p className="text-[12px] text-slate-500 w-28 shrink-0">{p.label}</p>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full bg-[#0A6A47] rounded-full"
                        />
                      </div>
                      <p className="text-[12px] font-semibold text-slate-700 w-6 text-right">{p.count}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Recent Applications */}
          <Card className="p-6 border-none shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-slate-900">Recent Applications</h3>
              <Link href="/applications" className="text-[12px] text-[#0A6A47] font-medium hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentApps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400">No applications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApps.map(app => {
                  const cfg = statusConfig[app.status]
                  return (
                    <Link key={app.id} href={`/applications/${app.id}`}>
                      <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#F1F5F2] flex items-center justify-center text-sm font-bold text-[#0A6A47] flex-shrink-0">
                            {app.company_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-900 truncate">{app.company_name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{app.role_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', cfg?.bg, cfg?.text)}>
                            {cfg?.label || app.status}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0A6A47] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="w-full lg:w-[300px] flex-shrink-0 space-y-5">

          {/* Reminders */}
          <Card className="p-5 border-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-400" />
                <h3 className="text-[14px] font-semibold text-slate-900">Reminders</h3>
              </div>
              <Link href="/reminders">
                <span className="text-[11px] text-[#0A6A47] font-medium hover:underline">View all</span>
              </Link>
            </div>

            {overdueCount > 0 && (
              <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {overdueCount} overdue reminder{overdueCount > 1 ? 's' : ''}
              </div>
            )}

            {upcomingReminders.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-7 h-7 text-emerald-200 mx-auto mb-2" />
                <p className="text-[12px] text-slate-400">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingReminders.map(r => {
                  const isOverdue = new Date(r.due_date) < new Date()
                  return (
                    <Link key={r.id} href="/reminders">
                      <div className={cn(
                        'p-3.5 rounded-xl border-l-2 cursor-pointer hover:bg-slate-50 transition-colors',
                        isOverdue ? 'border-l-red-400 bg-red-50/40' : 'border-l-[#0A6A47] bg-[#F8FAF8]'
                      )}>
                        <p className="text-[12px] font-semibold text-slate-800 leading-tight">{r.title}</p>
                        <p className={cn('text-[10px] mt-1 flex items-center gap-1', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                          <Clock className="w-3 h-3" />
                          {new Date(r.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          {isOverdue && ' · Overdue'}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Quick Access */}
          <Card className="p-5 border-none shadow-sm">
            <h3 className="text-[14px] font-semibold text-slate-900 mb-4">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Add Application', icon: Plus,     href: '/applications' },
                { label: 'AI Coach',        icon: Bot,      href: '/coach' },
                { label: 'Reminders',       icon: Bell,     href: '/reminders' },
                { label: 'Settings',        icon: Settings, href: '/settings' },
              ].map(tool => (
                <Link key={tool.label} href={tool.href}>
                  <div className="flex flex-col items-center justify-center p-4 bg-[#F8F9F8] rounded-xl hover:bg-[#F1F5F2] transition-colors group cursor-pointer">
                    <tool.icon className="w-5 h-5 text-slate-400 group-hover:text-[#0A6A47] transition-colors mb-2" />
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0A6A47] transition-colors text-center leading-tight">{tool.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* AI Coach CTA */}
          <Card className="p-5 border-none bg-[#0A6A47] text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-emerald-300" />
              <span className="text-[11px] font-semibold text-emerald-200 uppercase tracking-wider">AI Interview Coach</span>
            </div>
            <p className="text-[13px] font-semibold text-white leading-snug mb-4">
              Practice for your next interview with AI tailored to your target role.
            </p>
            <Link href="/coach">
              <button className="w-full py-2.5 bg-white text-[#0A6A47] text-[12px] font-bold rounded-lg hover:bg-emerald-50 transition-colors">
                Start Practicing →
              </button>
            </Link>
          </Card>

        </div>
      </div>
    </div>
  )
}
