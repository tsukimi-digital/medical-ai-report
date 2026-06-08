import { NextRequest, NextResponse } from 'next/server'
import { getSession, findUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  let email: string | undefined
  let password: string | undefined

  try {
    const body = await request.json()
    email = body?.email
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
  }

  const user = findUser(email, password)
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getSession()
  session.user = user
  await session.save()

  return NextResponse.json({ user })
}
