import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Returns the raw NextAuth JWT so the Chrome extension can use it as a Bearer token.
// Only accessible to authenticated users (token is validated before returning).
export async function GET(req: NextRequest) {
  const decoded = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! })
  if (!decoded?.dbId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const raw = await getToken({ req, secret: process.env.NEXTAUTH_SECRET!, raw: true })
  if (!raw) {
    return NextResponse.json({ error: 'Token unavailable' }, { status: 401 })
  }

  return NextResponse.json({ token: raw }, {
    headers: {
      // Don't cache — token changes on session refresh
      'Cache-Control': 'no-store',
    },
  })
}
