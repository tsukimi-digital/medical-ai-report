import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updated = store.updateMedicalReport(params.id, body as Partial<typeof report>)
  return NextResponse.json({ report: updated })
}
