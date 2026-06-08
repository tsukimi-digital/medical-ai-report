export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { fuseFindings } from '@/lib/ai/claude'
import type { Finding } from '@/lib/types'

interface SessionData {
  userId?: string
  role?: string
}

const SESSION_OPTIONS = {
  cookieName: 'sonara_session',
  password: process.env.AUTH_SECRET ?? 'dev-secret-minimum-32-chars-long-ok',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  },
}

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { findingsFromImages, findingsFromSpeech } = body as {
    findingsFromImages?: Finding[]
    findingsFromSpeech?: Finding[]
  }

  if (!Array.isArray(findingsFromImages) || !Array.isArray(findingsFromSpeech)) {
    return NextResponse.json(
      { error: 'Missing required arrays: findingsFromImages, findingsFromSpeech' },
      { status: 400 }
    )
  }

  try {
    const result = await fuseFindings({ findingsFromImages, findingsFromSpeech })
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claude API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
