import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { authOptions } from './nextauth'
import { getSupabaseServer } from './supabase'

export async function requireAuth(req?: NextRequest) {
  // ── Chrome extension: Authorization: Bearer <nextauth-jwt> ──────────────────
  if (req) {
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7).trim()
      if (bearerToken) {
        try {
          // Spoof the bearer token as the NextAuth session cookie so getToken can decrypt it
          const cookieReq = new NextRequest('https://pebelai.com/', {
            headers: { cookie: `next-auth.session-token=${bearerToken}` },
          })
          const decoded = await getToken({
            req: cookieReq,
            secret: process.env.NEXTAUTH_SECRET!,
          })
          if (decoded?.dbId) {
            const supabase = getSupabaseServer()
            return {
              user: {
                id: decoded.dbId as string,
                email: (decoded.email as string) || '',
              },
              supabase,
            }
          }
        } catch (_) {
          // Invalid token — fall through to session check
        }
      }
    }
  }

  // ── Normal web session (cookie-based) ───────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const supabase = getSupabaseServer()
  return {
    user: { id: session.user.id, email: session.user.email },
    supabase,
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
