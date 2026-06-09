export const maxDuration = 60
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generatePatientExplanation } from '@/lib/ai/claude'
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

  // Invoke Claude with 1 retry + 45s timeout
  let attempt = 0
  while (attempt < 2) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45_000)

      const explanation = await generatePatientExplanation({
        report,
        transcription: transcription ?? undefined,
      })

      clearTimeout(timeoutId)

      // Save explanation back to the report in store
      if (reportType === 'radiological') {
        store.updateRadiologicalReport(reportId, { patientExplanation: explanation })
      } else {
        store.updateMedicalReport(reportId, { patientExplanation: explanation })
      }

      return NextResponse.json(explanation)
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
