import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const body = await req.json()

    const response = await fetch(`${CAREERS_API_URL}/api/v1/analytics/`, {
      method: 'POST',
      headers: {
        'Authorization': req.headers.get('authorization') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch analytics' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
