export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { analyzeImages } from '@/lib/ai/claude'
import { preprocessImage } from '@/lib/ai/image-preprocessor'

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

  const imageFiles = formData.getAll('images') as File[]

  // Validation
  if (imageFiles.length === 0 || imageFiles.length > 5) {
    return NextResponse.json({ error: 'Provide 1–5 images' }, { status: 400 })
  }

  for (const file of imageFiles) {
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: `Image ${file.name} exceeds 5 MB limit` }, { status: 400 })
    }
  }

  const examinationType = formData.get('examinationType') as string | null
  const patientAge = formData.get('patientAge') as string | null
  const patientGender = formData.get('patientGender') as string | null

  if (!examinationType || !patientAge || !patientGender) {
    return NextResponse.json({ error: 'Missing required fields: examinationType, patientAge, patientGender' }, { status: 400 })
  }

  const examinationContextRaw = formData.get('examinationContext') as string | null
  let examinationContext: Record<string, unknown> | undefined
  if (examinationContextRaw) {
    try {
      examinationContext = JSON.parse(examinationContextRaw)
    } catch {
      return NextResponse.json({ error: 'Invalid examinationContext JSON' }, { status: 400 })
    }
  }

  // Preprocess + analyze with 1 retry
  let attempt = 0
  while (attempt < 2) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45_000)

      const images = await Promise.all(
        imageFiles.map(async (f) => {
          const buffer = Buffer.from(await f.arrayBuffer())
          return preprocessImage(buffer)
        })
      )

      const result = await analyzeImages({
        images,
        examinationType,
        clinicalIndication: formData.get('clinicalIndication') as string | undefined ?? undefined,
        examinationContext: examinationContext as Parameters<typeof analyzeImages>[0]['examinationContext'],
        comments: formData.get('comments') as string | undefined ?? undefined,
        patientAge: Number(patientAge),
        patientGender: patientGender as 'M' | 'F',
        language: ((formData.get('language') as string | null) ?? 'pl') as 'pl' | 'en',
      })

      clearTimeout(timeoutId)
      return NextResponse.json(result)
    } catch (err: unknown) {
      attempt++
      const isAbort = err instanceof Error && err.name === 'AbortError'
      if (attempt >= 2 || isAbort) {
        return NextResponse.json(
          {
            error: 'Analiza niedostępna. Spróbuj ponownie lub kontynuuj ręcznie.',
            fallback: true,
          },
          { status: 503 }
        )
      }
    }
  }

  // Should not reach here
  return NextResponse.json({ error: 'Internal error' }, { status: 500 })
}
