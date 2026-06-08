export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { generatePatientExplanation } from '@/lib/ai/claude'
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

  const { reportId, reportType, transcription } = body as {
    reportId?: string
    reportType?: string
    transcription?: string
  }

  if (!reportId || !reportType) {
    return NextResponse.json({ error: 'Missing required fields: reportId, reportType' }, { status: 400 })
  }

  if (reportType !== 'radiological' && reportType !== 'medical') {
    return NextResponse.json({ error: 'Invalid reportType (radiological|medical)' }, { status: 400 })
  }

  // Load report from store
  let report
  if (reportType === 'radiological') {
    report = store.getRadiologicalReport(reportId)
  } else {
    report = store.getMedicalReport(reportId)
  }

  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  try {
    const explanation = await generatePatientExplanation({
      report,
      transcription: transcription ?? undefined,
    })

    // Save explanation back to the report in store
    if (reportType === 'radiological') {
      store.updateRadiologicalReport(reportId, { patientExplanation: explanation })
    } else {
      store.updateMedicalReport(reportId, { patientExplanation: explanation })
    }

    return NextResponse.json(explanation)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claude API error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
