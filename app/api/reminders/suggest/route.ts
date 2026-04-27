import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { groq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  void auth

  let body: { company?: unknown; role?: unknown; appliedDate?: unknown }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { company, role, appliedDate } = body

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{
      role: 'system',
      content: `User applied to ${company} for ${role} on ${appliedDate}. Suggest follow-up schedule. Return ONLY valid JSON array: [{"type":"follow_up","days_from_now":5,"title":"Follow up with ${company}","description":"No response yet, send polite check-in"},{"type":"follow_up","days_from_now":10,"title":"Second follow up: ${company}"}]. Max 3 suggestions. Be realistic about hiring timelines.`,
    }],
    temperature: 0.5,
  })

  let suggestions = []
  try {
    suggestions = JSON.parse(response.choices[0].message.content || '[]')
  } catch {
    suggestions = [
      { type: 'follow_up', days_from_now: 5, title: `Follow up with ${company}`, description: 'No response yet' },
      { type: 'follow_up', days_from_now: 10, title: `Second follow up: ${company}`, description: 'Still no response' },
    ]
  }

  return NextResponse.json(suggestions)
}
