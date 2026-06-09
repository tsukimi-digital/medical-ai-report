export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

export async function PATCH(
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

  // Only the owning doctor can approve
  if (report.doctorId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: you are not the report\'s doctor' }, { status: 403 })
  }

  // Cannot re-approve
  if (report.status === 'approved') {
    return NextResponse.json({ error: 'Forbidden: report is already approved' }, { status: 403 })
  }

  // Business rule: require anamnesis, diagnosis, and recommendations
  const missingFields: string[] = []
  if (!report.anamnesis?.trim()) missingFields.push('anamnesis')
  if (!report.diagnosis?.trim()) missingFields.push('diagnosis')
  if (!report.recommendations?.trim()) missingFields.push('recommendations')

  if (missingFields.length > 0) {
    return NextResponse.json(
      { error: `Cannot approve report. Missing required fields: ${missingFields.join(', ')}.` },
      { status: 400 }
    )
  }

  const approved = store.approveMedicalReport(params.id)
  return NextResponse.json({ report: approved })
}
