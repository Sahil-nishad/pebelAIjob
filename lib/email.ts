import { Resend } from 'resend'
import type { Reminder, Application } from '@/types'
import { generateGoogleCalendarUrl, generateICSContent } from './calendar'

const RESEND_KEY = process.env.RESEND_API_KEY
const isResendConfigured = RESEND_KEY && RESEND_KEY !== 'your_resend_api_key'
const resend = isResendConfigured ? new Resend(RESEND_KEY) : null
const DEFAULT_FROM = 'PebelAI <onboarding@resend.dev>'
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'me.com',
  'aol.com',
])
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function ensureResend() {
  if (!resend) {
    console.warn('[email] Resend not configured - skipping email send')
    return null
  }
  return resend
}

function getResendFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim()
  if (!configured) return DEFAULT_FROM

  const match = configured.match(/<([^>]+)>/)
  const address = (match ? match[1] : configured).trim().toLowerCase()
  const domain = address.split('@')[1]

  if (domain && FREE_EMAIL_DOMAINS.has(domain)) {
    console.warn(`[email] RESEND_FROM_EMAIL uses a consumer mailbox (${domain}); falling back to ${DEFAULT_FROM}`)
    return DEFAULT_FROM
  }

  return configured
}

// ─── Shared HTML Helpers ───────────────────────────────────────────────────

function baseLayout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;font-size:20px;">💼</div>
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">PebelAI</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:40px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              You're receiving this because you have email reminders enabled in PebelAI.<br/>
              <a href="${APP_URL}/settings" style="color:#10b981;text-decoration:none;">Manage notification settings</a>
              &nbsp;·&nbsp;
              <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">Open PebelAI</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function reminderTypeLabel(type: string) {
  const map: Record<string, string> = {
    follow_up: 'Follow-up',
    thank_you: 'Thank You Note',
    check_in: 'Check-in',
    deadline: 'Deadline',
    interview_prep: 'Interview Prep',
  }
  return map[type] || type
}

function reminderTypeEmoji(type: string) {
  const map: Record<string, string> = {
    follow_up: '📬',
    thank_you: '🙏',
    check_in: '📡',
    deadline: '⏰',
    interview_prep: '🎯',
  }
  return map[type] || '🔔'
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    applied: '#3b82f6',
    phone_screen: '#8b5cf6',
    interviewing: '#f59e0b',
    offer: '#10b981',
    rejected: '#ef4444',
    ghosted: '#94a3b8',
  }
  const labels: Record<string, string> = {
    applied: 'Applied',
    phone_screen: 'Phone Screen',
    interviewing: 'Interviewing',
    offer: 'Offer',
    rejected: 'Rejected',
    ghosted: 'Ghosted',
  }
  const color = colors[status] || '#94a3b8'
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;color:#fff;background:${color};">${labels[status] || status}</span>`
}

// ─── Email: Reminder Due ───────────────────────────────────────────────────

