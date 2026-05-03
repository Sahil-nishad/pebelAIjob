import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth

  const since = new Date()
  since.setDate(since.getDate() - 140) // 20 weeks

  const { data: logs, error } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('event_type', 'applied')
    .gte('created_at', since.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts = new Map<string, number>()
  for (const log of logs ?? []) {
    const ds = toDateStr(new Date(log.created_at))
    counts.set(ds, (counts.get(ds) ?? 0) + 1)
  }

  const days = Array.from(counts.entries()).map(([date, count]) => ({ date, count }))
  const total = (logs ?? []).length

  return NextResponse.json({ days, total })
}
