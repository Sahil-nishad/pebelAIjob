import { NextRequest, NextResponse } from 'next/server'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call backend to reset daily campaign limits
    const response = await fetch(`${CAREERS_API_URL}/api/v1/campaigns/reset-daily`, {
      method: 'POST',
      headers: {
        'x-internal-service-key': process.env.CAREERS_INTERNAL_API_KEY || '',
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ success: true, ...data })
    } else {
      return NextResponse.json(
        { error: 'Failed to reset daily limits' },
        { status: response.status }
      )
    }
  } catch (error) {
    console.error('Cron careers-daily-reset error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to careers backend' },
      { status: 500 }
    )
  }
}
