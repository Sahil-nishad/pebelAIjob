'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, X } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useState } from 'react'
import Image from 'next/image'

export function TopNav() {
  const { user, profile } = useUser()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayRole = profile?.job_type || 'Job Seeker'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/applications?q=${encodeURIComponent(query.trim())}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[244px] z-30 h-16 md:h-24 flex items-center justify-between bg-[#FBFBFB] border-b border-slate-200/60 md:border-none px-4 md:px-8">

      {/* Mobile: Logo */}
      <Link href="/dashboard" className="md:hidden">
        <Image src="/pebelai-logo.svg" alt="PebelAI" width={130} height={42} className="object-contain" priority />
      </Link>

      {/* Desktop: Search bar */}
      <div className="hidden md:flex flex-1 max-w-xl">
        <form onSubmit={handleSearch} className="w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0A6A47] transition-colors" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search applications, roles, or contacts..."
            className="w-full h-11 bg-[#F1F5F2] border-none rounded-xl pl-11 pr-4 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A6A47]/20 transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-3 md:gap-6">

        {/* Mobile: Search toggle */}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications → Reminders */}
        <Link href="/reminders" className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#FBFBFB]" />
        </Link>

        {/* User Profile */}
        <Link href="/settings" className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200">
          <div className="hidden md:block text-right">
            <p className="text-[14px] font-bold text-[#13211B] leading-none">{displayName}</p>
            <p className="text-[11px] text-slate-400 mt-1">{displayRole}</p>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#E8F0EB] flex items-center justify-center text-[#0A6A47] font-bold text-[12px] md:text-[13px]">
            {initials}
          </div>
        </Link>
      </div>

      {/* Mobile: Expandable search bar */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#FBFBFB] border-b border-slate-200/60 px-4 py-3 md:hidden">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search applications..."
              className="w-full h-10 bg-[#F1F5F2] rounded-xl pl-9 pr-9 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0A6A47]/20"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setQuery('') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </header>
  )
}
