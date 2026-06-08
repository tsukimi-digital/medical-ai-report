export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { generateReport } from '@/lib/ai/claude'
import { store } from '@/lib/store'

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

  try {
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

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claude API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
