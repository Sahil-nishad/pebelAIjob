import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { deleteApplicationRecords } from '@/lib/application-store'
import { deleteCoachSessions } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  // Delete all user data
  const results = await Promise.all([
    supabase.from('applications').delete().eq('user_id', user.id),
    supabase.from('reminders').delete().eq('user_id', user.id),
    supabase.from('coach_sessions').delete().eq('user_id', user.id),
    supabase.from('activity_log').delete().eq('user_id', user.id),
    supabase.from('users').delete().eq('id', user.id),
  ])

  if (results[0].error && isMissingTableError(results[0].error, 'applications')) {
    deleteApplicationRecords(user.id)
  }
  if (results[2].error && isMissingTableError(results[2].error, 'coach_sessions')) {
    deleteCoachSessions(user.id)
  }

  return NextResponse.json({ ok: true })
}
