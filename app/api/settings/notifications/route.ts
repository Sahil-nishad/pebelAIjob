import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const body = await req.json()
  const { email_digest, follow_up_days, interview_prep_days } = body

  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      email_digest: email_digest ?? 'daily',
      follow_up_days: follow_up_days ?? 7,
      interview_prep_days: interview_prep_days ?? 2,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
