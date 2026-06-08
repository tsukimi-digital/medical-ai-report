import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Re-declare the same schemas as in API routes (pure logic, no Next.js deps)
// ---------------------------------------------------------------------------

const UpdateRadiologyReportSchema = z.object({
  findings: z.array(z.any()).optional(),
  impression: z.string().optional(),
  imagingLimitations: z.string().optional(),
  radiologistRecommendations: z.string().optional(),
  comments: z.string().optional(),
}).strict()

const UpdateMedicalReportSchema = z.object({
  transcription: z.string().optional(),
  anamnesis: z.string().optional(),
  diagnosis: z.string().optional(),
  diagnosisConfidence: z.enum(['definitive', 'probable', 'differential', 'possible']).optional(),
  recommendations: z.string().optional(),
  uncertainItems: z.array(z.string()).optional(),
  comments: z.string().optional(),
}).strict()

const PatientSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().min(1, 'lastName is required'),
  pesel: z.string().regex(/^\d{11}$/, 'PESEL must be exactly 11 digits'),
  gender: z.enum(['M', 'F']),
  dateOfBirth: z.string().min(1, 'dateOfBirth is required'),
})

const RadiologyReportInputSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  examinationType: z.string().min(1, 'examinationType is required'),
  clinicalIndication: z.string().optional(),
  examinationContext: z.record(z.unknown()).optional(),
  comments: z.string().optional(),
  analysisMode: z.enum(['image', 'voice', 'multimodal']).optional(),
})

const MedicalReportInputSchema = z.object({
  patientId: z.string().min(1, 'patientId is required'),
  radiologicalReportId: z.string().optional(),
  transcription: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Approve rule (pure function equivalent — no store dependency)
// ---------------------------------------------------------------------------

function canApproveRadiologyReport(report: {
  findings?: { id?: string; text: string }[]
  impression?: string
}): { allowed: boolean; reason?: string } {
  const hasFindings = (report.findings?.length ?? 0) > 0
  const hasImpression = (report.impression?.trim()?.length ?? 0) > 0
  if (!hasFindings && !hasImpression) {
    return {
      allowed: false,
      reason: 'Cannot approve empty report. Add at least one finding or impression.',
    }
  }
  return { allowed: true }
}

function canApproveMedicalReport(report: {
  anamnesis?: string
  diagnosis?: string
  recommendations?: string
}): { allowed: boolean; missingFields?: string[] } {
  const missing: string[] = []
  if (!report.anamnesis?.trim()) missing.push('anamnesis')
  if (!report.diagnosis?.trim()) missing.push('diagnosis')
  if (!report.recommendations?.trim()) missing.push('recommendations')
  if (missing.length > 0) return { allowed: false, missingFields: missing }
  return { allowed: true }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PatientSchema — PESEL validation', () => {
  const validBase = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    gender: 'M' as const,
    dateOfBirth: '1980-01-01',
  }

  it('accepts a valid 11-digit PESEL', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '80010112345' })
    expect(result.success).toBe(true)
  })

  it('rejects a PESEL with 10 digits', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '8001011234' })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.flatten())).toContain('PESEL')
  })

  it('rejects a PESEL with 12 digits', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '800101123456' })
    expect(result.success).toBe(false)
  })

  it('rejects a PESEL with non-digit characters', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '8001011234A' })
    expect(result.success).toBe(false)
  })

  it('rejects empty PESEL', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing firstName', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '80010112345', firstName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid gender', () => {
    const result = PatientSchema.safeParse({ ...validBase, pesel: '80010112345', gender: 'X' as 'M' })
    expect(result.success).toBe(false)
  })
})

