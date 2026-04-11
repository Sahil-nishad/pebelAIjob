import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { groq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  const { resumeText, jobDescription, applicationId } = await req.json()

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{
      role: 'system',
      content: `Analyze this resume against the job description. Return ONLY valid JSON (no markdown):
{
  "score": 73,
  "summary": "one sentence verdict",
  "keywords_found": ["python","react"],
  "keywords_missing": ["kubernetes","go"],
  "skills_strong": ["Leadership","React"],
  "skills_partial": [{"skill":"System Design","reason":"mentioned but not detailed"}],
  "skills_missing": ["Kubernetes","Go"],
  "suggestions": ["Add kubernetes to skills section","Quantify impact at Acme Corp"],
  "ats_issues": ["Tables detected","Missing keywords in header"],
  "bullet_rewrites": [
    {"original":"Worked on payments","improved":"Engineered payment system processing $2M/month"}
  ]
}

Resume: ${resumeText}
Job Description: ${jobDescription}`,
    }],
    temperature: 0.3,
  })

  let analysis
  try {
    analysis = JSON.parse(response.choices[0].message.content || '{}')
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('resume_analyses')
    .insert({
      user_id: user.id,
      application_id: applicationId || null,
      resume_text: resumeText,
      job_description: jobDescription,
      analysis,
      score: analysis.score,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ...data, analysis })
}
