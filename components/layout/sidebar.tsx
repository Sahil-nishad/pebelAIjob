'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Bot,
  Bell,
  FileText,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: ClipboardList, label: 'Applications', href: '/applications' },
  { icon: Bot, label: 'AI Coach', href: '/coach' },
  { icon: Bell, label: 'Reminders', href: '/reminders' },
  { icon: FileText, label: 'Resume Analyzer', href: '/resume' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useUser()

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[244px] flex-col border-r border-slate-200/60 bg-white/95 backdrop-blur-2xl shadow-[1px_0_0_rgba(15,23,42,0.04)] md:flex">

      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5 border-b border-slate-100/80">
        <Image src="/pebelai-mark.svg" alt="PebelAI" width={28} height={28} className="w-7 h-7" />
        <span className="font-[family-name:var(--font-heading)] text-[15px] font-bold tracking-tight text-slate-900">
          PebelAI
        </span>
      </div>

      {/* New Application CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/applications">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-[13px] font-semibold hover:from-emerald-400 hover:to-emerald-300 transition-all shadow-[0_4px_12px_rgba(47,133,90,0.22)] hover:shadow-[0_6px_18px_rgba(47,133,90,0.30)] cursor-pointer">
            <Plus className="w-4 h-4 shrink-0" />
            New application
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-slate-900 text-white shadow-[0_2px_8px_rgba(15,23,42,0.16)]'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className={cn('h-[17px] w-[17px] shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-slate-100" />
        </div>

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150',
            pathname === '/settings'
              ? 'bg-slate-900 text-white shadow-[0_2px_8px_rgba(15,23,42,0.16)]'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Settings className={cn('h-[17px] w-[17px] shrink-0', pathname === '/settings' ? 'text-white' : 'text-slate-400')} />
          Settings
        </Link>
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 hover:bg-slate-50 transition-colors group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-[12px] font-bold text-white shadow-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-[11px] text-slate-400">{displayEmail}</p>
          </div>
          <button
            onClick={signOut}
            className="cursor-pointer p-1 rounded-lg hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </aside>
  )
}
