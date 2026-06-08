import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

const RadiologyReportInputSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  examinationType: z.string().min(1, 'examinationType is required'),
  clinicalIndication: z.string().optional(),
  examinationContext: z.record(z.unknown()).optional(),
  comments: z.string().optional(),
  analysisMode: z.enum(['image', 'voice', 'multimodal']).optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId') ?? undefined

  let reports = store.getAllRadiologicalReports()

  // Radiologists see only their own reports
  if (session.user.role === 'radiologist') {
    reports = reports.filter(r => r.radiologistId === session.user!.id)
  }

  if (patientId) {
    reports = reports.filter(r => r.patientId === patientId)
  }

  return NextResponse.json({ reports })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'radiologist') {
    return NextResponse.json({ error: 'Forbidden: only radiologists can create radiological reports' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RadiologyReportInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const report = store.createRadiologicalReport({
    ...parsed.data,
    radiologistId: session.user.id,
  })
  return NextResponse.json({ report }, { status: 201 })
}
