import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  // Fetch last 20 sessions with scores
  const { data: sessions, error } = await supabase
    .from('coach_sessions')
    .select('id, company, role, session_type, avg_score, scores_json, question_count, duration_seconds, created_at, session_title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ sessions: [], chart: [], stats: {} })

  const valid = (sessions || []).filter(s => s.avg_score != null)

  // Build chart data (oldest → newest, max 10 points)
  const chartSessions = [...valid].reverse().slice(-10)
  const chart = chartSessions.map(s => ({
    date: new Date(s.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    overall: Math.round(s.avg_score ?? 0),
    confidence: s.scores_json?.confidence ?? null,
    communication: s.scores_json?.communication ?? null,
    technical: s.scores_json?.technical_knowledge ?? null,
    structure: s.scores_json?.structure ?? null,
    company: s.company,
    role: s.role,
  }))

  // Stats
  const scores = valid.map(s => s.avg_score ?? 0)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const bestScore = scores.length ? Math.round(Math.max(...scores)) : 0
  const latestScore = scores.length ? Math.round(scores[0]) : 0
  const improvement = scores.length >= 2 ? Math.round(scores[0] - scores[scores.length - 1]) : 0

  // Skill averages
  const skillSessions = valid.filter(s => s.scores_json)
  const skillAvg = (key: string) => {
    const vals = skillSessions.map(s => s.scores_json?.[key]).filter(v => v != null)
    return vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0
  }

  return NextResponse.json({
    sessions: sessions || [],
    chart,
    stats: {
      totalSessions: (sessions || []).length,
      avgScore,
      bestScore,
      latestScore,
      improvement,
      skills: {
        confidence: skillAvg('confidence'),
        communication: skillAvg('communication'),
        technical: skillAvg('technical_knowledge'),
        structure: skillAvg('structure'),
        relevance: skillAvg('relevance'),
      },
    },
  })
}
