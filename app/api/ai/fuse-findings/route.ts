export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { fuseFindings } from '@/lib/ai/claude'
import type { Finding } from '@/lib/types'

export async function POST(request: NextRequest) {
  // Auth check
  const session = await getSession()
  if (!session.user) {
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

  // Invoke Claude with 1 retry + 45s timeout
  let attempt = 0
  while (attempt < 2) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45_000)

      const result = await fuseFindings({ findingsFromImages, findingsFromSpeech })

      clearTimeout(timeoutId)
      return NextResponse.json(result)
    } catch (err: unknown) {
      attempt++
      const isAbort = err instanceof Error && err.name === 'AbortError'
      if (attempt >= 2 || isAbort) {
        return NextResponse.json(
          { error: 'Usługa chwilowo niedostępna. Spróbuj ponownie.' },
          { status: 503 }
        )
      }
    }
  }

  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
