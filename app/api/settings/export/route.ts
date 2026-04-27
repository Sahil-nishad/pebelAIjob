import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { listCoachSessions } from '@/lib/coach-session-store'
import { listApplicationRecords } from '@/lib/application-store'
import { isMissingTableError } from '@/lib/supabase'

const PROFILE_COLUMNS = 'id, email, name, phone, title, linkedin, location, target_roles, target_companies, job_type, experience_level, salary_min, salary_max, plan, email_digest, follow_up_days, interview_prep_days, created_at'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const [profile, apps, reminders, sessions, resumeAnalyses, activityLog] = await Promise.all([
    supabase.from('users').select(PROFILE_COLUMNS).eq('id', user.id).single(),
    supabase.from('applications').select('*').eq('user_id', user.id),
    supabase.from('reminders').select('*').eq('user_id', user.id),
    supabase.from('coach_sessions').select('*').eq('user_id', user.id),
    supabase.from('resume_analyses').select('*').eq('user_id', user.id),
    supabase.from('activity_log').select('*').eq('user_id', user.id),
  ])

  const errors = [profile, apps, reminders, sessions, resumeAnalyses, activityLog].filter(
    (result) => result.error && !isMissingTableError(result.error, 'applications') && !isMissingTableError(result.error, 'coach_sessions')
  )

  if (errors.length > 0) {
    console.error('[settings/export] Export query failed:', errors.map((result) => result.error?.message))
    return NextResponse.json({ error: 'Failed to export account data.' }, { status: 500 })
  }

  const exportData = {
    exported_at: new Date().toISOString(),
    user_email: user.email,
    profile: profile.data ?? null,
    applications: apps.error && isMissingTableError(apps.error, 'applications')
      ? listApplicationRecords(user.id)
      : apps.data || [],
    reminders: reminders.data || [],
    coach_sessions: sessions.error && isMissingTableError(sessions.error, 'coach_sessions')
      ? listCoachSessions(user.id)
      : sessions.data || [],
    resume_analyses: resumeAnalyses.data || [],
    activity_log: activityLog.data || [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pebelai-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
