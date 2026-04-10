import { NextResponse } from 'next/server'
import { groq, MODEL } from '@/lib/groq'

export async function GET() {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
    return NextResponse.json({ connected: false, reason: 'No API key' })
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
    return NextResponse.json({ connected: false, reason: msg })
  }
}
