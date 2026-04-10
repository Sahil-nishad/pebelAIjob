'use client'

import { useUser } from './useUser'

export function useSubscription() {
  const { profile } = useUser()

  const isPro = profile?.plan === 'pro'

  const checkLimit = (feature: 'applications' | 'ai' | 'resume') => {
    if (isPro) return { allowed: true, reason: '' }

    return {
      allowed: true,
      reason: '',
    }
  }

  return { isPro, plan: profile?.plan || 'free', checkLimit }
}
