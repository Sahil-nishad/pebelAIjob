'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, Command } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

const pageTitles: Record<string, { title: string; sub: string }> = {
  '/dashboard': { title: 'Overview', sub: 'Your job search at a glance' },
  '/applications': { title: 'Applications', sub: 'Track every opportunity' },
  '/coach': { title: 'AI Coach', sub: 'Practice makes perfect' },
  '/reminders': { title: 'Reminders', sub: 'Stay on top of follow-ups' },
  '/resume': { title: 'Resume Analyzer', sub: 'Optimize for every role' },
  '/settings': { title: 'Settings', sub: 'Manage your account' },
}

export function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useUser()

  const page = pageTitles[pathname] || { title: 'Dashboard', sub: '' }
  const displayName = profile?.name || user?.email?.split('@')[0] || 'U'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="fixed top-0 right-0 left-[244px] z-30 hidden h-16 items-center justify-between border-b border-slate-200/60 bg-white/95 px-7 backdrop-blur-2xl shadow-[0_1px_0_rgba(15,23,42,0.03)] md:flex">
      <div>
        <h1 className="font-[family-name:var(--font-heading)] text-[15px] font-bold text-slate-900 tracking-tight leading-none">
          {page.title}
        </h1>
        {page.sub && (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-none">{page.sub}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          type="button"
          onClick={() => router.push('/applications')}
          className="flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50 px-3 text-[12px] text-slate-400 transition-all hover:bg-white hover:border-slate-300 hover:text-slate-600 hover:shadow-sm"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search applications...</span>
          <div className="flex items-center gap-0.5 ml-3">
            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] text-slate-400">
              <Command className="w-2.5 h-2.5" />
            </kbd>
            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] text-slate-400">K</kbd>
          </div>
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => router.push('/reminders')}
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
          title="Reminders"
        >
          <Bell className="h-[16px] w-[16px] text-slate-500" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-bold text-white shadow-sm hover:shadow-md transition-shadow"
          title="Settings"
        >
          {initials}
        </button>
      </div>
    </header>
  )
}
