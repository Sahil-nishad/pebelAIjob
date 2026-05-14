import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, unauthorized } from '@/lib/auth'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'
const INTERNAL_KEY = process.env.CAREERS_INTERNAL_API_KEY || 'change-me'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'

    let url = `${CAREERS_API_URL}/api/v1/campaigns/?limit=${limit}&offset=${offset}`
    if (status) url += `&status=${status}`

    const response = await fetch(url, {
      headers: {
        'x-pebel-user-id': auth.user.id,
        'x-pebel-user-email': auth.user.email,
        'x-internal-service-key': INTERNAL_KEY,
      },
    })
    const data = await response.json()
    if (!response.ok) return NextResponse.json({ error: data.detail || 'Failed to fetch campaigns' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch campaigns error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth) return unauthorized()

  try {
    const body = await req.json()
    const response = await fetch(`${CAREERS_API_URL}/api/v1/campaigns/`, {
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
    if (!response.ok) return NextResponse.json({ error: data.detail || 'Failed to create campaign' }, { status: response.status })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
