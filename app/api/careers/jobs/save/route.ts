import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'
const INTERNAL_KEY = process.env.CAREERS_INTERNAL_API_KEY || 'change-me'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const body = await req.json()

    const response = await fetch(`${CAREERS_API_URL}/api/v1/jobs/save`, {
      method: 'POST',
      headers: {
        'x-pebel-user-id': auth.user.id,
        'x-pebel-user-email': auth.user.email,
        'x-internal-service-key': INTERNAL_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to save job' },
        { status: response.status }
      )
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Save job error:', error)
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 })
  }
}
