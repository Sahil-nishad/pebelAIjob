import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    // Get the form data from the request
    const formData = await req.formData()
    
    // Forward to FastAPI backend
    const response = await fetch(`${CAREERS_API_URL}/api/v1/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to upload resume' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Resume upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    )
  }
}
