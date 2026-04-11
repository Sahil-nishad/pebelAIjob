import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { listCoachSessions } from '@/lib/coach-session-store'
import { listApplicationRecords } from '@/lib/application-store'
import { isMissingTableError } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const [apps, reminders, sessions] = await Promise.all([
    supabase.from('applications').select('*').eq('user_id', user.id),
    supabase.from('reminders').select('*').eq('user_id', user.id),
    supabase.from('coach_sessions').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user_email: user.email,
    applications: apps.error && isMissingTableError(apps.error, 'applications')
      ? listApplicationRecords(user.id)
      : apps.data || [],
    reminders: reminders.data || [],
    coach_sessions: sessions.error && isMissingTableError(sessions.error, 'coach_sessions')
      ? listCoachSessions(user.id)
      : sessions.data || [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pebelai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
