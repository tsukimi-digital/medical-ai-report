import { describe, it, expect } from 'vitest'
import { findUser, getUserById } from '@/lib/auth'

describe('findUser', () => {
  it('returns a user when credentials are correct', () => {
    const user = findUser('rad1@demo.pl', 'demo2024')
    expect(user).not.toBeNull()
    expect(user?.email).toBe('rad1@demo.pl')
    expect(user?.role).toBe('radiologist')
    expect(user?.id).toBe('u-rad1')
    expect(user?.name).toBe('dr Anna Lewandowska')
  })

  it('strips password field from returned user', () => {
    const user = findUser('rad1@demo.pl', 'demo2024')
    expect(user).not.toBeNull()
    expect((user as Record<string, unknown>)?.password).toBeUndefined()
    expect((user as Record<string, unknown>)?.passwordHash).toBeUndefined()
  })

  it('returns null for wrong password', () => {
    expect(findUser('rad1@demo.pl', 'wrongpassword')).toBeNull()
  })

  it('returns null for non-existent email', () => {
    expect(findUser('nobody@demo.pl', 'demo2024')).toBeNull()
  })

  it('returns null for empty credentials', () => {
    expect(findUser('', '')).toBeNull()
  })

  it('finds a doctor user', () => {
    const user = findUser('doc1@demo.pl', 'demo2024')
    expect(user).not.toBeNull()
    expect(user?.role).toBe('doctor')
    expect(user?.initials).toBe('MS')
  })

  it('all 7 demo users can be found', () => {
    const credentials = [
      'rad1@demo.pl', 'rad2@demo.pl', 'rad3@demo.pl',
      'doc1@demo.pl', 'doc2@demo.pl', 'doc3@demo.pl', 'doc4@demo.pl',
    ]
    credentials.forEach(email => {
      expect(findUser(email, 'demo2024')).not.toBeNull()
    })
  })
})

describe('getUserById', () => {
  it('returns a user by id', () => {
    const user = getUserById('u-rad1')
    expect(user).not.toBeNull()
    expect(user?.email).toBe('rad1@demo.pl')
  })

  it('returns null for unknown id', () => {
    expect(getUserById('no-such-id')).toBeNull()
  })

  it('strips password from returned user', () => {
    const user = getUserById('u-doc1')
    expect((user as Record<string, unknown>)?.password).toBeUndefined()
  })
})
