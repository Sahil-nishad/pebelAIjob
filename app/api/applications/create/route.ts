import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { sendApplicationConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const body = await req.json()

  // Make sure the parent profile row exists before creating the child record.
  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('firebase_uid', user.firebaseUid)
    .maybeSingle()

  if (existingUserError) {
    return new NextResponse(JSON.stringify({ error: existingUserError.message }), { status: 400 })
  }

  const { error: userError } = await supabase.from('users').upsert(
    {
      id: existingUser?.id || user.id,
      firebase_uid: user.firebaseUid,
      email: user.email ?? null,
    },
    { onConflict: 'id' }
  )
  if (userError) {
    const msg = userError.message.includes('users_id_fkey')
      ? 'Your Supabase schema still links public.users.id to auth.users.id. Run the Firebase compatibility migration in supabase/migrations/20260410153000_firebase_auth_compat.sql.'
      : userError.message
    return new NextResponse(JSON.stringify({ error: msg }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...body, user_id: existingUser?.id || user.id })
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error: error.message }), { status: 400 })

  await supabase.from('activity_log').insert({
    user_id: user.id,
    application_id: data.id,
    event_type: 'applied',
    event_data: { company: body.company_name, role: body.role_title },
  })

  if (user.email) {
    const { data: profile } = await supabase
      .from('users')
      .select('email_digest')
      .eq('id', user.id)
      .single()

    if ((profile?.email_digest ?? 'daily') !== 'never') {
      sendApplicationConfirmationEmail({
        to: user.email,
        application: data,
      })?.catch((err) => {
        console.error('[applications/create] Email send failed:', err)
      })
    }
  }

  return new NextResponse(JSON.stringify(data), { status: 200 })
}
