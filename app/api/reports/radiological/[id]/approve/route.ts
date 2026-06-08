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

  const report = store.getRadiologyReport(params.id)
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  // Only the owning radiologist can approve
  if (report.radiologistId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden: you are not the report\'s radiologist' }, { status: 403 })
  }

  // Cannot re-approve an already approved report
  if (report.status === 'approved') {
    return NextResponse.json({ error: 'Forbidden: report is already approved' }, { status: 403 })
  }

  // Business rule: block approval when findings[] is empty AND impression is empty
  const hasFindings = (report.findings?.length ?? 0) > 0
  const hasImpression = (report.impression?.trim()?.length ?? 0) > 0
  if (!hasFindings && !hasImpression) {
    return NextResponse.json(
      { error: 'Cannot approve empty report. Add at least one finding or impression.' },
      { status: 400 }
    )
  }

  const approved = store.approveRadiologyReport(params.id, session.user.id, session.user.name)
  return NextResponse.json({ report: approved })
}
