import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase'

const ADMIN_EMAIL = 'sahilsahani13@gmail.com'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  if (auth.user.email !== ADMIN_EMAIL) return unauthorized()

  const supabase = getSupabaseServer()

  const [users, applications, coachSessions, reminders, resumeAnalyses, activityLog] =
    await Promise.all([
      supabase.from('users').select('id, email, name, job_type, experience_level, created_at').order('created_at', { ascending: false }),
      supabase.from('applications').select('id, user_id, company_name, role_title, status, applied_date, source, created_at').order('created_at', { ascending: false }),
      supabase.from('coach_sessions').select('id, user_id, company, role, session_type, question_count, created_at').order('created_at', { ascending: false }),
      supabase.from('reminders').select('id, user_id, title, reminder_type, due_date, is_done, created_at').order('created_at', { ascending: false }),
      supabase.from('resume_analyses').select('id, user_id, score, created_at').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('id, user_id, event_type, created_at').order('created_at', { ascending: false }).limit(200),
    ])

  return NextResponse.json({
    users: users.data ?? [],
    applications: applications.data ?? [],
    coachSessions: coachSessions.data ?? [],
    reminders: reminders.data ?? [],
    resumeAnalyses: resumeAnalyses.data ?? [],
    activityLog: activityLog.data ?? [],
  })
}
