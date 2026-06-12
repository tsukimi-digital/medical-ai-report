export const dynamic = 'force-dynamic'
import { NextResponse, type NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { getSessionOptions, type SessionData } from '@/lib/auth'

/**
 * Keep-alive endpoint. The middleware's sliding-expiration save() does NOT
 * cover this route (its matcher excludes /api/auth), so the handler must
 * refresh the cookie itself — otherwise an active user whose only requests
 * are /api/auth/me pings would still be logged out after 15 minutes.
 *
 * Uses the (request, response) iron-session overload (same as middleware.ts)
 * so session.save() re-issues the Set-Cookie header on this response.
 */
export async function GET(request: NextRequest) {
  const response = new Response()
  const session = await getIronSession<SessionData>(request, response, getSessionOptions())

  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Sliding expiration: re-seal the session so the cookie's 15-min maxAge
  // counts from this keep-alive ping, not from login (review #26 blocker).
  await session.save()

  return NextResponse.json({ user: session.user }, { headers: response.headers })
}
