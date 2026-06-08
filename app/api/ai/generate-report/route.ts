export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateReport } from '@/lib/ai/claude'
import { store } from '@/lib/store'

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

  const { transcription, role, examinationType, examinationContext, patientAge, patientGender, language, radiologicalReportId } = body as {
    transcription?: string
    role?: string
    examinationType?: string
    examinationContext?: Record<string, unknown>
    patientAge?: number
    patientGender?: string
    language?: string
    radiologicalReportId?: string
  }

  if (!transcription) {
    return NextResponse.json({ error: 'Missing transcription' }, { status: 400 })
  }

  if (!role || (role !== 'radiologist' && role !== 'doctor')) {
    return NextResponse.json({ error: 'Missing or invalid role (radiologist|doctor)' }, { status: 400 })
  }

  // Load radiological report context for doctor role
  let radiologicalReport = null
  if (role === 'doctor' && radiologicalReportId) {
    radiologicalReport = store.getRadiologicalReport(radiologicalReportId) ?? null
  }

  // Invoke Claude with 1 retry + 45s timeout
  let attempt = 0
  while (attempt < 2) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45_000)

      const result = await generateReport({
        transcription,
        role: role as 'radiologist' | 'doctor',
        examinationType: examinationType ?? undefined,
        examinationContext: examinationContext as Parameters<typeof generateReport>[0]['examinationContext'],
        patientAge: Number(patientAge ?? 0),
        patientGender: (patientGender as 'M' | 'F') ?? 'M',
        language: (language as 'pl' | 'en') ?? 'pl',
        radiologicalReport,
      })

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
