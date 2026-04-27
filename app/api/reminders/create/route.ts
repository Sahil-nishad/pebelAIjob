import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'
import type { Application } from '@/types'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { data: reminder, error } = await supabase
    .from('reminders')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Check user notification preference
  const { data: profile } = await supabase
    .from('users')
    .select('email_digest')
    .eq('id', user.id)
    .single()

  const emailDigest = profile?.email_digest ?? 'daily'

  // Send immediate confirmation email (skip if user has opted out)
  if (emailDigest !== 'never' && user.email) {
    let application: Application | undefined

    if (body.application_id) {
      const { data: app } = await supabase
        .from('applications')
        .select('*')
        .eq('id', body.application_id)
        .single()
      application = app ?? undefined
    }

    // Fire-and-forget — don't fail the request if email fails
    sendReminderEmail({
      to: user.email,
      reminder,
      application,
    })?.catch((err) => {
      console.error('[reminders/create] Email send failed:', err)
    })
  }

  return NextResponse.json(reminder)
}
