import { NextRequest, NextResponse } from 'next/server'
import { groq, MODEL } from '@/lib/groq'
import { requireAuth, unauthorized } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
    return NextResponse.json({ connected: false, reason: 'No API key' }, { status: 503 })
  }

  try {
    await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
    })
    return NextResponse.json({ connected: true, model: MODEL })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[ai/status] Groq status check failed:', msg)
    return NextResponse.json({ connected: false, reason: 'AI service unavailable' }, { status: 503 })
  }
}
