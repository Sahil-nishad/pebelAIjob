import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { groq, MODEL } from '@/lib/groq'
import { getCoachSession, updateCoachSession } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { sessionId, message: rawMessage } = await req.json()
  const message = String(rawMessage ?? '').slice(0, 4000)

  const { data: session, error } = await supabase
    .from('coach_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  const fallbackSession = getCoachSession(sessionId, user.id)
  const activeSession = session || fallbackSession
  if (!activeSession) {
    if (error && !isMissingTableError(error, 'coach_sessions')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const messages = [...(activeSession.messages || []), { role: 'user', content: message }]

  const systemPrompt = `You are an expert interview coach. Reply in concise bullet points only.

Rules:
- Use this format whenever possible:
  - Best answer: ...
  - What worked: ...
  - Improve: ...
  - Next step: ...
- Keep answers practical, specific, and tailored to the user's company, role, interview type, and answer.
- Do not write long paragraphs.
- If the user asks for a sample response, include a short "Best answer" section written as bullets.
- Rewrite weak answers into stronger sample answers when needed.
- Be encouraging but direct.`

  let assistantMessage = `- Best answer: I am having trouble generating a response right now.
- What you can do: Please try again in a moment.
- Next step: If this keeps happening, send me the exact prompt and I will tighten the coach behavior.`

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
      ],
      temperature: 0.35,
    })
    assistantMessage = response.choices[0].message.content || assistantMessage
  } catch {
    // Fall back to a helpful message instead of failing the session.
  }

  const updatedMessages = [...messages, { role: 'assistant', content: assistantMessage }]

  if (session) {
    await supabase
      .from('coach_sessions')
      .update({
        messages: updatedMessages,
        question_count: (session.question_count || 0) + 1,
      })
      .eq('id', sessionId)
  } else {
    updateCoachSession(sessionId, user.id, {
      messages: updatedMessages,
      question_count: (activeSession.question_count || 0) + 1,
    })
  }

  return NextResponse.json({ message: assistantMessage })
}
