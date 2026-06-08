import { describe, it, expect } from 'vitest'
import { getExamTypeConfig, buildAnalyzeImageSystemPrompt, buildGenerateReportSystemPrompt } from '@/lib/ai/examTypePrompts'

describe('examTypePrompts — getExamTypeConfig', () => {
  it('returns TI-RADS classification for USG tarczycy', () => {
    const cfg = getExamTypeConfig('USG tarczycy')
    expect(cfg.classifications.some(c => c.name === 'ACR TI-RADS')).toBe(true)
  })

  it('returns BI-RADS for USG piersi', () => {
    const cfg = getExamTypeConfig('USG piersi')
    expect(cfg.classifications.some(c => c.name === 'ACR BI-RADS')).toBe(true)
  })

  it('returns Bosniak and SFU for USG nerek', () => {
    const cfg = getExamTypeConfig('USG nerek')
    const names = cfg.classifications.map(c => c.name)
    expect(names).toContain('Bosniak 2019')
    expect(names).toContain('SFU')
  })

  it('returns NASCET for USG Doppler tętnic szyjnych', () => {
    const cfg = getExamTypeConfig('USG Doppler tętnic szyjnych')
    expect(cfg.classifications.some(c => c.name === 'NASCET')).toBe(true)
  })

  it('returns O-RADS for USG ginekologiczne transwaginalne (TV)', () => {
    const cfg = getExamTypeConfig('USG ginekologiczne transwaginalne (TV)')
    expect(cfg.classifications.some(c => c.name === 'O-RADS US 2022')).toBe(true)
  })

  it('returns default for unknown exam type', () => {
    const cfg = getExamTypeConfig('nieznany typ badania')
    expect(cfg).toBeDefined()
    expect(cfg.classifications).toHaveLength(0)
    expect(cfg.mandatoryStructures).toHaveLength(0)
  })

  it('USG tarczycy has mandatory structures including left and right lobe', () => {
    const cfg = getExamTypeConfig('USG tarczycy')
    const structures = cfg.mandatoryStructures.map(s => s.toLowerCase())
    expect(structures.some(s => s.includes('lewy płat') || s.includes('lewy'))).toBe(true)
    expect(structures.some(s => s.includes('prawy płat') || s.includes('prawy'))).toBe(true)
  })

  it('USG piersi has gender restriction F', () => {
    const cfg = getExamTypeConfig('USG piersi')
    expect(cfg.genderRestriction).toBe('F')
  })

  it('USG prostaty has gender restriction M', () => {
    const cfg = getExamTypeConfig('USG prostaty')
    expect(cfg.genderRestriction).toBe('M')
  })

  it('returns warning thresholds for USG tarczycy TI-RADS', () => {
    const cfg = getExamTypeConfig('USG tarczycy')
    expect(cfg.warningThresholds.length).toBeGreaterThan(0)
    expect(cfg.warningThresholds.some(w => w.field.toLowerCase().includes('ti-rads'))).toBe(true)
  })
})

describe('examTypePrompts — buildAnalyzeImageSystemPrompt', () => {
  it('includes TI-RADS in prompt for USG tarczycy', () => {
    const prompt = buildAnalyzeImageSystemPrompt('USG tarczycy', 'F')
    expect(prompt).toContain('TI-RADS')
    expect(prompt).toContain('lewy płat')
  })

  it('includes BI-RADS in prompt for USG piersi', () => {
    const prompt = buildAnalyzeImageSystemPrompt('USG piersi', 'F')
    expect(prompt).toContain('BI-RADS')
  })

  it('includes Bosniak in prompt for USG nerek', () => {
    const prompt = buildAnalyzeImageSystemPrompt('USG nerek')
    expect(prompt).toContain('Bosniak')
  })

  it('returns a non-empty string for unknown exam type', () => {
    const prompt = buildAnalyzeImageSystemPrompt('nieznany typ')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(10)
  })

  it('includes NASCET for tętnice szyjne', () => {
    const prompt = buildAnalyzeImageSystemPrompt('USG Doppler tętnic szyjnych')
    expect(prompt).toContain('NASCET')
    expect(prompt).toContain('IMT')
  })
})

describe('examTypePrompts — buildGenerateReportSystemPrompt', () => {
  it('includes mandatory structures for USG jamy brzusznej', () => {
    const prompt = buildGenerateReportSystemPrompt('USG jamy brzusznej')
    expect(prompt).toContain('wątroba')
    expect(prompt).toContain('trzustka')
  })

  it('includes classification info for USG tarczycy', () => {
    const prompt = buildGenerateReportSystemPrompt('USG tarczycy')
    expect(prompt).toContain('TI-RADS')
  })

  it('returns string for default type', () => {
    const prompt = buildGenerateReportSystemPrompt('jakiś nowy typ')
    expect(typeof prompt).toBe('string')
  })
})
