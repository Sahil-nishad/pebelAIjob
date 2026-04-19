'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Bot,
  Bell,
  Settings,
  Puzzle,
} from 'lucide-react'
import Image from 'next/image'
import { GlowMenu, type GlowMenuItem } from '@/components/ui/glow-menu'

const navItems: GlowMenuItem[] = [
  {
    icon: LayoutDashboard,
    label: 'Overview',
    href: '/dashboard',
    gradient: 'radial-gradient(circle, rgba(10,106,71,0.18) 0%, rgba(10,106,71,0.07) 50%, rgba(10,106,71,0) 100%)',
    iconColor: 'text-emerald-600',
  },
  {
    icon: ClipboardList,
    label: 'Applications',
    href: '/applications',
    gradient: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.07) 50%, rgba(20,184,166,0) 100%)',
    iconColor: 'text-teal-500',
  },
  {
    icon: Bot,
    label: 'AI Coach',
    href: '/coach',
    gradient: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0.07) 50%, rgba(139,92,246,0) 100%)',
    iconColor: 'text-violet-500',
  },
  {
    icon: Bell,
    label: 'Reminders',
    href: '/reminders',
    gradient: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.07) 50%, rgba(245,158,11,0) 100%)',
    iconColor: 'text-amber-500',
  },
  {
    icon: Puzzle,
    label: 'Extension',
    href: '/extension',
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.07) 50%, rgba(59,130,246,0) 100%)',
    iconColor: 'text-blue-500',
  },
]

const settingsItem: GlowMenuItem = {
  icon: Settings,
  label: 'Settings',
  href: '/settings',
  gradient: 'radial-gradient(circle, rgba(100,116,139,0.18) 0%, rgba(100,116,139,0.07) 50%, rgba(100,116,139,0) 100%)',
  iconColor: 'text-slate-500',
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[244px] flex-col border-r border-slate-200/60 bg-[#FBFBFB] md:flex">

      {/* Logo */}
      <div className="flex h-24 shrink-0 items-center px-5">
        <Link href="/dashboard">
          <Image src="/pebelai-logo.svg" alt="PebelAI" width={160} height={42} className="object-contain" priority />
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2">
        <GlowMenu items={navItems} activeHref={pathname} />
      </nav>

      {/* Settings pinned at bottom */}
      <div className="px-3 pb-5">
        <div className="border-t border-slate-100 pt-3">
          <GlowMenu items={[settingsItem]} activeHref={pathname} />
        </div>
      </div>

    </aside>
  )
}
