import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { getSessionOptions, type SessionData } from './lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through without session check
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // For all protected (app) routes, check session.
  // Use the (request, response) overload so the cookie can be re-issued below.
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, getSessionOptions())

  if (!session.user) {
    // API routes return 401; page routes redirect to /login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Sliding expiration (spec l.1128 — invalidation after 15 min of INACTIVITY):
  // re-save the session on every authenticated request so the cookie's
  // 15-minute maxAge counts from the last activity, not from login.
  await session.save()

  return response
}

export const config = {
  // Protect (app) pages and API routes (except /api/auth which is public)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
}
