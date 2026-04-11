'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, Bot, Bell, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { icon: LayoutDashboard, label: 'Home', href: '/dashboard' },
  { icon: ClipboardList, label: 'Jobs', href: '/applications' },
  { icon: Bot, label: 'Coach', href: '/coach' },
  { icon: Bell, label: 'Reminders', href: '/reminders' },
  { icon: MoreHorizontal, label: 'More', href: '/settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[72px] items-start justify-around border-t border-slate-200/80 bg-white/92 pt-2 backdrop-blur-2xl shadow-[0_-10px_30px_rgba(15,23,42,0.04)] md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-lg px-3 pb-1 pt-1 transition-colors',
              isActive ? 'text-emerald-700' : 'text-slate-500'
            )}
          >
            <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && <div className="w-4 h-0.5 rounded-full bg-emerald-500 mt-0.5" />}
          </Link>
        )
      })}
    </nav>
  )
}
