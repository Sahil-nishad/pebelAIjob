import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const response = await fetch(
      `${CAREERS_API_URL}/api/v1/auth/gmail/authorize`,
      {
        headers: {
          'Authorization': req.headers.get('authorization') || '',
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to initiate Gmail OAuth' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Gmail authorize error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    )
  }
}
