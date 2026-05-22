import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ── Helpers ────────────────────────────────────────────────────────────
function extractJson(text: string): any {
  if (!text) throw new Error('Empty response')
  let cleaned = text.trim()
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  cleaned = cleaned.trim()

  // Try direct parse first
  try { return JSON.parse(cleaned) } catch {}

  // Try to find the first { and last } and parse what's between
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const sliced = cleaned.slice(firstBrace, lastBrace + 1)
    try { return JSON.parse(sliced) } catch {}
  }
  throw new Error('Could not parse JSON from response')
}

// Fallback report shape if AI parsing fails — at least the user sees something
function fallbackReport(transcript: any[], hasBodyLanguage: boolean) {
  const userTurns = transcript.filter((t: any) => t.role === 'You').length
  return {
    overall_score: 65,
    grade: 'B',
    summary: 'We received your interview but had trouble generating a detailed report. Your answers have been saved.',
    scores: {
      confidence: 65, communication: 65, technical_knowledge: 65, structure: 65, relevance: 65,
    },
    body_language: hasBodyLanguage ? { eye_contact: 70, posture: 70, expression: 70, overall: 70, tips: ['Maintain eye contact with camera', 'Sit up straight', 'Smile naturally'] } : null,
    strengths: [`You answered ${userTurns} questions`, 'You completed the interview', 'You used the live coaching format'],
    weaknesses: ['Detailed analysis unavailable for this session', 'Try a longer interview for richer insights', 'Practice answering with the STAR method'],
    filler_words_count: 0,
    avg_answer_length: 'medium',
    star_method_used: false,
    question_breakdown: [],
    improvement_tips: ['Practice common interview questions out loud', 'Use the STAR method (Situation, Task, Action, Result)', 'Record yourself and review for filler words'],
    next_steps: ['Try another mock interview with PebelAI', 'Review the transcript and refine weak answers'],
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const { transcript, company, role, sessionType, screenshots } = await req.json()

    if (!transcript || transcript.length < 4) {
      return NextResponse.json(
        { error: 'Interview too short for a report. Answer at least 2 questions.' },
        { status: 400 }
      )
    }

    // Build the transcript text (cap length to avoid token overflow)
    const transcriptText = transcript
      .map((t: { role: string; text: string }) => `${t.role}: ${t.text}`)
      .join('\n\n')
      .slice(0, 8000) // cap at 8KB ≈ 2000 tokens of context

    // ── Body language analysis (optional, never blocks the report) ────────
    let bodyLanguageData: any = null
    if (screenshots && screenshots.length > 0) {
      try {
        // Cap screenshots to 2 — Groq vision is slow and we want to keep request small
        const capped = screenshots.slice(0, 2)

        const visionPrompt = `You are an expert interview coach analyzing body language from interview screenshots. Analyze these ${capped.length} screenshot(s) and return ONLY valid JSON:
{"eye_contact":85,"posture":70,"expression":75,"overall":77,"tips":["tip 1","tip 2","tip 3"]}

Score 0-100 for: eye_contact (looking at camera), posture (sitting straight), expression (confident/engaged). overall is the average. Provide 2-3 specific improvement tips.`

        const visionCompletion = await groq.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: visionPrompt },
              ...capped.map((img: string) => ({
                type: 'image_url' as const,
                image_url: { url: img },
              })),
            ],
          }],
          temperature: 0.2,
          max_tokens: 400,
        })

        const visionText = visionCompletion.choices[0]?.message?.content?.trim() || ''
        bodyLanguageData = extractJson(visionText)
      } catch (e) {
        console.error('[report] Body language analysis failed:', e)
        // Continue without body language
      }
    }

    const bodyLanguageContext = bodyLanguageData
      ? `\n\nBODY LANGUAGE (from camera analysis):\nEye Contact: ${bodyLanguageData.eye_contact}/100\nPosture: ${bodyLanguageData.posture}/100\nExpression: ${bodyLanguageData.expression}/100`
      : ''

    // ── Main report generation ────────────────────────────────────────────
    const prompt = `You are an expert interview coach. Analyze this mock interview and generate a performance report.

CONTEXT:
- Company: ${company}
- Role: ${role}
- Type: ${sessionType}
${bodyLanguageContext}

TRANSCRIPT:
${transcriptText}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "overall_score": 75,
  "grade": "B",
  "summary": "Two sentence assessment.",
  "scores": {
    "confidence": 75,
    "communication": 75,
    "technical_knowledge": 75,
    "structure": 75,
    "relevance": 75
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "filler_words_count": 5,
  "avg_answer_length": "medium",
  "star_method_used": false,
  "question_breakdown": [
    {"question": "Q text", "score": 80, "feedback": "1 sentence feedback"}
  ],
  "improvement_tips": ["tip 1", "tip 2", "tip 3"],
  "next_steps": ["next step 1", "next step 2"]
}

Scoring criteria:
- confidence: assertive language, no hedging
- communication: clarity, conciseness
- technical_knowledge: accuracy and depth
- structure: STAR method, organized thoughts
- relevance: answers match the questions
Grade: A (80-100), B (70-79), C (60-69), D (50-59), F (<50)`

    let report: any
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 3500, // bumped up — 2000 was getting truncated
        response_format: { type: 'json_object' }, // force valid JSON
      })

      const reportText = completion.choices[0]?.message?.content?.trim() || ''
      report = extractJson(reportText)
    } catch (err) {
      console.error('[report] Main generation failed:', err)
      report = fallbackReport(transcript, !!bodyLanguageData)
    }

    // Attach body language data if we got it
    if (bodyLanguageData) {
      report.body_language = {
        eye_contact: bodyLanguageData.eye_contact ?? 70,
        posture: bodyLanguageData.posture ?? 70,
        expression: bodyLanguageData.expression ?? 70,
        overall: bodyLanguageData.overall ?? 70,
        tips: bodyLanguageData.tips || [],
      }
    } else {
      report.body_language = null
    }

    // Ensure all required fields exist with defaults
    report.overall_score = report.overall_score ?? 65
    report.grade = report.grade || 'B'
    report.summary = report.summary || 'Interview completed.'
    report.scores = report.scores || { confidence: 65, communication: 65, technical_knowledge: 65, structure: 65, relevance: 65 }
    report.strengths = report.strengths || []
    report.weaknesses = report.weaknesses || []
    report.filler_words_count = report.filler_words_count ?? 0
    report.avg_answer_length = report.avg_answer_length || 'medium'
    report.star_method_used = report.star_method_used ?? false
    report.question_breakdown = report.question_breakdown || []
    report.improvement_tips = report.improvement_tips || []
    report.next_steps = report.next_steps || []

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('[report] Top-level error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate report. Try again.' },
      { status: 500 }
    )
  }
}
