import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth

  // 26 weeks ≈ 6 months
  const since = new Date()
  since.setDate(since.getDate() - 182)
  const sinceStr = since.toISOString().slice(0, 10)

  // Fetch applications
  const { data: apps } = await supabase
    .from('applications')
    .select('applied_date')
    .eq('user_id', user.id)
    .gte('applied_date', sinceStr)

  // Fetch coach sessions with score and question count
  const { data: sessions } = await supabase
    .from('coach_sessions')
    .select('created_at, avg_score, question_count')
    .eq('user_id', user.id)
    .gte('created_at', sinceStr)

  // Map: date → { appCount, coachIntensity }
  const dayMap = new Map<string, { appCount: number; coachIntensity: number }>()

  const getOrCreate = (ds: string) => {
    if (!dayMap.has(ds)) dayMap.set(ds, { appCount: 0, coachIntensity: 0 })
    return dayMap.get(ds)!
  }

  // Count applications per day
  for (const app of apps ?? []) {
    const ds = (app.applied_date as string).slice(0, 10)
    getOrCreate(ds).appCount++
  }

  // Calculate coach session intensity per day
  // Intensity formula: (avg_score / 100) * min(question_count, 10) / 10 * 4
  // → 0 to 4 scale, where 4 = perfect score + long session
  for (const session of sessions ?? []) {
    const ds = new Date(session.created_at).toISOString().slice(0, 10)
    const score = session.avg_score ?? 50
    const qCount = session.question_count ?? 1
    // Intensity: 1 = any session, 2 = decent, 3 = good, 4 = excellent
    const intensity = score >= 80 && qCount >= 6 ? 4
      : score >= 65 && qCount >= 4 ? 3
      : score >= 50 && qCount >= 2 ? 2
      : 1
    const day = getOrCreate(ds)
    day.coachIntensity = Math.max(day.coachIntensity, intensity)
  }

  // Combine: final count = appCount + coachIntensity (so both contribute to shade)
  const days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    count: data.appCount + data.coachIntensity,
    appCount: data.appCount,
    coachIntensity: data.coachIntensity,
  }))

  const total = (apps ?? []).length
  const totalSessions = (sessions ?? []).length

  return NextResponse.json({ days, total, totalSessions })
}
