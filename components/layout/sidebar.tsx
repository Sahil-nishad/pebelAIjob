'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Bot,
  Bell,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: ClipboardList, label: 'Applications', href: '/applications' },
  { icon: Bot, label: 'AI Coach', href: '/coach' },
  { icon: Bell, label: 'Reminders', href: '/reminders' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[244px] flex-col border-r border-slate-200/60 bg-[#FBFBFB] md:flex">

      {/* Logo */}
      <div className="flex h-24 shrink-0 flex-col justify-center px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0A6A47] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-[family-name:var(--font-heading)] text-[18px] font-bold tracking-tight text-[#13211B] leading-none">
              PebelAI
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest mt-1 uppercase">
              The Digital Curator
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold transition-all duration-150',
                isActive
                  ? 'bg-[#0A6A47] text-white shadow-lg shadow-emerald-900/10'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold transition-all duration-150',
            pathname === '/settings'
              ? 'bg-[#0A6A47] text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          )}
        >
          <Settings className={cn('h-[18px] w-[18px] shrink-0', pathname === '/settings' ? 'text-white' : 'text-slate-400')} />
          Settings
        </Link>
      </nav>

    </aside>
  )
}
