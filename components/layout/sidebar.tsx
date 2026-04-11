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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: ClipboardList, label: 'Applications', href: '/applications' },
  { icon: Bot, label: 'AI Coach', href: '/coach' },
  { icon: Bell, label: 'Reminders', href: '/reminders' },
  { icon: FileText, label: 'Resume Analyzer', href: '/resume' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useUser()

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || 'user@email.com'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[244px] flex-col border-r border-slate-200/80 bg-white/82 backdrop-blur-2xl shadow-[12px_0_40px_rgba(15,23,42,0.04)] md:flex">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <Image src="/pebelai-mark.svg" alt="PebelAI" width={28} height={28} className="w-7 h-7" />
        <span className="font-[family-name:var(--font-heading)] text-[15px] font-bold tracking-tight text-slate-900">
          PebelAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-emerald-600' : 'text-slate-400')} />
              {item.label}
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="shrink-0 border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-lime-500 text-[12px] font-bold text-white shadow-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-900">{displayName}</p>
            <p className="truncate text-[11px] text-slate-500">{displayEmail}</p>
          </div>
          <button onClick={signOut} className="cursor-pointer" title="Sign out">
            <LogOut className="h-4 w-4 shrink-0 text-slate-400 transition-colors hover:text-slate-700" />
          </button>
        </div>
      </div>
    </aside>
  )
}
