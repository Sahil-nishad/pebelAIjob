import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseServer } from '@/lib/supabase'
import nodemailer from 'nodemailer'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
  const expires_at = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour

  await supabase.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at,
  })

  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transport.sendMail({
    from: process.env.SMTP_FROM_EMAIL || `PebelAI <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: 'Reset your PebelAI password',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
              <tr>
                <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
                  <span style="color:#fff;font-size:22px;font-weight:700;">PebelAI</span>
                </td>
              </tr>
              <tr>
                <td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;">
                  <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0f172a;">Reset your password</h1>
                  <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                    Hi ${user.name || 'there'},<br/>We received a request to reset your password.
                    Click the button below to set a new one. This link expires in <strong>1 hour</strong>.
                  </p>
                  <a href="${resetUrl}"
                     style="display:inline-block;background:#10b981;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
                    Reset Password →
                  </a>
                  <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  })

  return NextResponse.json({ ok: true })
}
