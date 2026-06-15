import { describe, it, expect } from 'vitest'
import type { Finding } from '@/lib/types'

// Pure logic extracted from the dismiss handlers — tested independently of React components.

function removeFindingById(findings: Finding[], id: string): Finding[] {
  return findings.filter((f) => f.id !== id)
}

function removeUncertainItemByIndex(items: string[], index: number): string[] {
  return items.filter((_, j) => j !== index)
}

const makeFinding = (id: string, text: string): Finding => ({
  id,
  text,
  isDeviation: false,
  confidence: 'low',
  anatomicalLocation: 'test',
})

describe('removeFindingById (lowConfidenceFindings)', () => {
  it('removes the finding with the matching id', () => {
    const findings = [makeFinding('a', 'A'), makeFinding('b', 'B'), makeFinding('c', 'C')]
    expect(removeFindingById(findings, 'b')).toEqual([makeFinding('a', 'A'), makeFinding('c', 'C')])
  })

  it('returns all findings when id does not match', () => {
    const findings = [makeFinding('a', 'A'), makeFinding('b', 'B')]
    expect(removeFindingById(findings, 'z')).toHaveLength(2)
  })

  it('returns empty array when removing the only finding', () => {
    expect(removeFindingById([makeFinding('a', 'A')], 'a')).toEqual([])
  })

  it('does not mutate the original array', () => {
    const findings = [makeFinding('a', 'A'), makeFinding('b', 'B')]
    removeFindingById(findings, 'a')
    expect(findings).toHaveLength(2)
  })
})

describe('removeUncertainItemByIndex (uncertainItems)', () => {
  it('removes the item at the given index', () => {
    const items = ['A', 'B', 'C']
    expect(removeUncertainItemByIndex(items, 1)).toEqual(['A', 'C'])
  })

  it('removes the first item', () => {
    expect(removeUncertainItemByIndex(['X', 'Y'], 0)).toEqual(['Y'])
  })

  it('removes the last item', () => {
    expect(removeUncertainItemByIndex(['X', 'Y'], 1)).toEqual(['X'])
  })

  it('returns empty array when removing the only item', () => {
    expect(removeUncertainItemByIndex(['X'], 0)).toEqual([])
  })

  it('does not mutate the original array', () => {
    const items = ['A', 'B']
    removeUncertainItemByIndex(items, 0)
    expect(items).toHaveLength(2)
  })
})
