import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { chatCompletion, hasGroqKey, hasGeminiKey } from '@/lib/groq'
import { getCoachSession, updateCoachSession } from '@/lib/coach-session-store'
import { isMissingTableError } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let reqBody: { sessionId?: string; message?: unknown }
  try { reqBody = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { sessionId = '', message: rawMessage } = reqBody
  const message = String(rawMessage ?? '').trim().slice(0, 2000)

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

  const allMessages = [...(activeSession.messages || []), { role: 'user', content: message }]
  const systemMsg = allMessages.find(m => m.role === 'system')
  const chatHistory = allMessages.filter(m => m.role !== 'system').slice(-12)

  // Voice-optimized system prompt: strict interviewer behavior
  const voiceSystemPrompt = `You are a professional AI interviewer conducting a real mock interview. You are NOT a general chatbot.

ABSOLUTE RULES — NEVER BREAK THESE:
1. You ONLY discuss the interview. You are an interviewer, not a friend or assistant.
2. If the user asks about ANYTHING unrelated to the interview (politics, your platform, personal questions, general knowledge, other topics), respond ONLY with: "Let's stay focused on the interview. Here's your next question:" and then ask the next interview question.
3. NEVER reveal what AI model you are, what platform you run on, or any technical details about yourself.
4. NEVER answer general knowledge questions (presidents, capitals, facts, etc.)
5. NEVER break character. You are an interviewer at ${activeSession.company || 'this company'} for the ${activeSession.role || 'this'} role.
6. Keep responses to 2-3 SHORT sentences. This is spoken conversation.
7. NEVER use bullet points, dashes, or formatting. Speak naturally.
8. After the user answers, give brief feedback then ask the next question.
9. If the user tries to derail the conversation, firmly redirect: "I appreciate the curiosity, but let's get back to the interview."

You are interviewing for: ${activeSession.company || 'a company'}, ${activeSession.role || 'a role'}, ${activeSession.session_type || 'general'} interview.

Example of handling off-topic:
User: "What's the capital of France?"
You: "Let's stay focused on the interview. Here's your next question: Tell me about a challenging project you worked on recently."

Example of handling platform questions:
User: "What AI model are you?"
You: "I'm your interviewer today. Let's continue — can you walk me through your approach to solving complex problems?"

Example good interview response: "That's a solid answer — you clearly showed impact. Let me ask you something tougher. Tell me about a time you disagreed with your manager."`;

  const messages_for_llm = systemMsg
    ? [{ role: 'system' as const, content: voiceSystemPrompt }, ...chatHistory]
    : [{ role: 'system' as const, content: voiceSystemPrompt }, ...chatHistory]

  let assistantMessage = "Sorry, I'm having a moment. Could you repeat that?"

  try {
    if (!hasGroqKey() && !hasGeminiKey()) throw new Error('AI service is not configured.')
    assistantMessage = await chatCompletion(
      messages_for_llm,
      { temperature: 0.5, maxTokens: 150 }
    ) || assistantMessage
  } catch {
    // Keep fallback
  }

  const updatedMessages = [...allMessages, { role: 'assistant', content: assistantMessage }]

  if (session) {
    await supabase
      .from('coach_sessions')
      .update({ messages: updatedMessages, question_count: (session.question_count || 0) + 1 })
      .eq('id', sessionId)
  } else {
    updateCoachSession(sessionId, user.id, {
      messages: updatedMessages,
      question_count: (activeSession.question_count || 0) + 1,
    })
  }

  return NextResponse.json({ message: assistantMessage })
}
