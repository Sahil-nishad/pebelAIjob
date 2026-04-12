import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// GET /api/email/test-smtp?to=youremail@gmail.com
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get('to')
  if (!to) {
    return NextResponse.json({ error: 'Pass ?to=youremail@gmail.com' }, { status: 400 })
  }

  const smtpUser = process.env.SMTP_USER?.trim()
  const smtpPass = process.env.SMTP_PASS?.trim()
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT || '587')

  if (!smtpUser || !smtpPass) {
    return NextResponse.json({
      ok: false,
      error: 'SMTP_USER or SMTP_PASS is missing',
      env: {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_USER: smtpUser ?? 'MISSING',
        SMTP_PASS: smtpPass ? '***set***' : 'MISSING',
      },
    })
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  })

  try {
    await transporter.verify()
  } catch (err) {
    return NextResponse.json({
      ok: false,
      stage: 'verify (SMTP connection/auth failed)',
      error: err instanceof Error ? err.message : String(err),
      env: { SMTP_HOST: smtpHost, SMTP_PORT: smtpPort, SMTP_USER: smtpUser },
    })
  }

  try {
    const info = await transporter.sendMail({
      from: `"PebelAI Test" <${smtpUser}>`,
      to,
      subject: 'PebelAI SMTP test',
      text: 'If you see this, SMTP is working correctly.',
    })
    return NextResponse.json({
      ok: true,
      messageId: info.messageId,
      response: info.response,
      env: { SMTP_HOST: smtpHost, SMTP_PORT: smtpPort, SMTP_USER: smtpUser },
    })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      stage: 'sendMail',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
