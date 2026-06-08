export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { transcribeAudio } from '@/lib/ai/whisper'

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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const audioFile = formData.get('audio') as File | null
  if (!audioFile) {
    return NextResponse.json({ error: 'Missing audio file' }, { status: 400 })
  }

  const language = (formData.get('language') as string | null) ?? 'pl'

  // Timeout 45s, 1 retry
  let attempt = 0
  while (attempt < 2) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45_000)

      const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
      const result = await transcribeAudio(audioBuffer, audioFile.type || 'audio/webm')

      clearTimeout(timeoutId)

      return NextResponse.json({
        transcription: result.transcription,
        ...(result.transcriptionWarning ? { transcriptionWarning: result.transcriptionWarning } : {}),
        language,
      })
    } catch (err: unknown) {
      attempt++
      const isAbort = err instanceof Error && err.name === 'AbortError'
      const isWhisperError = err instanceof Error && (err.message.includes('429') || err.message.includes('rate'))

      if (attempt >= 2 || isAbort) {
        return NextResponse.json(
          { error: 'Transkrypcja niedostępna. Spróbuj ponownie lub wpisz tekst ręcznie.' },
          { status: isWhisperError ? 429 : 503 }
        )
      }
    }
  }

  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
