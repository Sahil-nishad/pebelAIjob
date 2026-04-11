import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const { data: resetToken } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used')
    .eq('token', token)
    .maybeSingle()

  if (!resetToken) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  if (resetToken.used) {
    return NextResponse.json({ error: 'This reset link has already been used.' }, { status: 400 })
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This reset link has expired. Please request a new one.' }, { status: 400 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', resetToken.user_id)

  await supabase
    .from('password_reset_tokens')
    .update({ used: true })
    .eq('token', token)

  return NextResponse.json({ ok: true })
}
