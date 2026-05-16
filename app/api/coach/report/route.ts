import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const { transcript, company, role, sessionType } = await req.json()

    if (!transcript || transcript.length < 4) {
      return NextResponse.json(
        { error: 'Interview too short for a report. Answer at least 2 questions.' },
        { status: 400 }
      )
    }

    // Build the transcript text
    const transcriptText = transcript
      .map((t: { role: string; text: string }) => `${t.role}: ${t.text}`)
      .join('\n\n')

    const prompt = `You are an expert interview coach. Analyze this mock interview transcript and generate a detailed performance report.

INTERVIEW CONTEXT:
- Company: ${company}
- Role: ${role}
- Type: ${sessionType}

TRANSCRIPT:
${transcriptText}

Generate a JSON report with this EXACT structure:
{
  "overall_score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2 sentence overall assessment>",
  "scores": {
    "confidence": <number 0-100>,
    "communication": <number 0-100>,
    "technical_knowledge": <number 0-100>,
    "structure": <number 0-100>,
    "relevance": <number 0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "filler_words_count": <number>,
  "avg_answer_length": "<short/medium/long>",
  "star_method_used": <true/false>,
  "question_breakdown": [
    {
      "question": "<the question asked>",
      "score": <number 0-100>,
      "feedback": "<1 sentence specific feedback>"
    }
  ],
  "improvement_tips": ["<actionable tip 1>", "<actionable tip 2>", "<actionable tip 3>"],
  "next_steps": ["<what to practice next 1>", "<what to practice next 2>"]
}

Score criteria:
- confidence: Based on assertive language, lack of hedging, directness
- communication: Clarity, conciseness, grammar, articulation
- technical_knowledge: Accuracy and depth of technical answers
- structure: Use of frameworks (STAR, etc.), organized thoughts
- relevance: How well answers relate to the question asked

Return ONLY valid JSON. No markdown, no explanation.`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    })

    let reportText = completion.choices[0]?.message?.content?.trim() || ''

    // Clean markdown if present
    if (reportText.startsWith('```json')) reportText = reportText.slice(7)
    if (reportText.startsWith('```')) reportText = reportText.slice(3)
    if (reportText.endsWith('```')) reportText = reportText.slice(0, -3)

    const report = JSON.parse(reportText.trim())

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report. Try again.' },
      { status: 500 }
    )
  }
}
