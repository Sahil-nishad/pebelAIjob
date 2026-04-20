import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

// GET — fetch the current user's profile
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Failed to load profile' }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH — update profile fields
export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const body = await req.json()

  const {
    name, phone, title, linkedin, location,
    target_roles, target_companies,
    job_type, experience_level,
    salary_min, salary_max,
    email_digest, follow_up_days, interview_prep_days,
  } = body

  const updates: Record<string, unknown> = {}

  if ('name'              in body) updates.name               = name               ?? null
  if ('phone'             in body) updates.phone              = phone              ?? null
  if ('title'             in body) updates.title              = title              ?? null
  if ('linkedin'          in body) updates.linkedin           = linkedin           ?? null
  if ('location'          in body) updates.location           = location           ?? null
  if ('target_roles'      in body) updates.target_roles       = target_roles       ?? []
  if ('target_companies'  in body) updates.target_companies   = target_companies   ?? []
  if ('job_type'          in body) updates.job_type           = job_type           ?? null
  if ('experience_level'  in body) updates.experience_level   = experience_level   ?? null
  if ('salary_min'        in body) updates.salary_min         = salary_min         ?? null
  if ('salary_max'        in body) updates.salary_max         = salary_max         ?? null
  if ('email_digest'      in body) updates.email_digest       = email_digest       ?? null
  if ('follow_up_days'    in body) updates.follow_up_days     = follow_up_days     ?? null
  if ('interview_prep_days' in body) updates.interview_prep_days = interview_prep_days ?? null

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