export async function sendReminderEmail({
  to,
  reminder,
  application,
}: {
  to: string
  reminder: Reminder
  application?: Application
}) {
  const emoji = reminderTypeEmoji(reminder.reminder_type)
  const typeLabel = reminderTypeLabel(reminder.reminder_type)
  const dueDate = new Date(reminder.due_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const calLink = application ? generateGoogleCalendarUrl({
    title: `${reminder.title} — ${application.company_name}`,
    description: reminder.description || `PebelAI reminder for your ${application.role_title} application at ${application.company_name}`,
    start: new Date(reminder.due_date),
    durationMinutes: 30,
  }) : null

  const icsContent = application ? generateICSContent({
    title: `${reminder.title} — ${application.company_name}`,
    description: reminder.description || '',
    start: new Date(reminder.due_date),
    durationMinutes: 30,
  }) : null

  const body = `
    <!-- Title -->
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
      ${emoji} ${typeLabel} Reminder
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:14px;">Due: <strong>${dueDate}</strong></p>

    <!-- Reminder card -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #10b981;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#0f172a;">${reminder.title}</p>
      ${reminder.description ? `<p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">${reminder.description}</p>` : ''}
    </div>

    ${application ? `
    <!-- Application context -->
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">Application</p>
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0f172a;">${application.company_name}</p>
          <p style="margin:0;font-size:13px;color:#64748b;">${application.role_title}</p>
        </div>
        ${statusBadge(application.status)}
      </div>
    </div>
    ` : ''}

    <!-- CTAs -->
    <div style="margin-bottom:28px;">
      <a href="${APP_URL}/applications${application ? `/${application.id}` : ''}"
         style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-right:12px;">
        View in PebelAI →
      </a>
      ${calLink ? `
      <a href="${calLink}" target="_blank"
         style="display:inline-block;background:#f1f5f9;color:#475569;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;text-decoration:none;border:1px solid #e2e8f0;">
        📅 Add to Google Calendar
      </a>
      ` : ''}
    </div>

    ${icsContent ? `
    <!-- ICS note -->
    <p style="margin:0;font-size:12px;color:#94a3b8;">
      Using Apple Calendar or Outlook?
      <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}"
         download="reminder.ics" style="color:#10b981;text-decoration:none;">Download .ics file</a>
    </p>
    ` : ''}
  `

  const r = ensureResend()
  if (!r) return null
  return r.emails.send({
    from: getResendFromAddress(),
    to,
    subject: `${emoji} Reminder: ${reminder.title}${application ? ` — ${application.company_name}` : ''}`,
    html: baseLayout(`Reminder: ${reminder.title}`, body),
  })
}

// ─── Email: Interview Scheduled ────────────────────────────────────────────

export async function sendInterviewScheduledEmail({
  to,
  application,
  interviewDate,
  interviewType,
  interviewFormat,
  interviewer,
}: {
  to: string
  application: Application
  interviewDate: Date
  interviewType: string
  interviewFormat: string
  interviewer?: string
}) {
  const typeLabels: Record<string, string> = {
    phone_screen: 'Phone Screen',
    technical: 'Technical Interview',
    system_design: 'System Design',
    behavioral: 'Behavioral Interview',
    case_study: 'Case Study',
    final: 'Final Round',
  }
  const formatLabels: Record<string, string> = {
    video: 'Video Call',
    phone: 'Phone Call',
    onsite: 'On-site',
    take_home: 'Take-home',
  }

  const typeLabel = typeLabels[interviewType] || interviewType
  const formatLabel = formatLabels[interviewFormat] || interviewFormat

  const dateStr = interviewDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const timeStr = interviewDate.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  })

  const calLink = generateGoogleCalendarUrl({
    title: `${typeLabel} — ${application.company_name} (${application.role_title})`,
    description: `Interview at ${application.company_name} for the ${application.role_title} role.${interviewer ? `\nInterviewer: ${interviewer}` : ''}\n\nPrepare with PebelAI AI Coach: ${APP_URL}/coach`,
    start: interviewDate,
    durationMinutes: 60,
  })

  const icsContent = generateICSContent({
    title: `${typeLabel} — ${application.company_name}`,
    description: `${application.role_title} interview at ${application.company_name}`,
    start: interviewDate,
    durationMinutes: 60,
  })

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
      🎯 Interview Scheduled!
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:14px;">You have an upcoming interview — good luck! 🤞</p>

    <!-- Interview card -->
    <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1px solid #a7f3d0;border-radius:14px;padding:24px;margin-bottom:24px;">
      <div style="margin-bottom:16px;">
        <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#064e3b;">${application.company_name}</p>
        <p style="margin:0;font-size:14px;color:#065f46;">${application.role_title}</p>
      </div>
      <div style="display:grid;gap:10px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:16px;">📋</span>
          <span style="font-size:14px;color:#047857;font-weight:500;">${typeLabel}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:16px;">📅</span>
          <span style="font-size:14px;color:#047857;font-weight:500;">${dateStr} at ${timeStr}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:16px;">💻</span>
          <span style="font-size:14px;color:#047857;font-weight:500;">${formatLabel}</span>
        </div>
        ${interviewer ? `
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="font-size:16px;">👤</span>
          <span style="font-size:14px;color:#047857;font-weight:500;">${interviewer}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Prep tip -->
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#92400e;">💡 Pro tip</p>
      <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
        Use the PebelAI AI Coach to practice common ${typeLabel.toLowerCase()} questions before your interview.
      </p>
    </div>

    <!-- CTAs -->
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
      <a href="${APP_URL}/coach"
         style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">
        🤖 Practice with AI Coach
      </a>
      <a href="${calLink}" target="_blank"
         style="display:inline-block;background:#f1f5f9;color:#475569;font-size:14px;font-weight:600;padding:12px 20px;border-radius:10px;text-decoration:none;border:1px solid #e2e8f0;">
        📅 Add to Google Calendar
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#94a3b8;">
      Apple Calendar / Outlook:
      <a href="data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}"
         download="interview.ics" style="color:#10b981;text-decoration:none;">Download .ics file</a>
    </p>
  `

  const r = ensureResend()
  if (!r) return null
  return r.emails.send({
    from: getResendFromAddress(),
    to,
    subject: `🎯 Interview scheduled — ${application.company_name} (${dateStr})`,
    html: baseLayout('Interview Scheduled', body),
  })
}

// ─── Email: Application Confirmation ──────────────────────────────────────

export async function sendApplicationConfirmationEmail({
  to,
  application,
}: {
  to: string
  application: Application
}) {
  const appliedDate = new Date(application.applied_date).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
      ✅ Application Tracked!
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:14px;">PebelAI is now tracking your application. We'll remind you when it's time to follow up.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;">New Application</p>
      <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#0f172a;">${application.company_name}</p>
      <p style="margin:0 0 16px;font-size:14px;color:#64748b;">${application.role_title}</p>
      <div style="display:flex;gap:8px;align-items:center;">
        <span style="font-size:13px;color:#94a3b8;">Applied:</span>
        <span style="font-size:13px;font-weight:500;color:#475569;">${appliedDate}</span>
      </div>
      ${application.location ? `
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
        <span style="font-size:13px;color:#94a3b8;">Location:</span>
        <span style="font-size:13px;font-weight:500;color:#475569;">${application.location}</span>
      </div>
      ` : ''}
    </div>

    <a href="${APP_URL}/applications/${application.id}"
       style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
      View Application →
    </a>

    <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
      We'll send you a follow-up reminder in a few days. You can also set custom reminders from the application detail page.
    </p>
  `

  const r = ensureResend()
  if (!r) return null
  return r.emails.send({
    from: getResendFromAddress(),
    to,
    subject: `✅ Application tracked — ${application.company_name} (${application.role_title})`,
    html: baseLayout('Application Tracked', body),
  })
}

// ─── Email: Daily Digest ───────────────────────────────────────────────────

export async function sendDailyDigestEmail({
  to,
  reminders,
  userName,
}: {
  to: string
  reminders: (Reminder & { application?: Application })[]
  userName?: string
}) {
  if (reminders.length === 0) return

  const greeting = userName ? `Hi ${userName}` : 'Hi there'
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const reminderRows = reminders.map((r) => {
    const emoji = reminderTypeEmoji(r.reminder_type)
    const dueDate = new Date(r.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
          <div style="display:flex;align-items:flex-start;gap:12px;">
            <span style="font-size:20px;line-height:1;">${emoji}</span>
            <div style="flex:1;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#0f172a;">${r.title}</p>
              ${r.application ? `<p style="margin:0 0 2px;font-size:12px;color:#64748b;">${r.application.company_name} · ${r.application.role_title}</p>` : ''}
              <p style="margin:0;font-size:12px;color:#94a3b8;">Due ${dueDate}</p>
            </div>
            <a href="${APP_URL}/applications${r.application ? `/${r.application.id}` : ''}"
               style="font-size:12px;color:#10b981;text-decoration:none;font-weight:500;white-space:nowrap;">View →</a>
          </div>
        </td>
      </tr>
    `
  }).join('')

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
      📋 Your Daily Digest
    </h1>
    <p style="margin:0 0 28px;color:#64748b;font-size:14px;">${greeting} — here's what needs your attention on ${today}.</p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 20px;margin-bottom:28px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${reminderRows}
      </table>
    </div>

    <a href="${APP_URL}/reminders"
       style="display:inline-block;background:#10b981;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;text-decoration:none;">
      View All Reminders →
    </a>
  `

  const r = ensureResend()
  if (!r) return null
  return r.emails.send({
    from: getResendFromAddress(),
    to,
    subject: `📋 PebelAI Digest — ${reminders.length} reminder${reminders.length > 1 ? 's' : ''} for ${today}`,
    html: baseLayout('Daily Digest', body),
  })
}
