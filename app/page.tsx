'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  LayoutGrid,
  MessageSquare,
  Bell,
  FileSearch,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  ChevronRight,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─── Navbar ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.06)] backdrop-blur-xl' : 'bg-white/70 backdrop-blur-xl border-b border-slate-200/40'}`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#testimonials', 'Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors font-medium">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="shadow-[0_2px_8px_rgba(47,133,90,0.24)]">
              Get started <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Rich Kanban Visual ─── */
function KanbanVisual() {
  const cols = [
    {
      title: 'Applied', dot: 'bg-blue-400', count: 8,
      cards: [
        { name: 'Google', role: 'Senior PM', days: '2d ago', src: 'G' },
        { name: 'Stripe', role: 'Eng II', days: '4d ago', src: 'S' },
      ],
    },
    {
      title: 'Interview', dot: 'bg-amber-400', count: 3,
      cards: [
        { name: 'Meta', role: 'PM Lead', days: 'Round 2', src: 'M', active: true },
        { name: 'Figma', role: 'Frontend', days: 'Phone screen', src: 'F' },
      ],
    },
    {
      title: 'Offer', dot: 'bg-emerald-400', count: 1,
      cards: [
        { name: 'Vercel', role: 'DX Eng', days: '$185K', src: 'V' },
      ],
    },
  ]

  const avatarColors: Record<string, string> = {
    G: 'from-blue-400 to-blue-600',
    S: 'from-violet-400 to-violet-600',
    M: 'from-blue-500 to-indigo-600',
    F: 'from-pink-400 to-rose-500',
    V: 'from-slate-700 to-slate-900',
  }

  return (
    <div className="animate-float relative">
      {/* AI suggestion toast */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -top-4 -right-4 z-10 flex items-center gap-2 rounded-xl bg-white border border-emerald-200/80 shadow-[0_8px_24px_rgba(47,133,90,0.12)] px-3 py-2"
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-[11px] font-medium text-slate-700">Follow up with Meta <span className="text-emerald-600">today</span></p>
      </motion.div>

      {/* Stats chip */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -bottom-3 -left-4 z-10 flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 shadow-[0_8px_24px_rgba(15,23,42,0.08)] px-3 py-2"
      >
        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
        <p className="text-[11px] font-semibold text-slate-700">67% response rate</p>
        <span className="text-[10px] text-emerald-600 font-medium">↑ +12%</span>
      </motion.div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_60px_rgba(15,23,42,0.10)] p-5 max-w-[520px] mx-auto">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
          <div className="flex items-center gap-1.5 ml-3 px-3 py-1 rounded-md bg-slate-50 border border-slate-100 flex-1 max-w-[160px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-slate-400 font-medium truncate">pebel.ai/dashboard</span>
          </div>
          <span className="ml-auto text-[10px] text-slate-400 font-medium">Job Pipeline</span>
        </div>

        <div className="flex gap-3">
          {cols.map((col) => (
            <div key={col.title} className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-[11px] font-semibold text-slate-700">{col.title}</span>
                <span className="text-[10px] text-slate-400 bg-slate-100 rounded px-1 ml-auto">{col.count}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((card) => (
                  <motion.div
                    key={card.name}
                    whileHover={{ y: -1 }}
                    className={`rounded-lg p-2.5 border cursor-default transition-all ${card.active ? 'bg-amber-50/60 border-amber-200/70 shadow-[0_2px_8px_rgba(245,158,11,0.08)]' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${avatarColors[card.src]} flex items-center justify-center text-[8px] font-bold text-white`}>
                        {card.src}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800">{card.name}</p>
                    </div>
                    <p className="text-[10px] text-slate-500">{card.role}</p>
                    <span className={`inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded ${card.active ? 'bg-amber-100 text-amber-700' : 'bg-white border border-slate-200 text-slate-500'}`}>
                      {card.days}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">12 applications tracked</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-600 font-medium">Live sync</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-24 md:pt-36 md:pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10 mesh-gradient" />
        <div className="absolute top-20 left-[5%] w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-[5%] w-80 h-80 bg-sky-100/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-[30%] w-64 h-64 bg-violet-100/20 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-7"
            >
              {/* Announcement banner */}
              <motion.a
                href="#features"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-[12px] font-semibold text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer group"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
                AI Resume Analyzer — now live
                <ChevronRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
              </motion.a>

              <div className="space-y-3">
                <h1 className="text-[42px] md:text-[52px] lg:text-[58px] font-bold font-[family-name:var(--font-heading)] leading-[1.08] tracking-[-0.03em] text-slate-900">
                  Track smarter.
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    Interview better.
                  </span>
                  <br />
                  Land the offer.
                </h1>
                <p className="text-[16px] leading-[1.7] text-slate-500 max-w-[420px]">
                  The all-in-one platform that organizes your job search, preps you with AI coaching, and makes sure you never drop the ball on a follow-up.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-7 text-[14px] rounded-xl shadow-[0_8px_28px_rgba(47,133,90,0.28)] hover:shadow-[0_12px_36px_rgba(47,133,90,0.36)]">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg" className="h-12 gap-2 text-[14px] text-slate-600">
                    See how it works →
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex -space-x-2.5">
                  {[
                    'from-blue-400 to-blue-600',
                    'from-violet-400 to-violet-600',
                    'from-rose-400 to-pink-600',
                    'from-amber-400 to-orange-500',
                    'from-emerald-400 to-emerald-600',
                  ].map((g, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${g} shadow-sm`} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-[12px] text-slate-500">
                    Loved by <span className="font-semibold text-slate-700">5,000+</span> job seekers
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative px-6"
            >
              <KanbanVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─── */}
      <section className="py-10 px-6 border-y border-slate-100 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] text-slate-400 font-semibold uppercase tracking-[0.12em] mb-7">
            Our users have landed roles at
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap">
            {[
              { name: 'Google', color: '#4285F4' },
              { name: 'Meta', color: '#0467DF' },
              { name: 'Stripe', color: '#635BFF' },
              { name: 'Vercel', color: '#000000' },
              { name: 'Notion', color: '#000000' },
              { name: 'Figma', color: '#F24E1E' },
            ].map(({ name }) => (
              <span key={name} className="text-[15px] font-bold text-slate-300 tracking-tight hover:text-slate-400 transition-colors cursor-default">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM / STATS ─── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-[0.12em] mb-4">The problem</p>
            <h2 className="text-[32px] md:text-[42px] font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight mb-5 tracking-[-0.025em]">
              Your job search is a mess.
              <br />
              <span className="text-slate-400 font-normal">It doesn&apos;t have to be.</span>
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed max-w-xl mx-auto mb-14">
              Spreadsheets lose rows. Bookmarks pile up. Emails go unanswered. You forget which company you&apos;re interviewing with tomorrow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { num: '73%', text: 'of job seekers lose track of their applications', sub: 'LinkedIn Survey', accent: 'border-t-red-400', bg: 'bg-red-50/60' },
              { num: '5 days', text: 'average response window before you get ghosted', sub: 'Follow up or lose out', accent: 'border-t-amber-400', bg: 'bg-amber-50/60' },
              { num: '40%', text: 'of candidates feel unprepared for interviews', sub: 'AI coaching changes this', accent: 'border-t-violet-400', bg: 'bg-violet-50/40' },
            ].map((stat, i) => (
              <motion.div
                key={stat.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`p-6 rounded-2xl ${stat.bg} border border-slate-100 border-t-2 ${stat.accent} text-left`}
              >
                <p className="text-[36px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2 tracking-tight">{stat.num}</p>
                <p className="text-[13px] text-slate-600 leading-snug mb-2">{stat.text}</p>
                <p className="text-[11px] text-slate-400 font-medium">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES BENTO ─── */}
      <section id="features" className="py-24 md:py-32 px-6 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-[0.12em] mb-4">Features</p>
            <h2 className="text-[32px] md:text-[42px] font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight mb-4 tracking-[-0.025em]">
              One platform. Every advantage.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-md mx-auto">
              Stop juggling tools. Everything you need to land the role — tracking, coaching, reminders, and analysis — in one place.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card: Kanban */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 group relative p-8 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-slate-300/70 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-[0_4px_12px_rgba(59,130,246,0.30)]">
                  <LayoutGrid className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[20px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-3 tracking-tight">Visual Kanban Tracker</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed mb-6 max-w-md">
                  Drag-and-drop your applications through stages. See your entire pipeline at a glance — who ghosted, who responded, what&apos;s next. Never lose track of an opportunity again.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Drag & drop', 'Kanban + List view', 'Quick filters', 'Status tracking'].map((chip) => (
                    <span key={chip} className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[12px] font-medium text-blue-600">{chip}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* AI Coach */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="group relative p-8 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-slate-300/70 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-transparent -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-5 shadow-[0_4px_12px_rgba(139,92,246,0.30)]">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[18px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-3 tracking-tight">AI Interview Coach</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                  Practice with an AI that knows the role and company. Get STAR-method feedback and real-time tips.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Role-specific', 'Live feedback', 'Score tracking'].map((chip) => (
                    <span key={chip} className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-100 text-[11px] font-medium text-violet-600">{chip}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Smart Reminders */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="group relative p-7 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-slate-300/70 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 via-transparent to-transparent -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(245,158,11,0.28)]">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2 tracking-tight">Smart Reminders</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  AI-suggested follow-up timing based on industry norms. Never miss the window again.
                </p>
              </div>
            </motion.div>

            {/* Resume Analyzer */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="group relative p-7 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.07)] hover:border-slate-300/70 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(16,185,129,0.28)]">
                  <FileSearch className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2 tracking-tight">Resume Analyzer</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Instant match score, missing keywords, ATS tips, and rewritten bullet points in seconds.
                </p>
              </div>
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative p-7 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 border border-slate-600/50 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-white mb-2 tracking-tight">Analytics & Insights</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">
                  Track your offer rate, response rate, and interview conversion in a live dashboard.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-[0.12em] mb-4">How it works</p>
            <h2 className="text-[32px] md:text-[42px] font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight tracking-[-0.025em]">
              Three steps to a better job search
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-7 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px bg-gradient-to-r from-slate-200 via-emerald-200 to-slate-200" />

            {[
              { step: '01', title: 'Add your applications', desc: 'Paste a job URL or enter details in seconds. AI auto-fills and suggests optimal follow-up timing.' },
              { step: '02', title: 'Track every stage', desc: 'Move cards through your Kanban pipeline. Spot patterns, see what needs attention, and never let anything fall through.' },
              { step: '03', title: 'Prep, apply, repeat', desc: 'Practice interviews with AI, analyze your resume against JDs, and land offers faster.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="relative text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.06)] flex items-center justify-center mx-auto mb-5">
                  <span className="text-[15px] font-bold font-[family-name:var(--font-heading)] text-slate-900">{item.step}</span>
                </div>
                <h3 className="text-[16px] font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2 tracking-tight">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-24 md:py-32 px-6 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] text-emerald-600 font-semibold uppercase tracking-[0.12em] mb-4">Reviews</p>
            <h2 className="text-[32px] md:text-[42px] font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-[-0.025em]">
              Real stories. Real offers.
            </h2>
          </div>

          {/* Featured testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mb-5 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/8 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/6 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-[20px] md:text-[24px] text-white leading-[1.5] font-medium mb-8">
                &ldquo;The AI coach asked me questions I <em>actually got</em> in my final round. I walked in feeling genuinely prepared for the first time in my career. Landed the PM role at Google.&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[14px] font-bold text-white shadow-lg">
                  MJ
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">Marcus J.</p>
                  <p className="text-[12px] text-slate-400">Product Manager · Now at Google</p>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-medium text-emerald-400">Verified user</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Two smaller testimonials */}
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { name: 'Sarah C.', title: 'Software Engineer', company: 'Now at Stripe', initials: 'SC', color: 'from-violet-400 to-violet-600', text: 'Tracked 30+ applications without going insane. The Kanban board and reminders saved me from dropping the ball multiple times. Worth every minute of setup.' },
              { name: 'Priya P.', title: 'UX Designer', company: 'Now at Figma', initials: 'PP', color: 'from-rose-400 to-pink-600', text: 'Resume analyzer showed me I was missing 6 key terms from the job description. Updated my resume on a Sunday, got 3 interview callbacks by Wednesday.' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="p-7 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-[14px] text-slate-600 leading-[1.7] mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-[12px] font-bold text-white`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{t.name}</p>
                    <p className="text-[12px] text-slate-400">{t.title} · {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── METRICS BAR ─── */}
      <section className="py-16 px-6 border-y border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: '3.2×', label: 'more interviews booked', icon: '📈' },
              { value: '67%', label: 'faster follow-up times', icon: '⚡' },
              { value: '2×', label: 'higher offer rate', icon: '🏆' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <p className="text-[11px] mb-2">{stat.icon}</p>
                <p className="text-[32px] md:text-[40px] font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[12px] text-slate-400 mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 md:py-36 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500" />
        <div className="absolute inset-0 -z-10 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-[20%] w-80 h-80 bg-white/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-[15%] w-64 h-64 bg-teal-400/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-emerald-200/70 text-[12px] font-semibold uppercase tracking-[0.12em] mb-5">Get started today</p>
            <h2 className="text-[36px] md:text-[48px] font-bold font-[family-name:var(--font-heading)] text-white leading-[1.1] mb-5 tracking-[-0.025em]">
              Your next role is out there.
              <br />
              <span className="text-emerald-200">Let&apos;s go get it.</span>
            </h2>
            <p className="text-emerald-100/70 text-[15px] mb-10 max-w-sm mx-auto leading-relaxed">
              Free to start. No credit card required. Set up in under 30 seconds.
            </p>
            <Link href="/signup">
              <Button
                variant="secondary"
                size="lg"
                className="h-13 px-9 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-[15px] font-semibold shadow-[0_8px_40px_rgba(0,0,0,0.20)] hover:shadow-[0_12px_50px_rgba(0,0,0,0.25)] transition-all"
              >
                Start tracking — it&apos;s free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-6 mt-8 text-[12px] text-emerald-200/60">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI-powered</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Private & secure</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-14 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-7 w-auto" />
              </div>
              <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
                The AI-powered job tracker that turns your search into a streamlined, winning workflow.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider mb-4">Product</p>
              <div className="space-y-2.5">
                {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#testimonials', 'Reviews'], ['/signup', 'Get started free']].map(([href, label]) => (
                  <a key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</a>
                ))}
              </div>
            </div>

            {/* Account links */}
            <div>
              <p className="text-[12px] font-semibold text-slate-900 uppercase tracking-wider mb-4">Account</p>
              <div className="space-y-2.5">
                {[['/login', 'Sign in'], ['/signup', 'Create account'], ['/forgot-password', 'Reset password']].map(([href, label]) => (
                  <Link key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-slate-400">&copy; {new Date().getFullYear()} PebelAI. All rights reserved.</p>
            <p className="text-[12px] text-slate-400">Built for job seekers, by people who&apos;ve been there.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
