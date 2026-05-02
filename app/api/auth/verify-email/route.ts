import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import { hashToken } from '@/lib/api-validation'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=InvalidVerificationLink', APP_URL))
  }

  const supabase = getSupabaseServer()
  const hashedToken = hashToken(token)

  const { data: record } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at')
    .eq('token', hashedToken)
    .maybeSingle()

  if (!record) {
    return NextResponse.redirect(new URL('/login?error=InvalidVerificationLink', APP_URL))
  }

  if (new Date(record.expires_at) < new Date()) {
    await supabase.from('email_verification_tokens').delete().eq('token', hashedToken)
    return NextResponse.redirect(new URL('/login?error=VerificationLinkExpired', APP_URL))
  }

  await supabase.from('users').update({ email_verified: true }).eq('id', record.user_id)
  await supabase.from('email_verification_tokens').delete().eq('token', hashedToken)

  return NextResponse.redirect(new URL('/login?verified=1', APP_URL))
}
