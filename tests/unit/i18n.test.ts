import { describe, it, expect } from 'vitest'
import { pl } from '../../lib/i18n/pl'
import { en } from '../../lib/i18n/en'

type Dict = typeof pl

describe('i18n', () => {
  it('pl dictionary has all expected keys', () => {
    const keys: Array<keyof Dict> = [
      'brandSub', 'disclaimer', 'logout', 'loginTitle', 'signIn', 'email', 'password',
      'noResults', 'hello', 'newExam', 'newVisit', 'demoCases', 'approve', 'cancel', 'confirm',
    ]
    for (const k of keys) {
      expect(pl[k], `Missing key: ${k}`).toBeTruthy()
    }
  })

  it('en dictionary has all expected keys', () => {
    const keys: Array<keyof Dict> = [
      'brandSub', 'disclaimer', 'logout', 'loginTitle', 'signIn', 'email', 'password',
      'noResults', 'hello', 'newExam', 'newVisit', 'demoCases', 'approve', 'cancel', 'confirm',
    ]
    for (const k of keys) {
      expect((en as any)[k], `Missing EN key: ${k}`).toBeTruthy()
    }
  })

  it('pl and en have the same keys', () => {
    const plKeys = Object.keys(pl).sort()
    const enKeys = Object.keys(en).sort()
    expect(plKeys).toEqual(enKeys)
  })

  it('no empty string values in pl', () => {
    for (const [k, v] of Object.entries(pl)) {
      expect(v, `Empty PL value for key: ${k}`).toBeTruthy()
    }
  })

  it('no empty string values in en', () => {
    for (const [k, v] of Object.entries(en)) {
      expect(v, `Empty EN value for key: ${k}`).toBeTruthy()
    }
  })
})
