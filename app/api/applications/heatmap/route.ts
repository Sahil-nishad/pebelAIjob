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

  // Fetch coach sessions only — heatmap is now purely about practice
  const { data: sessions } = await supabase
    .from('coach_sessions')
    .select('created_at, avg_score, question_count')
    .eq('user_id', user.id)
    .gte('created_at', sinceStr)

  // Map: date → best session intensity for that day
  const dayMap = new Map<string, { intensity: number; sessions: number; bestScore: number }>()

  for (const session of sessions ?? []) {
    const ds = new Date(session.created_at).toISOString().slice(0, 10)
    const score = session.avg_score ?? 50
    const qCount = session.question_count ?? 1

    // Intensity 1-4 based on score + question count
    const intensity = score >= 80 && qCount >= 6 ? 4
      : score >= 65 && qCount >= 4 ? 3
      : score >= 50 && qCount >= 2 ? 2
      : 1

    const existing = dayMap.get(ds)
    if (!existing) {
      dayMap.set(ds, { intensity, sessions: 1, bestScore: score })
    } else {
      dayMap.set(ds, {
        intensity: Math.max(existing.intensity, intensity),
        sessions: existing.sessions + 1,
        bestScore: Math.max(existing.bestScore, score),
      })
    }
  }

  const days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    count: data.intensity,       // count drives the shade
    sessions: data.sessions,
    bestScore: data.bestScore,
    intensity: data.intensity,
  }))

  const totalSessions = (sessions ?? []).length
  const totalDays = dayMap.size

  // Stats for "Your Progress" panel
  const avgScore = sessions && sessions.length > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.avg_score ?? 0), 0) / sessions.length)
    : 0

  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  thisWeekStart.setHours(0, 0, 0, 0)
  const sessionsThisWeek = (sessions ?? []).filter(
    s => new Date(s.created_at) >= thisWeekStart
  ).length

  return NextResponse.json({ days, totalSessions, totalDays, avgScore, sessionsThisWeek })
}
