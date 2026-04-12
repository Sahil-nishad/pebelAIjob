import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseServer } from '@/lib/supabase'
import { Resend } from 'resend'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'PebelAI <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const supabase = getSupabaseServer()

  const { data: user } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ ok: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString()

  await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at,
  })

  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  const firstName = user.name?.split(' ')[0] || 'there'

  await resend.emails.send({
    from: FROM_EMAIL,
    to: user.email,
    subject: 'Reset your PebelAI password',
    text: `Hi ${firstName},\n\nWe received a request to reset your password. Click the link below to set a new one (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n— The PebelAI Team`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;background:linear-gradient(135deg,#059669,#10b981);border-radius:8px;display:inline-block;vertical-align:middle;"></div>
                <span style="font-size:20px;font-weight:700;color:#0f172a;vertical-align:middle;margin-left:8px;">PebelAI</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

              <!-- Icon -->
              <div style="text-align:center;margin-bottom:24px;">
                <div style="width:56px;height:56px;background:#ecfdf5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin:0 auto;">
                  <span style="font-size:24px;">🔑</span>
                </div>
              </div>

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;text-align:center;">Reset your password</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;text-align:center;">
                Hi ${firstName}, we received a request to reset your password.<br/>This link expires in <strong style="color:#0f172a;">1 hour</strong>.
              </p>

              <!-- Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:-0.01em;">
                  Reset Password →
                </a>
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid #f1f5f9;margin:0 0 24px;"></div>

              <!-- Link fallback -->
              <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;text-align:center;">Or copy this link into your browser:</p>
              <p style="margin:0 0 24px;font-size:11px;color:#94a3b8;text-align:center;word-break:break-all;">
                <a href="${resetUrl}" style="color:#10b981;text-decoration:none;">${resetUrl}</a>
              </p>

              <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
                Didn't request this? You can safely ignore this email — your account is secure.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                © ${new Date().getFullYear()} PebelAI · Built for job seekers
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })

  return NextResponse.json({ ok: true })
}
