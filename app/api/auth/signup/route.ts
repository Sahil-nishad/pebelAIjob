import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseServer } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; password?: string; job_type?: string; experience_level?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { name, email, password, job_type, experience_level } = body

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from('users').insert({
    email: email.toLowerCase().trim(),
    name,
    password_hash,
    job_type: job_type || null,
    experience_level: experience_level || null,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
