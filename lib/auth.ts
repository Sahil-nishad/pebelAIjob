import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
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
          // Invalid token — fall through
        }
      }
    }

    // ── Normal web session: read JWT directly from the request cookies ──────────
    // Using getToken(req) instead of getServerSession() to avoid compatibility
    // issues with Next.js 15/16 App Router where cookies() must be awaited.
    try {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET!,
      })
      if (token?.dbId) {
        const supabase = getSupabaseServer()
        return {
          user: {
            id: token.dbId as string,
            email: (token.email as string) || '',
          },
          supabase,
        }
      }
    } catch (_) {
      // Token decode failed — fall through to null
    }
  }

  return null
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
