import { NextRequest, NextResponse } from 'next/server'

const CAREERS_API_URL = process.env.CAREERS_API_URL || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  try {
    // Ping the backend to keep it awake
    const response = await fetch(`${CAREERS_API_URL}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'PebelAI-KeepAlive/1.0' },
    })

    const data = await response.json()
    return NextResponse.json({ success: true, backend: data.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Backend unreachable' })
  }
}
