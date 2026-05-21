import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

/**
 * Smart Apply — Option A: Direct API submission for Greenhouse/Lever jobs
 * Option B: Returns user info for clipboard-assisted apply
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  const { user, supabase } = auth

  try {
    const { job_url, job_title, company, resume_id } = await req.json()

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single()

    // Get resume data
    const { data: resume } = await supabase
      .from('resumes')
      .select('parsed_name, extracted_skills, extracted_experience, file_url, raw_text')
      .eq('id', resume_id)
      .eq('user_id', user.id)
      .single()

    const userName = profile?.name || resume?.parsed_name || 'Candidate'
    const userEmail = profile?.email || user.email || ''

    // Parse skills
    let skills: string[] = []
    try {
      const s = resume?.extracted_skills
      skills = typeof s === 'string' ? JSON.parse(s) : (Array.isArray(s) ? s : [])
    } catch {}

    // ── Option A: Greenhouse Direct API ──────────────────────────
    if (job_url?.includes('greenhouse.io')) {
      try {
        // Extract job ID from URL
        // Format: https://boards.greenhouse.io/company/jobs/12345
        const match = job_url.match(/\/jobs\/(\d+)/)
        const companyMatch = job_url.match(/greenhouse\.io\/([^/]+)\/jobs/)

        if (match && companyMatch) {
          const jobId = match[1]
          const companySlug = companyMatch[1]

          // Check if job exists via Greenhouse API
          const jobCheck = await fetch(
            `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs/${jobId}`,
            { headers: { 'Content-Type': 'application/json' } }
          )

          if (jobCheck.ok) {
            // Submit application
            const applyRes = await fetch(
              `https://boards-api.greenhouse.io/v1/boards/${companySlug}/jobs/${jobId}/applications`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  first_name: userName.split(' ')[0] || userName,
                  last_name: userName.split(' ').slice(1).join(' ') || '',
                  email: userEmail,
                  phone: '',
                  resume_text: resume?.raw_text?.slice(0, 5000) || '',
                  cover_letter: `I am excited to apply for the ${job_title} position at ${company}. My skills include: ${skills.slice(0, 5).join(', ')}.`,
                }),
              }
            )

            if (applyRes.ok) {
              return NextResponse.json({
                success: true,
                method: 'greenhouse_api',
                message: `Applied to ${job_title} at ${company} via Greenhouse!`,
              })
            }
          }
        }
      } catch (e) {
        console.error('Greenhouse apply failed:', e)
      }
    }

    // ── Option A: Lever Direct API ────────────────────────────────
    if (job_url?.includes('lever.co')) {
      try {
        // Format: https://jobs.lever.co/company/job-id
        const match = job_url.match(/lever\.co\/([^/]+)\/([^/?]+)/)

        if (match) {
          const companySlug = match[1]
          const jobId = match[2]

          const applyRes = await fetch(
            `https://api.lever.co/v0/postings/${companySlug}/${jobId}/apply`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: userName,
                email: userEmail,
                phone: '',
                org: '',
                urls: {},
                comments: `Skills: ${skills.slice(0, 5).join(', ')}`,
                resume: resume?.raw_text?.slice(0, 5000) || '',
              }),
            }
          )

          if (applyRes.ok) {
            return NextResponse.json({
              success: true,
              method: 'lever_api',
              message: `Applied to ${job_title} at ${company} via Lever!`,
            })
          }
        }
      } catch (e) {
        console.error('Lever apply failed:', e)
      }
    }

    // ── Option B: Assisted Apply — return user info for clipboard ──
    const experience = (() => {
      try {
        const e = resume?.extracted_experience
        const arr = typeof e === 'string' ? JSON.parse(e) : (Array.isArray(e) ? e : [])
        return arr[0]?.title || ''
      } catch { return '' }
    })()

    return NextResponse.json({
      success: true,
      method: 'assisted',
      user_info: {
        name: userName,
        email: userEmail,
        skills: skills.slice(0, 8).join(', '),
        experience: experience,
        phone: '',
      },
      checklist: [
        { step: 1, label: 'Your name is copied', value: userName },
        { step: 2, label: 'Your email is copied', value: userEmail },
        { step: 3, label: 'Upload your resume from the job page', value: '' },
        { step: 4, label: 'Submit the application', value: '' },
      ],
      message: 'Opening job page. Your info is ready to paste.',
    })

  } catch (error) {
    console.error('Apply error:', error)
    return NextResponse.json({ error: 'Apply failed' }, { status: 500 })
  }
}
