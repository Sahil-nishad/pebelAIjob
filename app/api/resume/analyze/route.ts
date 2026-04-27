import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'
import { groq, MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()
  const { user, supabase } = auth

  let body: { resumeText?: string; jobDescription?: string; applicationId?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }) }
  const { resumeText, jobDescription, applicationId } = body

  if (!resumeText || !jobDescription) {
    return NextResponse.json({ error: 'resumeText and jobDescription are required.' }, { status: 400 })
  }

  if (resumeText.length > 50_000 || jobDescription.length > 25_000) {
    return NextResponse.json({ error: 'Resume or job description is too large.' }, { status: 413 })
  }

  if (applicationId) {
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select('id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 })
    }
  }

  let response
  try {
    response = await groq.chat.completions.create({
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
  } catch (err) {
    console.error('[resume/analyze] Groq API error:', err)
    return NextResponse.json({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }, { status: 503 })
  }

  let analysis
  try {
    analysis = JSON.parse(response.choices[0].message.content || '{}')
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response.' }, { status: 500 })
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
