'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  Sparkles,
  Bell,
  BarChart3,
  Star,
  Puzzle,
  ChevronRight,
  Bot,
  Clock,
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
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-[0_1px_0_rgba(15,23,42,0.08)]' : 'bg-white/80 backdrop-blur-xl border-b border-slate-100'}`}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-7 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#testimonials', 'Reviews']].map(([href, label]) => (
            <a key={href} href={href} className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">{label}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">
            Log in
          </Link>
          <Link href="/signup">
            <button className="h-8 px-4 rounded-lg bg-[#16a34a] text-white text-[13px] font-medium hover:bg-[#15803d] transition-colors">
              Try it free
            </button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Dashboard Mockup ─── */
function DashboardMockup() {
  const apps = [
    { name: 'Google', role: 'Senior PM', status: 'Interview', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700' },
    { name: 'Stripe', role: 'Engineer II', status: 'Applied', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
    { name: 'Vercel', role: 'DX Engineer', status: 'Offer', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700' },
    { name: 'Figma', role: 'Frontend Dev', status: 'Applied', dot: 'bg-blue-400', badge: 'bg-blue-50 text-blue-700' },
    { name: 'Notion', role: 'Product Lead', status: 'Rejected', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500' },
  ]

  return (
    <div className="relative">
      {/* Floating AI suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute -top-3 -right-3 z-10 flex items-center gap-2 bg-white border border-emerald-200 rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <div className="w-5 h-5 rounded-full bg-[#16a34a] flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <p className="text-[11px] font-medium text-slate-700">Follow up with Google <span className="text-[#16a34a]">today</span></p>
      </motion.div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_40px_rgba(15,23,42,0.10)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
          <div className="flex items-center gap-1 ml-3 px-2.5 py-0.5 bg-white rounded border border-slate-200 text-[10px] text-slate-400">
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            pebelai.com/applications
          </div>
        </div>

        {/* Nav strip */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0">
          {['Overview', 'Applications', 'Reminders'].map((tab, i) => (
            <div key={tab} className={`px-3 py-1.5 rounded-md text-[11px] font-medium ${i === 1 ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>{tab}</div>
          ))}
        </div>

        {/* Applications list */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-700">12 applications tracked</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              <span className="text-[10px] text-[#16a34a] font-medium">Live</span>
            </div>
          </div>
          {apps.map((app) => (
            <div key={app.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                {app.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-800 leading-none mb-0.5">{app.name}</p>
                <p className="text-[10px] text-slate-400">{app.role}</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${app.badge}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${app.dot}`} />
                {app.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats chip */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute -bottom-3 -left-3 z-10 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <BarChart3 className="w-3.5 h-3.5 text-[#16a34a]" />
        <p className="text-[11px] font-semibold text-slate-700">67% response rate <span className="text-[#16a34a]">↑ +12%</span></p>
      </motion.div>
    </div>
  )
}

/* ─── Kanban Mini ─── */
function KanbanMini() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex gap-3">
        {[
          { label: 'Applied', dot: 'bg-blue-400', count: 8, cards: ['Google – PM', 'Stripe – Eng'] },
          { label: 'Interview', dot: 'bg-amber-400', count: 3, cards: ['Meta – Lead'] },
          { label: 'Offer', dot: 'bg-emerald-400', count: 1, cards: ['Vercel – DX'] },
        ].map((col) => (
          <div key={col.label} className="flex-1">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
              <span className="text-[10px] font-semibold text-slate-600">{col.label}</span>
              <span className="ml-auto text-[9px] bg-slate-100 rounded px-1 text-slate-400">{col.count}</span>
            </div>
            <div className="space-y-1.5">
              {col.cards.map(c => (
                <div key={c} className="bg-slate-50 border border-slate-100 rounded-md px-2 py-1.5 text-[10px] text-slate-600 font-medium">{c}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── AI Chat Mini ─── */
function AIChatMini() {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="bg-white/15 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed">
          Tell me about a time you led a cross-functional project.
        </div>
      </div>
      <div className="flex gap-2 items-start justify-end">
        <div className="bg-white/25 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed max-w-[80%]">
          At my last role I led the redesign of our onboarding flow...
        </div>
      </div>
      <div className="flex gap-2 items-start">
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="bg-white/15 rounded-lg px-3 py-2 text-[11px] text-white leading-relaxed">
          <span className="font-semibold">What worked:</span> Strong impact framing ✓<br />
          <span className="font-semibold">Improve:</span> Add specific metrics
        </div>
      </div>
    </div>
  )
}

/* ─── Analytics Mini ─── */
function AnalyticsMini() {
  const bars = [40, 65, 45, 80, 55, 90, 70]
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-16">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-slate-100 relative overflow-hidden">
            <div
              className="absolute bottom-0 w-full rounded-sm bg-[#16a34a]/60"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[['67%', 'Response rate'], ['3.2×', 'More interviews'], ['2×', 'Offer rate']].map(([v, l]) => (
          <div key={l} className="bg-slate-50 rounded-lg p-2 text-center">
            <p className="text-[13px] font-bold text-slate-900">{v}</p>
            <p className="text-[9px] text-slate-400 leading-tight">{l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Extension Mini ─── */
function ExtensionMini() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
        <Puzzle className="w-4 h-4 text-[#16a34a]" />
        <span className="text-[11px] font-medium text-slate-700">PebelAI extension active</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-[#16a34a]" />
      </div>
      <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
        <p className="text-[10px] text-slate-400 mb-1.5">Detected on LinkedIn job page</p>
        <p className="text-[11px] font-semibold text-slate-800 mb-2">Senior Product Manager · Google</p>
        <button className="w-full py-1.5 rounded-md bg-[#16a34a] text-white text-[10px] font-semibold">
          Add to PebelAI →
        </button>
      </div>
      <p className="text-[10px] text-slate-400 text-center">Saved to your tracker in 1 click</p>
    </div>
  )
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="pt-28 pb-20 md:pt-32 md:pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <h1 className="text-[42px] md:text-[52px] lg:text-[56px] font-bold leading-[1.08] tracking-[-0.03em] text-slate-900 font-[family-name:var(--font-heading)]">
                Track smarter.<br />
                Interview better.<br />
                <span className="text-[#16a34a]">Land the offer.</span>
              </h1>
              <p className="text-[16px] text-slate-500 leading-[1.7] max-w-[420px]">
                The all-in-one job management platform for ambitious candidates. Organize every application, prep with AI, and never miss a follow-up.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/signup">
                  <button className="flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white text-[14px] font-semibold hover:bg-slate-800 transition-colors">
                    Start for free <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <a href="#how-it-works" className="flex items-center gap-2 h-11 px-5 text-[14px] text-slate-500 hover:text-slate-900 transition-colors">
                  <Clock className="w-4 h-4" /> See how it works
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-violet-400', 'bg-rose-400', 'bg-amber-400', 'bg-[#16a34a]'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full border-2 border-white ${c}`} />
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-[12px] text-slate-400 mt-0.5">Loved by <span className="font-semibold text-slate-700">5,000+</span> job seekers</p>
                </div>
              </div>
            </motion.div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block relative"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─── */}
      <div className="border-y border-slate-100 py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] text-slate-400 tracking-widest uppercase font-medium mb-6">Users now work at</p>
          <div className="flex items-center justify-center gap-10 flex-wrap">
            {['Google', 'Meta', 'Stripe', 'Vercel', 'Figma', 'Notion'].map(name => (
              <span key={name} className="text-[14px] font-bold text-slate-200 hover:text-slate-300 transition-colors cursor-default tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 md:py-32 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="mb-14">
            <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)] mb-3">
              Precision tools for the modern hunt
            </h2>
            <p className="text-[15px] text-slate-500 max-w-lg">
              Stop juggling spreadsheets and sticky notes. PebelAI gives you a professional-grade toolkit built for the way job searching actually works.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* Visual Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Visual Pipeline Management</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">See every application at a glance</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Drag-and-drop Kanban and list views. Move cards through stages, spot patterns, and never lose an opportunity in the noise.
              </p>
              <KanbanMini />
            </motion.div>

            {/* AI Advisor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="p-7 rounded-2xl bg-[#16a34a] border border-[#15803d] hover:shadow-[0_8px_32px_rgba(22,163,74,0.25)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-4">AI Advisor</p>
              <h3 className="text-[18px] font-bold text-white mb-2 tracking-tight font-[family-name:var(--font-heading)]">Practice. Get feedback. Nail it.</h3>
              <p className="text-[13px] text-white/70 leading-relaxed mb-5">
                Role-specific interview coaching powered by AI. Get STAR-format feedback and concrete improvements after every answer.
              </p>
              <AIChatMini />
            </motion.div>

            {/* Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Search Analytics</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">Know what&apos;s working</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Track response rates, interview conversion, and offer velocity. Data-driven decisions instead of gut feelings.
              </p>
              <AnalyticsMini />
            </motion.div>

            {/* Browser Extension */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="p-7 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-300"
            >
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Browser Extension</p>
              <h3 className="text-[18px] font-bold text-slate-900 mb-2 tracking-tight font-[family-name:var(--font-heading)]">Save jobs in one click</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                Browse LinkedIn or any job board and add applications directly to PebelAI without leaving the page.
              </p>
              <ExtensionMini />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[12px] text-[#16a34a] font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-[32px] md:text-[40px] font-bold tracking-[-0.025em] text-slate-900 font-[family-name:var(--font-heading)]">
              Three steps to a better job search
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-6 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px bg-gradient-to-r from-slate-200 via-[#16a34a]/30 to-slate-200" />
            {[
              { step: '01', title: 'Add your applications', desc: 'Paste a job URL or enter details in seconds. AI auto-fills and suggests follow-up timing.' },
              { step: '02', title: 'Track every stage', desc: 'Move cards through your pipeline. Spot patterns and never let anything fall through the cracks.' },
              { step: '03', title: 'Prep, apply, repeat', desc: 'Practice interviews with AI, get personalized coaching, and land offers faster.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                  <span className="text-[14px] font-bold text-slate-900">{item.step}</span>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── */}
      <section id="testimonials" className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-200 rounded-2xl p-10 md:p-14 text-center shadow-[0_4px_40px_rgba(0,0,0,0.04)]"
          >
            <div className="flex justify-center gap-0.5 mb-7">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <blockquote className="text-[20px] md:text-[24px] font-medium text-slate-900 leading-[1.5] mb-8 tracking-tight">
              &ldquo;The first job tracker that actually feels like a professional tool, not a toy.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-[13px] font-bold text-white">
                MJ
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-slate-900">Marcus J.</p>
                <p className="text-[12px] text-slate-400">Product Manager · Now at Google</p>
              </div>
            </div>
          </motion.div>

          {/* Two small quotes */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {[
              { initials: 'SC', color: 'from-violet-400 to-violet-600', name: 'Sarah C.', title: 'Software Eng · Now at Stripe', text: 'Tracked 30+ applications without going insane. The reminders alone are worth it.' },
              { initials: 'PP', color: 'from-rose-400 to-pink-600', name: 'Priya P.', title: 'UX Designer · Now at Figma', text: 'AI coach helped me nail behaviorals I always struggled with. Got 3 callbacks in one week.' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-colors"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[13px] text-slate-600 leading-[1.7] mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[10px] font-bold text-white`}>{t.initials}</div>
                  <div>
                    <p className="text-[12px] font-semibold text-slate-800">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="border-y border-slate-100 py-12 px-6 bg-slate-50/60">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: '5.0', label: 'Average rating', sub: 'From 500+ reviews' },
              { value: '4.8×', label: 'More interviews', sub: 'vs. manual tracking' },
              { value: 'Free', label: 'To get started', sub: 'No credit card needed' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <p className="text-[32px] md:text-[40px] font-bold tracking-tight text-slate-900">{s.value}</p>
                <p className="text-[13px] font-semibold text-slate-700 mt-1">{s.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-[36px] md:text-[48px] font-bold tracking-[-0.03em] text-slate-900 mb-4 font-[family-name:var(--font-heading)]">
              Your next role is out there.
            </h2>
            <p className="text-[16px] text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Free to start. No credit card required. Set up in under 30 seconds.
            </p>
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                Start tracking — it&apos;s free <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <div className="flex items-center justify-center gap-6 mt-6 text-[12px] text-slate-400">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#16a34a]" /> Free forever plan</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#16a34a]" /> AI-powered</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#16a34a]" /> Private & secure</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-10">
            <div className="max-w-xs">
              <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-6 w-auto mb-3" />
              <p className="text-[13px] text-slate-400 leading-relaxed">
                The AI-powered job tracker that turns your search into a streamlined, winning workflow.
              </p>
            </div>
            <div className="flex gap-14">
              <div>
                <p className="text-[12px] font-semibold text-slate-900 mb-3">Product</p>
                <div className="space-y-2">
                  {[['#features', 'Features'], ['#how-it-works', 'How it works'], ['#testimonials', 'Reviews'], ['/signup', 'Get started']].map(([href, label]) => (
                    <a key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-semibold text-slate-900 mb-3">Account</p>
                <div className="space-y-2">
                  {[['/login', 'Sign in'], ['/signup', 'Create account'], ['/forgot-password', 'Reset password']].map(([href, label]) => (
                    <Link key={href} href={href} className="block text-[13px] text-slate-400 hover:text-slate-700 transition-colors">{label}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[12px] text-slate-400">&copy; {new Date().getFullYear()} PebelAI. All rights reserved.</p>
            <p className="text-[12px] text-slate-400">Built for job seekers, by people who&apos;ve been there.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
