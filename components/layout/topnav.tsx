'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Command } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Overview',
  '/applications': 'Applications',
  '/coach': 'AI Coach',
  '/reminders': 'Reminders',
  '/resume': 'Resume Analyzer',
  '/settings': 'Settings',
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const title = pageTitles[pathname] || 'Dashboard'

  return (
    <header className="fixed top-0 right-0 left-[244px] h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 z-30 hidden md:flex items-center justify-between px-8">
      <h1 className="text-[15px] font-semibold font-[family-name:var(--font-heading)] text-slate-900">{title}</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/applications')}
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200/60 text-[13px] text-slate-400 cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <div className="flex items-center gap-0.5 ml-4">
            <kbd className="h-5 px-1.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 inline-flex items-center shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              <Command className="w-2.5 h-2.5" />
            </kbd>
            <kbd className="h-5 px-1.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-400 inline-flex items-center shadow-[0_1px_0_rgba(0,0,0,0.06)]">K</kbd>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/reminders')}
          className="relative w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
        >
          <Bell className="w-[18px] h-[18px] text-slate-400" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[12px] font-bold text-white cursor-pointer shadow-sm"
        >
          U
        </button>
      </div>
    </header>
  )
}
