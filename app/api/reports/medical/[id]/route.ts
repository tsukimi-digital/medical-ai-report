import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

const UpdateMedicalReportSchema = z.object({
  transcription: z.string().optional(),
  anamnesis: z.string().optional(),
  diagnosis: z.string().optional(),
  diagnosisConfidence: z.enum(['definitive', 'probable', 'differential', 'possible']).optional(),
  recommendations: z.string().optional(),
  uncertainItems: z.array(z.string()).optional(),
  comments: z.string().optional(),
}).strict()

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = store.getMedicalReport(params.id)
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  return NextResponse.json({ report })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = store.getMedicalReport(params.id)
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Only the owning doctor can update
  if (report.doctorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: you are not the report\'s doctor' }, { status: 403 })
  }

  // Only drafts can be updated
  if (report.status === 'approved') {
    return NextResponse.json({ error: 'Forbidden: approved reports cannot be modified' }, { status: 403 })
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = UpdateMedicalReportSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = store.updateMedicalReport(params.id, parsed.data)
  return NextResponse.json({ report: updated })
}
