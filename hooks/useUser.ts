'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { signOut as firebaseSignOut, onAuthStateChanged, type User } from 'firebase/auth'
import { authFetch } from '@/lib/api'
import type { UserProfile } from '@/types'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const res = await authFetch('/api/settings/profile')
          if (res.ok) {
            const data = await res.json()
            setProfile(data)
          }
        } catch { /* ignore */ }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setProfile(null)
  }

  return { user, profile, loading, signOut }
}
