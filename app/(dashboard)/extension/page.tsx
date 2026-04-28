'use client'

import { Download, Puzzle, MousePointer2, Shield, Check, Zap, Bell, Bot, FolderOpen, ToggleRight, Globe } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Download,
    title: 'Download the extension',
    desc: 'Click the "Download Extension" button above. A ZIP file called pebelai-extension.zip will be saved to your computer (usually in your Downloads folder).',
    note: 'Works on Chrome, Brave, Edge — any Chromium-based browser.',
  },
  {
    step: '02',
    icon: FolderOpen,
    title: 'Unzip the file',
    desc: 'Find the downloaded ZIP file and extract it. Right-click → "Extract All" (Windows) or double-click (Mac). You\'ll get a folder called "extension" with the extension files inside.',
    note: 'Keep the folder somewhere permanent — Chrome needs it to stay there.',
  },
  {
    step: '03',
    icon: Globe,
    title: 'Open Chrome Extensions page',
    desc: 'Open Chrome (or Brave/Edge) and go to the extensions page. You can type chrome://extensions in the address bar and press Enter.',
    note: 'For Brave use brave://extensions — for Edge use edge://extensions.',
  },
  {
    step: '04',
    icon: ToggleRight,
    title: 'Enable Developer Mode',
    desc: 'On the Extensions page, look for the "Developer mode" toggle in the top-right corner and turn it ON. This lets you install extensions from your computer.',
    note: 'You\'ll see three new buttons appear after enabling it.',
  },
  {
    step: '05',
    icon: FolderOpen,
    title: 'Load the extension',
    desc: 'Click "Load unpacked" (the button that appears after enabling Developer mode). In the file picker that opens, navigate to and select the extracted extension folder.',
    note: 'Select the folder itself — not a file inside it.',
  },
  {
    step: '06',
    icon: Shield,
    title: 'Sign in to PebelAI',
    desc: 'Click the PebelAI icon that now appears in your browser toolbar (top-right area). The extension popup opens — log in with your PebelAI email and password to connect it to your dashboard.',
    note: 'Pin the extension for quick access: click the puzzle icon → pin PebelAI.',
  },
  {
    step: '07',
    icon: MousePointer2,
    title: 'Browse jobs and save them',
    desc: 'Go to LinkedIn, Indeed, Glassdoor, Naukri, or any company careers page. When you spot a role, click the PebelAI icon — the extension grabs the job details and adds it to your tracker.',
    note: 'Company name, role title, location, and URL are captured automatically.',
  },
]

const works = [
  { icon: Zap, title: 'Auto-detects job listings', desc: 'The extension recognizes job pages and pre-fills details for you — no copy-pasting needed.' },
  { icon: MousePointer2, title: 'One-click to save', desc: 'Click the extension icon, confirm, and the job is instantly in your Applications tracker.' },
  { icon: Bell, title: 'Triggers smart reminders', desc: 'Saved jobs can automatically get follow-up reminders scheduled based on your preferences.' },
  { icon: Bot, title: 'Ready for AI Coach', desc: 'Once saved, start an interview prep session for that specific role in one click from your dashboard.' },
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
          <p className="text-[11px] text-emerald-300/70 font-semibold tracking-widest uppercase mb-1">Free · Local Install</p>
          <h2 className="text-[20px] font-bold text-white mb-1">PebelAI — Job Tracker Extension</h2>
          <p className="text-[13px] text-white/60">Works on Chrome, Brave, Edge · No account needed to download</p>
        </div>
        <a
          href="/pebelai-extension.zip"
          download="pebelai-extension.zip"
          className="shrink-0"
        >
          <button className="flex items-center gap-2.5 h-11 px-6 rounded-xl bg-white text-[#0A6A47] text-[14px] font-bold hover:bg-emerald-50 transition-colors shadow-sm whitespace-nowrap">
            <Download className="w-4 h-4" />
            Download Extension
          </button>
        </a>
      </div>

      {/* Status dot legend */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <p className="text-[13px] font-bold text-slate-700 shrink-0">Extension status indicator:</p>
        <div className="flex gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#0A6A47] shrink-0 shadow-sm" />
            <span className="text-[13px] text-slate-600"><span className="font-bold text-slate-800">ON</span> — Logged in, extension active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0 shadow-sm" />
            <span className="text-[13px] text-slate-600"><span className="font-bold text-slate-800">OFF</span> — Not logged in</span>
          </div>
        </div>
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
        <h2 className="text-[17px] font-bold text-slate-900 mb-1">Step-by-step installation</h2>
        <p className="text-[12px] text-slate-400 mb-7">Get set up in under 3 minutes</p>

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
              <div className="pb-7 flex-1 min-w-0">
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
              q: 'Why isn\'t this on the Chrome Web Store?',
              a: 'The extension is in early access — we\'re installing it manually for now so we can update it quickly. A Chrome Web Store listing is planned once it\'s stable.',
            },
            {
              q: 'Does the extension track my browsing?',
              a: 'No. The extension only activates on job listing pages and only when you click the icon. It does not monitor your general browsing activity.',
            },
            {
              q: 'What if the extension doesn\'t detect the job automatically?',
              a: 'You can still click the extension icon and fill in the details manually — company, role, and URL. It takes under 30 seconds.',
            },
            {
              q: 'Will it work on Brave or Edge browsers?',
              a: 'Yes. Any Chromium-based browser (Chrome, Brave, Edge, Arc) supports unpacked extensions via Developer mode.',
            },
            {
              q: 'What does the ON / OFF badge on the icon mean?',
              a: 'Green "ON" means you\'re logged in and the extension can save jobs. Grey "OFF" means you\'re not logged in — open the popup and sign in to activate it.',
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
