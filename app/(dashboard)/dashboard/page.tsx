'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Briefcase, Calendar, TrendingUp, BarChart3,
  Plus, Clock, AlertCircle, CheckCircle2,
  ArrowRight, ChevronRight, Loader2, Zap,
  Users, Target, Send, Upload, FileText, MousePointer2, BriefcaseIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { statusConfig } from '@/lib/utils'
import { useApplications } from '@/hooks/useApplications'
import { useUser } from '@/hooks/useUser'
import { authFetch } from '@/lib/api'
import { supabase } from '@/lib/supabase'

interface Stats { total: number; interviews: number; offerRate: number; responseRate: number }

const statConfig = [
  { key: 'total', label: 'APPLIED', value: '42', change: '+12%', color: '#0A6A47', icon: Send, progress: 65 },
  { key: 'interviews', label: 'INTERVIEWS', value: '8', change: 'Active', color: '#0A6A47', icon: Users, progress: 40, status: 'Active' },
  { key: 'offerRate', label: 'OFFER RATE', value: '2.4%', change: 'Goal 5%', color: '#0A6A47', icon: Target, progress: 48 },
  { key: 'responseRate', label: 'RESPONSE RATE', value: '18%', change: '+4%', color: '#0A6A47', icon: BarChart3, progress: 20 },
]

