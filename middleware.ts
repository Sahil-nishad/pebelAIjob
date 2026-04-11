import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for auth cookie on protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/applications') ||
    request.nextUrl.pathname.startsWith('/coach') ||
    request.nextUrl.pathname.startsWith('/reminders') ||
    request.nextUrl.pathname.startsWith('/resume') ||
    request.nextUrl.pathname.startsWith('/settings')

  if (isAuthRoute) {
    const supabaseAuth = request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('sb-refresh-token')?.value

    if (!supabaseAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/applications/:path*',
    '/coach/:path*',
    '/reminders/:path*',
    '/resume/:path*',
    '/settings/:path*',
  ],
}
