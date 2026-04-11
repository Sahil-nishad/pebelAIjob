import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './nextauth'
import { getSupabaseServer } from './supabase'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const supabase = getSupabaseServer()
  return {
    user: { id: session.user.id, email: session.user.email },
    supabase,
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
