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
    <header className="fixed top-0 right-0 left-[244px] z-30 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/82 px-8 backdrop-blur-2xl shadow-[0_1px_0_rgba(15,23,42,0.02)] md:flex">
      <h1 className="font-[family-name:var(--font-heading)] text-[15px] font-semibold text-slate-900">{title}</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.push('/applications')}
          className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <div className="flex items-center gap-0.5 ml-4">
            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
              <Command className="w-2.5 h-2.5" />
            </kbd>
            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] text-slate-500 shadow-[0_1px_0_rgba(15,23,42,0.02)]">K</kbd>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/reminders')}
          className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
        >
          <Bell className="h-[18px] w-[18px] text-slate-500" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-lime-500 text-[12px] font-bold text-white shadow-sm"
        >
          U
        </button>
      </div>
    </header>
  )
}
