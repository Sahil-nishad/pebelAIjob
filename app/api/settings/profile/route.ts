import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth
  const body = await req.json()
  const { name, phone, title, linkedin, location } = body

  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      firebase_uid: user.firebaseUid,
      email: user.email,
      name: name || null,
      phone: phone || null,
      title: title || null,
      linkedin: linkedin || null,
      location: location || null,
    })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}
