import { describe, it, expect } from 'vitest'
import { sealData } from 'iron-session'
import type { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/me/route'
import { getSessionOptions, getUserById } from '@/lib/auth'

// ---------------------------------------------------------------------------
// Review #26 blocker: /api/auth/me is the client's keep-alive ping, but the
// middleware matcher excludes /api/auth — so the handler itself must re-issue
// the session cookie (sliding expiration). These tests verify the response
// carries a refreshed Set-Cookie header when the session is valid.
// ---------------------------------------------------------------------------

async function makeSessionCookie(): Promise<string> {
  const user = getUserById('u-rad1')
  const { password, cookieName } = getSessionOptions()
  const seal = await sealData({ user }, { password: password as string })
  return `${cookieName}=${seal}`
}

function makeRequest(cookie?: string): NextRequest {
  return new Request('http://localhost:3200/api/auth/me', {
    headers: cookie ? { cookie } : {},
  }) as unknown as NextRequest
}

describe('GET /api/auth/me', () => {
  it('returns the session user when the cookie is valid', async () => {
    const res = await GET(makeRequest(await makeSessionCookie()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.id).toBe('u-rad1')
    expect(body.user.email).toBe('rad1@demo.pl')
  })

  it('refreshes the session cookie (Set-Cookie) on a valid keep-alive ping', async () => {
    const res = await GET(makeRequest(await makeSessionCookie()))
    expect(res.status).toBe(200)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).not.toBeNull()
    expect(setCookie).toContain('sonara_session=')
    // Sliding window: maxAge restarted at 15 minutes from this request
    expect(setCookie).toContain('Max-Age=900')
    expect(setCookie).toContain('HttpOnly')
  })

  it('returns 401 without a Set-Cookie header when there is no session', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('returns 401 for a garbage cookie', async () => {
    const res = await GET(makeRequest('sonara_session=not-a-valid-seal'))
    expect(res.status).toBe(401)
  })
})
