import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { chatCompletion } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { resume_id } = await req.json()
  if (!resume_id) return NextResponse.json({ error: 'resume_id required' }, { status: 400 })

  // Fetch resume from Supabase (via careers backend or direct)
  const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'
  const INTERNAL_KEY = process.env.CAREERS_INTERNAL_API_KEY || 'change-me'

  const res = await fetch(`${CAREERS_API_URL}/api/v1/resumes/${resume_id}`, {
    headers: {
      'x-pebel-user-id': user.id,
      'x-pebel-user-email': user.email,
      'x-internal-service-key': INTERNAL_KEY,
    },
  })

  if (!res.ok) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  const resume = await res.json()

  const rawText = resume.raw_text || ''
  if (!rawText || rawText.length < 100) {
    return NextResponse.json({ error: 'Resume text too short to analyze' }, { status: 400 })
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) resume optimizer. Analyze this resume and provide specific, actionable line-by-line improvements.

RESUME TEXT:
${rawText.slice(0, 6000)}

Return ONLY valid JSON with this exact structure:
{
  "ats_score": 72,
  "grade": "B",
  "summary": "Your resume is decent but missing quantifiable achievements and strong action verbs.",
  "critical_fixes": [
    {
      "type": "weak_verb",
      "original": "Responsible for managing a team of 5 engineers",
      "improved": "Led and mentored a team of 5 engineers, delivering 3 major features on schedule",
      "reason": "Replace passive 'responsible for' with strong action verb + add measurable outcome"
    }
  ],
  "quick_wins": [
    "Add LinkedIn profile URL to contact section",
    "Include a 2-3 line professional summary at the top",
    "Add your GitHub profile link if you have one"
  ],
  "missing_sections": ["Professional Summary", "LinkedIn URL"],
  "keyword_gaps": ["quantifiable metrics", "leadership outcomes", "technical stack versions"],
  "formatting_issues": ["Use consistent date format (MM/YYYY)", "Align bullet points consistently"],
  "score_breakdown": {
    "contact_info": 85,
    "professional_summary": 40,
    "work_experience": 70,
    "skills_section": 80,
    "education": 90,
    "formatting": 75,
    "keywords": 60,
    "action_verbs": 55
  }
}

Rules for critical_fixes:
- Provide 4-6 specific fixes with exact original text and improved version
- Focus on: weak verbs → strong verbs, vague statements → quantified achievements, passive → active voice
- Each fix must show the EXACT original text from the resume and a specific improved version

Return ONLY valid JSON. No markdown.`

  try {
    const raw = await chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.3, maxTokens: 2000 })
    let cleaned = raw.trim()
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7)
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
    const result = JSON.parse(cleaned.trim())
    return NextResponse.json(result)
  } catch (err) {
    console.error('[ATS optimize] Failed:', err)
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}
