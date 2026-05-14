import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const response = await fetch(
      `${CAREERS_API_URL}/api/v1/analytics/dashboard`,
      {
        headers: {
          'Authorization': req.headers.get('authorization') || '',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch dashboard stats' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
