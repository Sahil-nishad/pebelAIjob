'use client'

import { Download, Puzzle, MousePointer2, Shield, Check, ArrowRight, Chrome, Zap, Bell, Bot } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Download,
    title: 'Open the Chrome Web Store',
    desc: 'Click the "Add to Chrome" button below. This opens the PebelAI extension page in the Chrome Web Store.',
    note: 'Works on Chrome, Brave, Edge — any Chromium browser.',
  },
  {
    step: '02',
    icon: Puzzle,
    title: 'Click "Add to Chrome"',
    desc: 'Hit the blue "Add to Chrome" button on the Chrome Web Store page. A popup will appear asking for permissions — click "Add extension" to confirm.',
    note: 'The extension only reads job listing pages — it cannot access any other sites.',
  },
  {
    step: '03',
    icon: Shield,
    title: 'Sign in to your PebelAI account',
    desc: 'Click the PebelAI icon in your browser toolbar (top right). A small popup appears — log in with your PebelAI email and password to connect the extension to your dashboard.',
    note: 'Pin the extension to your toolbar for quick access.',
  },
  {
    step: '04',
    icon: MousePointer2,
    title: 'Browse any job site and click "Save"',
    desc: 'Go to LinkedIn, Indeed, Naukri, Glassdoor, or any company careers page. When you find a role you want, click the PebelAI icon — the extension detects the job details and shows a one-click "Add to PebelAI" button.',
    note: 'Company name, role title, and URL are captured automatically.',
  },
  {
    step: '05',
    icon: Check,
    title: 'Track, get reminded, and prep with AI',
    desc: 'The saved job appears instantly in your Applications dashboard. From there you can update the status, set follow-up reminders, and start an AI coach session for that specific role.',
    note: 'All your applications, managed in one place.',
  },
]

const works = [
  { icon: Zap, title: 'Detects job listings automatically', desc: 'The extension recognizes job pages on 50+ platforms and pre-fills the job details for you.' },
  { icon: MousePointer2, title: 'One-click to save', desc: 'No copying, no pasting. Click the extension icon, confirm, and it\'s in your tracker.' },
  { icon: Bell, title: 'Triggers smart reminders', desc: 'Saved jobs automatically get a follow-up reminder scheduled based on your preferences.' },
  { icon: Bot, title: 'Ready for AI Coach', desc: 'Once saved, you can start an interview prep session for that role in one click from your dashboard.' },
]

export default function ExtensionPage() {
  return (
    <div className="max-w-4xl mx-auto animate-fade-up">

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#0A6A47] flex items-center justify-center">
            <Puzzle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-slate-900 tracking-tight">Browser Extension</h1>
            <p className="text-[13px] text-slate-400">Auto-track jobs from any site in one click</p>
          </div>
        </div>
        <p className="text-[15px] text-slate-500 leading-[1.7] max-w-2xl">
          The PebelAI Chrome extension sits in your browser and captures job listings as you browse — so every application gets tracked without any manual entry.
        </p>
      </div>

      {/* Download CTA card */}
      <div className="rounded-2xl bg-[#0A6A47] p-7 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="text-[11px] text-emerald-300/70 font-semibold tracking-widest uppercase mb-1">Chrome Web Store</p>
          <h2 className="text-[20px] font-bold text-white mb-1">PebelAI — Job Tracker Extension</h2>
          <p className="text-[13px] text-white/60">Free · Works on Chrome, Brave, Edge</p>
        </div>
        <a
          href="https://chromewebstore.google.com/detail/pebelai/YOUR_EXTENSION_ID"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <button className="flex items-center gap-2.5 h-11 px-6 rounded-xl bg-white text-[#0A6A47] text-[14px] font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#4285F4" />
              <circle cx="12" cy="12" r="4" fill="white" />
              <path d="M12 8 L20.66 8" stroke="#EA4335" strokeWidth="2.5" />
              <path d="M12 8 C9 8 6.34 9.5 4.77 11.83" stroke="#FBBC05" strokeWidth="2.5" />
              <path d="M4.77 11.83 C6.34 14.17 9 15.67 12 15.67 C15 15.67 17.66 14.17 19.23 11.83" stroke="#34A853" strokeWidth="2.5" />
            </svg>
            Add to Chrome — Free
            <Download className="w-4 h-4" />
          </button>
        </a>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-2xl shadow-sm p-7 mb-6">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">How it works</h2>
        <p className="text-[12px] text-slate-400 mb-6">What happens when you use the extension</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {works.map((w) => (
            <div key={w.title} className="flex gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center shrink-0">
                <w.icon className="w-4 h-4 text-[#0A6A47]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 mb-0.5">{w.title}</p>
                <p className="text-[12px] text-slate-500 leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step by step */}
      <div className="bg-white rounded-2xl shadow-sm p-7 mb-6">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">Step-by-step setup</h2>
        <p className="text-[12px] text-slate-400 mb-7">Get started in under 2 minutes</p>

        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={s.step} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-xl bg-[#E8F5EE] border border-[#0A6A47]/20 flex items-center justify-center shrink-0 z-10">
                  <s.icon className="w-4 h-4 text-[#0A6A47]" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-slate-100 my-2" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-7 flex-1 min-w-0 ${i === steps.length - 1 ? '' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold text-slate-300 tracking-widest">{s.step}</span>
                  <h3 className="text-[14px] font-bold text-slate-900">{s.title}</h3>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed mb-2">{s.desc}</p>
                <div className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#0A6A47] shrink-0 mt-0.5" />
                  <p className="text-[12px] text-slate-400">{s.note}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supported sites */}
      <div className="bg-white rounded-2xl shadow-sm p-7 mb-6">
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">Supported job platforms</h2>
        <p className="text-[12px] text-slate-400 mb-5">Extension works out-of-the-box on these sites — and on any company careers page</p>
        <div className="flex flex-wrap gap-2">
          {['LinkedIn', 'Indeed', 'Glassdoor', 'Naukri', 'Internshala', 'AngelList / Wellfound', 'Greenhouse', 'Lever', 'Workday', 'Company career pages', 'And more...'].map((site) => (
            <span key={site} className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] text-slate-600 font-medium bg-slate-50">
              {site}
            </span>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-sm p-7">
        <h2 className="text-[17px] font-bold text-slate-900 mb-6">Common questions</h2>
        <div className="space-y-5">
          {[
            {
              q: 'Does the extension track my browsing?',
              a: 'No. The extension only activates on job listing pages and only when you click the icon. It does not monitor your general browsing activity.',
            },
            {
              q: 'What if the extension doesn\'t detect the job automatically?',
              a: 'You can still click the extension icon and fill in the details manually — company, role, and URL. It takes under 30 seconds.',
            },
            {
              q: 'Do I need to be signed in to use the extension?',
              a: 'Yes. You need a PebelAI account to save jobs. Sign up free at pebelai.com — no credit card needed.',
            },
            {
              q: 'Will it work on Brave or Edge browsers?',
              a: 'Yes. Any Chromium-based browser (Chrome, Brave, Edge, Arc) supports Chrome Web Store extensions.',
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
              <p className="text-[14px] font-bold text-slate-900 mb-1.5">{faq.q}</p>
              <p className="text-[13px] text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
