import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import type { User, SeedUser } from './types'

// ---------------------------------------------------------------------------
// Hardcoded demo users — matches docs/api-contract.md "Hardcoded users" table
// ---------------------------------------------------------------------------
const USERS: SeedUser[] = [
  { id: 'u-rad1', name: 'dr Anna Lewandowska',  email: 'rad1@demo.pl', role: 'radiologist', initials: 'AL', password: 'demo2024' },
  { id: 'u-rad2', name: 'dr Piotr Zieliński',   email: 'rad2@demo.pl', role: 'radiologist', initials: 'PZ', password: 'demo2024' },
  { id: 'u-rad3', name: 'dr Katarzyna Wróbel',  email: 'rad3@demo.pl', role: 'radiologist', initials: 'KW', password: 'demo2024' },
  { id: 'u-doc1', name: 'lek. Marta Sawicka',   email: 'doc1@demo.pl', role: 'doctor',      initials: 'MS', password: 'demo2024' },
  { id: 'u-doc2', name: 'lek. Jan Kowalczyk',   email: 'doc2@demo.pl', role: 'doctor',      initials: 'JK', password: 'demo2024' },
  { id: 'u-doc3', name: 'lek. Agnieszka Dąbek', email: 'doc3@demo.pl', role: 'doctor',      initials: 'AD', password: 'demo2024' },
  { id: 'u-doc4', name: 'lek. Robert Szymański', email: 'doc4@demo.pl', role: 'doctor',      initials: 'RS', password: 'demo2024' },
]

// ---------------------------------------------------------------------------
// Session data shape
// ---------------------------------------------------------------------------
export interface SessionData {
  user?: User
}

// ---------------------------------------------------------------------------
// iron-session configuration — matches api-contract.md
// ---------------------------------------------------------------------------

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required')
}

export const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET,
  cookieName: 'sonara_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns the iron-session for the current Next.js request context. */
export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

/**
 * Validates credentials and returns a public User (no password field).
 * Returns null if credentials are invalid.
 */
export function findUser(email: string, password: string): User | null {
  const found = USERS.find(u => u.email === email && u.password === password)
  if (!found) return null
  // Strip password before returning
  const { password: _pw, ...publicUser } = found
  return publicUser as User
}

/** Look up a user by id (used by middleware / session refresh). */
export function getUserById(id: string): User | null {
  const found = USERS.find(u => u.id === id)
  if (!found) return null
  const { password: _pw, ...publicUser } = found
  return publicUser as User
}
