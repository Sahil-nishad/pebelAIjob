import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSupabaseServer } from '@/lib/supabase'
import { getClientIp, rateLimit, readJsonObject } from '@/lib/api-validation'

const jobTypes = new Set(['Full-time', 'Part-time', 'Internship', 'Freelance', 'Any'])
const experienceLevels = new Set(['Entry', 'Mid', 'Senior', 'Executive'])

export async function POST(req: NextRequest) {
  const parsed = await readJsonObject(req)
  if (parsed.error) return parsed.error

  const name = typeof parsed.data.name === 'string' ? parsed.data.name.trim() : ''
  const email = typeof parsed.data.email === 'string' ? parsed.data.email.toLowerCase().trim() : ''
  const password = typeof parsed.data.password === 'string' ? parsed.data.password : ''
  const job_type = typeof parsed.data.job_type === 'string' ? parsed.data.job_type : ''
  const experience_level = typeof parsed.data.experience_level === 'string' ? parsed.data.experience_level : ''

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (job_type && !jobTypes.has(job_type)) {
    return NextResponse.json({ error: 'Invalid job type.' }, { status: 400 })
  }

  if (experience_level && !experienceLevels.has(experience_level)) {
    return NextResponse.json({ error: 'Invalid experience level.' }, { status: 400 })
  }

  if (!rateLimit(`signup:${getClientIp(req)}:${email}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many signup attempts. Please try again later.' }, { status: 429 })
  }

  const supabase = getSupabaseServer()

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)

  const { error } = await supabase.from('users').insert({
    email,
    name,
    password_hash,
    job_type: job_type || null,
    experience_level: experience_level || null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