export default function DashboardPage() {
  const { applications, loading: appsLoading } = useApplications()
  const { user, profile } = useUser()
  const [stats, setStats] = useState<Stats | null>(null)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Alex'

  useEffect(() => {
    authFetch('/api/applications/stats')
      .then((r) => r.json())
      .then((d) => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-up">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Main Content Area */}
        <div className="flex-1 space-y-8">
          
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[42px] font-bold text-[#13211B] tracking-tight leading-tight">
                {greeting()}, {userName}.
              </h1>
              <p className="text-slate-400 text-[16px] mt-2">
                Here is what's happening with your career curator today.
              </p>
            </div>
            <Link href="/applications">
              <Button className="bg-[#0A6A47] hover:bg-[#085438] text-white px-6 py-6 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10">
                <Plus className="w-5 h-5" />
                New Application
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statConfig.map((stat, i) => (
              <Card key={stat.label} className="p-6 border-none shadow-sm relative overflow-hidden group hover:shadow-md transition-all h-[180px]">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F1F5F2] flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-[#0A6A47]" />
                  </div>
                  {stat.change && (
                    <span className={cn(
                      "text-[12px] font-bold px-3 py-1 rounded-full",
                      stat.status === 'Active' ? "bg-emerald-50 text-[#0A6A47]" : "text-[#0A6A47] bg-transparent"
                    )}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-bold text-slate-400 tracking-wider uppercase">{stat.label}</p>
                  <p className="text-[32px] font-bold text-[#13211B]">{stat.value}</p>
                </div>
                <div className="absolute bottom-6 left-6 right-6 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="h-full bg-[#0A6A47]"
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Pipeline Card */}
          <Card className="p-8 border-none shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[20px] font-bold text-[#13211B]">Application Pipeline</h3>
              <div className="flex items-center gap-4">
                <select className="bg-[#F1F5F2] border-none text-[12px] font-bold px-4 py-2 rounded-lg text-[#13211B]">
                  <option>This Month</option>
                </select>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                </div>
              </div>
            </div>

            <div className="relative mt-20 mb-12">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-100 -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 w-[60%] h-[2px] bg-[#0A6A47] -translate-y-1/2" />
              
              <div className="relative flex justify-between items-center px-4">
                {[
                  { label: 'APPLIED', count: '14 roles', icon: FileText, active: true },
                  { label: 'INTERVIEW', count: '8 roles', icon: Zap, active: true },
                  { label: 'ASSESSMENT', count: '3 roles', icon: CheckCircle2, active: true },
                  { label: 'OFFER', count: '0 roles', icon: Send, active: false },
                ].map((step, idx) => (
                  <div key={step.label} className="relative flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center z-10",
                      step.active ? "bg-[#0A6A47] text-white" : "bg-slate-200 text-slate-400"
                    )}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div className="absolute top-14 text-center w-32">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.label}</p>
                      <p className="text-[12px] font-bold text-[#13211B] mt-1">{step.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Application List */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { company: 'Senior Frontend Engineer', sub: 'Linear • Interviewing', icon: '/linear.svg' },
                { company: 'Product Designer', sub: 'Framer • Next: Portfolio Review', icon: '/framer.svg' },
              ].map((app, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center p-3 overflow-hidden">
                      <div className="w-full h-full bg-slate-900 rounded-sm" /> {/* Placeholder icon */}
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[#13211B]">{app.company}</p>
                      <p className="text-[12px] text-slate-400 mt-0.5">{app.sub}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0A6A47] transition-colors" />
                </div>
              ))}
            </div>
          </Card>

          {/* AI Curator Insight */}
          <Card className="p-8 border-none bg-[#0A6A47] relative overflow-hidden text-white min-h-[240px] flex flex-col justify-center">
            <div className="relative z-10 max-w-lg">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-[#4ade80]" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-emerald-100">AI Curator Insight</span>
              </div>
              <h3 className="text-[28px] font-bold leading-tight mb-4">
                Your resume matches 89% of the 'Staff Engineer' role at Stripe.
              </h3>
              <p className="text-emerald-100/80 text-[15px] leading-relaxed mb-8">
                Consider emphasizing your experience with distributed systems in the technical screen to increase your conversion odds by an estimated 14%.
              </p>
              <Button className="bg-white text-[#0A6A47] hover:bg-emerald-50 px-8 py-6 rounded-xl font-bold">
                Review Suggestion
              </Button>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-l from-white to-transparent" />
            </div>
          </Card>

        </div>

        {/* Right Sidebar Section */}
        <div className="w-full lg:w-[320px] space-y-8">
          
          {/* Today's Focus */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-slate-400" />
              <h3 className="text-[18px] font-bold text-[#13211B]">Today's Focus</h3>
            </div>
            
            <div className="space-y-4">
              {[
                { type: 'INTERVIEW • 14:00', title: 'Tech Screen: Vercel', desc: 'Prep technical architecture notes for serverless discussion.', color: '#0A6A47' },
                { type: 'TASK • ANYTIME', title: 'Update LinkedIn Work History', desc: 'Align recent projects with current application strategy.', color: '#94a3b8' },
                { type: 'FOLLOW UP • 16:30', title: 'Email Recruiter at Airbnb', desc: 'Checking in on the feedback from last Friday\'s onsite.', color: '#94a3b8' },
              ].map((focus, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-transparent hover:border-emerald-500 transition-all cursor-pointer group" style={{ borderLeftColor: i === 0 ? focus.color : 'transparent' }}>
                  <p className="text-[10px] font-bold text-emerald-600 tracking-widest mb-1 capitalize" style={{ color: focus.color }}>{focus.type}</p>
                  <h4 className="text-[14px] font-bold text-[#13211B] mb-1 group-hover:text-[#0A6A47] transition-colors">{focus.title}</h4>
                  <p className="text-[12px] text-slate-400 leading-relaxed">{focus.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tools */}
          <div className="space-y-6 pt-4">
            <h3 className="text-[16px] font-bold text-[#13211B]">Quick Tools</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'UPLOAD CV', icon: Upload },
                { label: 'TEMPLATES', icon: FileText },
                { label: 'PRACTICE', icon: MousePointer2 },
                { label: 'PORTFOLIOS', icon: BriefcaseIcon },
              ].map((tool, i) => (
                <button key={i} className="flex flex-col items-center justify-center p-6 bg-[#F8F9F8] rounded-2xl hover:bg-[#F1F5F2] transition-all group">
                  <tool.icon className="w-6 h-6 text-slate-400 group-hover:text-[#0A6A47] transition-colors mb-3" />
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider group-hover:text-[#0A6A47] transition-colors">{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
