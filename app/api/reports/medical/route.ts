export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

const MedicalReportInputSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  radiologicalReportId: z.string().optional(),
  transcription: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const patientId = searchParams.get('patientId') ?? undefined

  let reports = store.getAllMedicalReports()

  // Doctors see only their own reports
  if (session.user.role === 'doctor') {
    reports = reports.filter(r => r.doctorId === session.user!.id)
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

  if (session.user.role !== 'doctor') {
    return NextResponse.json({ error: 'Forbidden: only doctors can create medical reports' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = MedicalReportInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const report = store.createMedicalReport({
    ...parsed.data,
    doctorId: session.user.id,
  })
  return NextResponse.json({ report }, { status: 201 })
}
