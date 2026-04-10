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
    <aside className="fixed left-0 top-0 bottom-0 w-[244px] bg-white border-r border-slate-200/60 z-40 hidden md:flex flex-col">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-2.5 shrink-0">
        <Image src="/pebelai-mark.svg" alt="PebelAI" width={28} height={28} className="w-7 h-7" />
        <span className="text-[15px] font-bold font-[family-name:var(--font-heading)] text-slate-900 tracking-tight">
          PebelAI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px]', isActive ? 'text-emerald-600' : 'text-slate-400')} />
              {item.label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[12px] font-bold text-white shadow-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-slate-900 truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
          </div>
          <button onClick={signOut} className="cursor-pointer" title="Sign out">
            <LogOut className="w-4 h-4 text-slate-300 hover:text-slate-500 transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  )
}
