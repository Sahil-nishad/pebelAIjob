'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
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
  Globe,
  ChevronRight,
  Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/40">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={420} height={120} className="h-8 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">Features</a>
          <a href="#how-it-works" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
          <a href="#testimonials" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">Reviews</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── Kanban Visual ─── */
function KanbanVisual() {
  const cols = [
    { title: 'Applied', dot: 'bg-blue-400', cards: [
      { name: 'Google', role: 'Senior PM', tag: 'Referral' },
      { name: 'Stripe', role: 'Engineer', tag: 'LinkedIn' },
      { name: 'Notion', role: 'Designer', tag: 'Direct' },
    ]},
    { title: 'Interview', dot: 'bg-amber-400', cards: [
      { name: 'Meta', role: 'PM Lead', tag: 'Round 2' },
      { name: 'Figma', role: 'Frontend', tag: 'Phone Screen' },
    ]},
    { title: 'Offer', dot: 'bg-emerald-400', cards: [
      { name: 'Vercel', role: 'DX Eng', tag: '$185K' },
    ]},
  ]

  return (
    <div className="animate-float">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg p-5 max-w-[520px] mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
          <span className="ml-auto text-[10px] text-slate-400 font-medium">PebelAI</span>
        </div>
        <div className="flex gap-3">
          {cols.map((col) => (
            <div key={col.title} className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                <span className="text-[11px] font-semibold text-slate-700">{col.title}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{col.cards.length}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((card) => (
                  <motion.div
                    key={card.name}
                    whileHover={{ y: -1 }}
                    className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 cursor-default"
                  >
                    <p className="text-[11px] font-semibold text-slate-800">{card.name}</p>
                    <p className="text-[10px] text-slate-500">{card.role}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500">{card.tag}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
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
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 -z-10 mesh-gradient" />
        <div className="absolute top-32 left-[10%] w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl -z-10" />
        <div className="absolute top-48 right-[8%] w-64 h-64 bg-blue-200/15 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[12px] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI-powered job tracking
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold font-[family-name:var(--font-heading)] leading-[1.1] tracking-tight text-slate-900">
                Track smarter.
                <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Interview better.
                </span>
                <br />
                Land the offer.
              </h1>

              <p className="text-[16px] leading-relaxed text-slate-500 max-w-md">
                The all-in-one platform that organizes your job search, preps you for interviews with AI coaching, and makes sure you never drop the ball.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-7 text-[14px] rounded-xl">
                    Start tracking — free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="ghost" size="lg" className="h-12 gap-2 text-[14px]">
                    <Play className="w-4 h-4" />
                    See how it works
                  </Button>
                </a>
              </div>

              <div className="flex items-center gap-4 pt-3">
                <div className="flex -space-x-2">
                  {['#6EE7B7', '#34D399', '#10B981', '#059669', '#047857'].map((color, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: color }} />
                  ))}
                </div>
                <p className="text-[13px] text-slate-500">
                  <span className="font-semibold text-slate-700">5,000+</span> job seekers tracking
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <KanbanVisual />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── LOGOS / TRUST ─── */}
      <section className="py-10 px-6 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[12px] text-slate-400 font-medium uppercase tracking-widest mb-6">
            Users have landed roles at
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-40 grayscale">
            {['Google', 'Meta', 'Stripe', 'Vercel', 'Notion', 'Figma'].map((name) => (
              <span key={name} className="text-[16px] font-bold text-slate-900 tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[12px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">The problem</p>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight mb-6">
              Your job search is a mess.<br />It doesn&apos;t have to be.
            </h2>
            <p className="text-[15px] text-slate-500 leading-relaxed max-w-xl mx-auto mb-12">
              Spreadsheets lose rows. Bookmarks pile up. Emails go unanswered. You forget which company you&apos;re interviewing with tomorrow. Sound familiar?
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { num: '73%', text: 'of job seekers lose track of their applications', sub: 'Source: LinkedIn Survey' },
              { num: '5 days', text: 'is the average response window before ghosting', sub: 'Follow up or lose out' },
              { num: '40%', text: 'of candidates feel unprepared for interviews', sub: 'AI coaching changes this' },
            ].map((stat, i) => (
              <motion.div
                key={stat.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <p className="text-3xl font-bold font-[family-name:var(--font-heading)] text-slate-900 mb-2">{stat.num}</p>
                <p className="text-[13px] text-slate-600 leading-snug mb-1">{stat.text}</p>
                <p className="text-[11px] text-slate-400">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 md:py-28 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight mb-4">
              One platform. Every advantage.
            </h2>
            <p className="text-[15px] text-slate-500 max-w-lg mx-auto">
              Stop juggling tools. PebelAI brings tracking, coaching, reminders, and analysis into one seamless experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: LayoutGrid, color: 'from-blue-500 to-blue-600',
                title: 'Visual Kanban Tracker',
                desc: 'Drag-and-drop your applications through stages. See your entire pipeline at a glance — who ghosted, who responded, what\'s next.',
                chips: ['Drag & drop', 'Multi-view', 'Quick filters'],
              },
              {
                icon: MessageSquare, color: 'from-violet-500 to-purple-600',
                title: 'AI Interview Coach',
                desc: 'Practice with an AI that knows the company, the role, and the interview format. Get STAR-method feedback and actionable tips.',
                chips: ['Role-specific', 'Real feedback', 'Score tracking'],
              },
              {
                icon: Bell, color: 'from-amber-500 to-orange-500',
                title: 'Smart Reminders',
                desc: 'Never forget to follow up. AI suggests optimal timing based on industry norms, and nudges you before it\'s too late.',
                chips: ['Auto-suggest', 'Overdue alerts', 'Snooze'],
              },
              {
                icon: FileSearch, color: 'from-emerald-500 to-teal-500',
                title: 'Resume Analyzer',
                desc: 'Paste your resume and job description. Get an instant match score, missing keywords, ATS tips, and rewritten bullet points.',
                chips: ['Match score', 'ATS check', 'Rewrites'],
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-7 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:border-slate-200 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[17px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mb-2">{f.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">{f.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {f.chips.map((chip) => (
                    <span key={chip} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-500">{chip}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[12px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-slate-900 leading-tight">
              Three steps to a better job search
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Add applications', desc: 'Paste a job link or enter details manually. AI auto-suggests follow-up timing.' },
              { step: '02', title: 'Track progress', desc: 'Move cards through your pipeline. See stats, timelines, and what needs attention.' },
              { step: '03', title: 'Prep & land it', desc: 'Practice interviews with AI, analyze your resume, and never miss a follow-up.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative"
              >
                <span className="text-[64px] font-bold font-[family-name:var(--font-heading)] text-slate-100 leading-none select-none">{item.step}</span>
                <h3 className="text-[16px] font-semibold font-[family-name:var(--font-heading)] text-slate-900 mt-1 mb-2">{item.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="py-20 md:py-28 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[12px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">Reviews</p>
            <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-slate-900">
              Loved by job seekers
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: 'Sarah C.', title: 'Software Engineer', company: 'Now at Stripe', text: 'Tracked 30+ applications without going insane. The Kanban board and reminders saved me from dropping the ball multiple times.', highlight: 'Kanban board' },
              { name: 'Marcus J.', title: 'Product Manager', company: 'Now at Google', text: 'The AI coach asked me questions I actually got in my interview. I walked in feeling genuinely prepared for the first time.', highlight: 'AI coach' },
              { name: 'Priya P.', title: 'UX Designer', company: 'Now at Figma', text: 'Resume analyzer showed me I was missing 6 key terms from the JD. Updated my resume, got callbacks from 3 companies the next week.', highlight: 'Resume analyzer' },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-400">{t.title} &middot; {t.company}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-14 px-6 border-y border-slate-100">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '3.2x', label: 'more interviews booked' },
            { value: '67%', label: 'faster response times' },
            { value: '2x', label: 'higher offer rate' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-heading)] text-slate-900">{stat.value}</p>
              <p className="text-[12px] text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" />
        <div className="absolute inset-0 -z-10 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-heading)] text-white leading-tight mb-4">
            Your next role is out there.<br />Let&apos;s go get it.
          </h2>
          <p className="text-emerald-100/80 text-[15px] mb-8 max-w-md mx-auto">
            Free to use. No credit card required. Set up in 30 seconds.
          </p>
          <Link href="/signup">
            <Button variant="secondary" size="lg" className="h-12 px-8 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-[14px] shadow-lg">
              Get started for free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-5 mt-8 text-[12px] text-emerald-200/70">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> AI-powered</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure & private</span>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">J</span>
            </div>
            <span className="text-[14px] font-bold font-[family-name:var(--font-heading)] text-slate-900">PebelAI</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors">How it works</a>
            <a href="#testimonials" className="text-[13px] text-slate-400 hover:text-slate-600 transition-colors">Reviews</a>
          </div>
          <p className="text-[12px] text-slate-400">&copy; 2024 PebelAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
