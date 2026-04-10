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
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/95 backdrop-blur-xl border-t border-slate-200/60 flex items-start justify-around pt-2 z-40 md:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center gap-0.5 pt-1 pb-1 px-3 rounded-lg transition-colors',
              isActive ? 'text-emerald-600' : 'text-slate-400'
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
