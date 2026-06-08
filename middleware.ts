// BE1: implement auth middleware
// - Protect all /(app)/* routes — redirect to /login if no valid iron-session cookie
// - Use getIronSession(req, res, sessionOptions) from lib/auth.ts
// - matcher: ['/(app)/:path*']
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(_request: NextRequest) {
  // BE1: replace with session check + redirect logic
  return NextResponse.next()
}

export const config = {
  matcher: ['/(app)/:path*'],
}
