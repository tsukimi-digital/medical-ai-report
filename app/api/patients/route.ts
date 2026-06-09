export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { store } from '@/lib/store'

const PatientSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  pesel: z.string().regex(/^\d{11}$/, 'PESEL must be exactly 11 digits'),
  gender: z.enum(['M', 'F']),
  dateOfBirth: z.string().min(1, 'dateOfBirth is required'),
})

export async function GET() {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const patients = store.getAllPatients()
  return NextResponse.json({ patients })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = PatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Check for duplicate PESEL
  const existing = store.getAllPatients().find(p => p.pesel === parsed.data.pesel)
  if (existing) {
    return NextResponse.json(
      { error: 'Patient with this PESEL already exists' },
      { status: 409 }
    )
  }

  const dob = new Date(parsed.data.dateOfBirth)
  const age = new Date().getFullYear() - dob.getFullYear()
  const patient = store.createPatient({ ...parsed.data, age })
  return NextResponse.json({ patient }, { status: 201 })
}