describe('RadiologyReportInputSchema', () => {
  it('accepts a valid minimal input', () => {
    const result = RadiologyReportInputSchema.safeParse({
      patientId: 'p-123',
      examinationType: 'USG tarczycy',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = RadiologyReportInputSchema.safeParse({
      patientId: 'p-123',
      examinationType: 'USG tarczycy',
      clinicalIndication: 'Kontrola',
      examinationContext: { fastingStatus: 'fasting' },
      comments: 'some comment',
      analysisMode: 'image',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid analysisMode', () => {
    const result = RadiologyReportInputSchema.safeParse({
      patientId: 'p-123',
      examinationType: 'USG tarczycy',
      analysisMode: 'unknown',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing patientId', () => {
    const result = RadiologyReportInputSchema.safeParse({
      examinationType: 'USG tarczycy',
    })
    expect(result.success).toBe(false)
  })
})

describe('MedicalReportInputSchema', () => {
  it('accepts a valid minimal input', () => {
    const result = MedicalReportInputSchema.safeParse({ patientId: 'p-abc' })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = MedicalReportInputSchema.safeParse({
      patientId: 'p-abc',
      radiologicalReportId: 'rad-123',
      transcription: 'Some transcription',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty patientId', () => {
    const result = MedicalReportInputSchema.safeParse({ patientId: '' })
    expect(result.success).toBe(false)
  })
})

describe('Radiology approve rule', () => {
  it('allows approval when there are findings', () => {
    const result = canApproveRadiologyReport({
      findings: [{ text: 'Some finding' }],
      impression: '',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows approval when there is an impression only', () => {
    const result = canApproveRadiologyReport({
      findings: [],
      impression: 'Normal exam.',
    })
    expect(result.allowed).toBe(true)
  })

  it('allows approval when both findings and impression are present', () => {
    const result = canApproveRadiologyReport({
      findings: [{ text: 'Some finding' }],
      impression: 'Normal exam.',
    })
    expect(result.allowed).toBe(true)
  })

  it('blocks approval when findings are empty AND impression is empty', () => {
    const result = canApproveRadiologyReport({ findings: [], impression: '' })
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Cannot approve empty report')
  })

  it('blocks approval when findings are empty AND impression is whitespace only', () => {
    const result = canApproveRadiologyReport({ findings: [], impression: '   ' })
    expect(result.allowed).toBe(false)
  })

  it('blocks approval when findings and impression are both undefined', () => {
    const result = canApproveRadiologyReport({})
    expect(result.allowed).toBe(false)
  })
})

describe('Medical approve rule', () => {
  it('allows approval when all required fields are present', () => {
    const result = canApproveMedicalReport({
      anamnesis: 'Some anamnesis',
      diagnosis: 'Some diagnosis',
      recommendations: 'Some recommendations',
    })
    expect(result.allowed).toBe(true)
  })

  it('blocks when anamnesis is missing', () => {
    const result = canApproveMedicalReport({
      anamnesis: '',
      diagnosis: 'diagnosis',
      recommendations: 'recs',
    })
    expect(result.allowed).toBe(false)
    expect(result.missingFields).toContain('anamnesis')
  })

  it('blocks when diagnosis is missing', () => {
    const result = canApproveMedicalReport({
      anamnesis: 'anamnesis',
      diagnosis: '',
      recommendations: 'recs',
    })
    expect(result.allowed).toBe(false)
    expect(result.missingFields).toContain('diagnosis')
  })

  it('blocks when recommendations is missing', () => {
    const result = canApproveMedicalReport({
      anamnesis: 'anamnesis',
      diagnosis: 'diagnosis',
      recommendations: '',
    })
    expect(result.allowed).toBe(false)
    expect(result.missingFields).toContain('recommendations')
  })

  it('collects all missing fields', () => {
    const result = canApproveMedicalReport({})
    expect(result.allowed).toBe(false)
    expect(result.missingFields).toHaveLength(3)
  })
})

describe('UpdateRadiologyReportSchema — PUT allowlist', () => {
  it('accepts empty object (no fields to update)', () => {
    const result = UpdateRadiologyReportSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts allowed fields', () => {
    const result = UpdateRadiologyReportSchema.safeParse({
      impression: 'Normal exam.',
      comments: 'Follow up in 6 months.',
      imagingLimitations: 'Patient movement',
      radiologistRecommendations: 'No further workup needed.',
      findings: [{ id: 'f1', text: 'Finding A' }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown fields (mass assignment protection)', () => {
    const result = UpdateRadiologyReportSchema.safeParse({
      impression: 'ok',
      status: 'approved', // should be blocked
    })
    expect(result.success).toBe(false)
  })

  it('rejects id field', () => {
    const result = UpdateRadiologyReportSchema.safeParse({ id: 'new-id' })
    expect(result.success).toBe(false)
  })
})

describe('UpdateMedicalReportSchema — PUT allowlist', () => {
  it('accepts empty object (no fields to update)', () => {
    const result = UpdateMedicalReportSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts allowed fields', () => {
    const result = UpdateMedicalReportSchema.safeParse({
      anamnesis: 'Patient reports pain.',
      diagnosis: 'Strain',
      diagnosisConfidence: 'probable',
      recommendations: 'Rest.',
      transcription: 'Some text',
      uncertainItems: ['item1'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown fields (mass assignment protection)', () => {
    const result = UpdateMedicalReportSchema.safeParse({
      anamnesis: 'ok',
      doctorId: 'another-doctor', // should be blocked
    })
    expect(result.success).toBe(false)
  })

  it('rejects status field', () => {
    const result = UpdateMedicalReportSchema.safeParse({ status: 'approved' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid diagnosisConfidence value', () => {
    const result = UpdateMedicalReportSchema.safeParse({ diagnosisConfidence: 'certain' })
    expect(result.success).toBe(false)
  })
})
