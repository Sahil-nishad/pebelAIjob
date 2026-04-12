'use client'

import { Bell, Search } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

export function TopNav() {
  const { user, profile } = useUser()

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User'
  const displayRole = profile?.job_type || 'Job Seeker'

  return (
    <header className="fixed top-0 right-0 left-[244px] z-30 hidden h-24 items-center justify-between bg-[#FBFBFB] px-8 md:flex">
      
      {/* Search bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0A6A47] transition-colors" />
          <input 
            type="text" 
            placeholder="Search applications, roles, or contacts..."
            className="w-full h-11 bg-[#F1F5F2] border-none rounded-xl pl-11 pr-4 text-[14px] text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:ring-[#0A6A47]/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#FBFBFB]" />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-[14px] font-bold text-[#13211B] leading-none">{displayName}</p>
            <p className="text-[11px] text-slate-400 mt-1">{displayRole}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E8F0EB] flex items-center justify-center text-[#0A6A47] font-bold text-[13px]">
            {displayName[0]?.toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
