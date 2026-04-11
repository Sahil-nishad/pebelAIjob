'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { AuthProvider } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/topnav'
import { MobileNav } from '@/components/layout/mobile-nav'

function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login')
      } else {
        setChecked(true)
      }
    })
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/35 border-t-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <TopNav />
      <main className="md:ml-[244px] mt-0 md:mt-16 pb-24 md:pb-8 p-4 md:p-6 lg:p-8">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardGuard>{children}</DashboardGuard>
    </AuthProvider>
  )
}
