import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { deleteApplicationRecords } from '@/lib/application-store'
import { deleteCoachSessions } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const deletions = [
    { table: 'reminders', query: supabase.from('reminders').delete().eq('user_id', user.id) },
    { table: 'resume_analyses', query: supabase.from('resume_analyses').delete().eq('user_id', user.id) },
    { table: 'activity_log', query: supabase.from('activity_log').delete().eq('user_id', user.id) },
    { table: 'coach_sessions', query: supabase.from('coach_sessions').delete().eq('user_id', user.id) },
    { table: 'applications', query: supabase.from('applications').delete().eq('user_id', user.id) },
    { table: 'password_reset_tokens', query: supabase.from('password_reset_tokens').delete().eq('user_id', user.id) },
  ] as const

  for (const deletion of deletions) {
    const { error } = await deletion.query
    if (!error) continue

    if (deletion.table === 'applications' && isMissingTableError(error, deletion.table)) {
      deleteApplicationRecords(user.id)
      continue
    }

    if (deletion.table === 'coach_sessions' && isMissingTableError(error, deletion.table)) {
      deleteCoachSessions(user.id)
      continue
    }

    if (isMissingTableError(error, deletion.table)) continue

    console.error('[settings/delete-account] Failed to delete user data:', deletion.table, error)
    return NextResponse.json({ error: 'Failed to delete account data. Please try again.' }, { status: 500 })
  }

  const { error: userDeleteError } = await supabase.from('users').delete().eq('id', user.id)
  if (userDeleteError) {
    console.error('[settings/delete-account] Failed to delete user:', userDeleteError)
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
