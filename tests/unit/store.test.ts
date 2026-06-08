import { describe, it, expect } from 'vitest'
import { store } from '@/lib/store'

describe('store — patients', () => {
  it('pre-seeds 4 patients', () => {
    expect(store.getAllPatients().length).toBeGreaterThanOrEqual(4)
  })

  it('pre-seeds known patient p-anna', () => {
    const patient = store.getPatient('p-anna')
    expect(patient).toBeDefined()
    expect(patient?.firstName).toBe('Anna')
    expect(patient?.lastName).toBe('Kowalska')
    expect(patient?.pesel).toBe('74050512388')
    expect(patient?.gender).toBe('F')
  })

  it('pre-seeds patient p-marek (male)', () => {
    const patient = store.getPatient('p-marek')
    expect(patient).toBeDefined()
    expect(patient?.gender).toBe('M')
  })

  it('creates patient with UUID', () => {
    const p = store.createPatient({
      firstName: 'Test',
      lastName: 'Testowski',
      pesel: '99010100001',
      gender: 'M',
      dateOfBirth: '1999-01-01',
      age: 26,
    })
    expect(p.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(p.firstName).toBe('Test')
  })

  it('retrieves created patient', () => {
    const p = store.createPatient({
      firstName: 'Zofia',
      lastName: 'Kowalczyk',
      pesel: '85060567890',
      gender: 'F',
      dateOfBirth: '1985-06-05',
      age: 40,
    })
    const retrieved = store.getPatient(p.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.lastName).toBe('Kowalczyk')
  })

  it('finds patient by PESEL', () => {
    const patient = store.getPatientByPesel('74050512388')
    expect(patient).toBeDefined()
    expect(patient?.id).toBe('p-anna')
  })

  it('returns undefined for non-existent patient', () => {
    expect(store.getPatient('non-existent-id')).toBeUndefined()
  })
})

describe('store — radiological reports', () => {
  it('pre-seeds at least 2 radiological reports (Case A draft + approved)', () => {
    expect(store.getAllRadiologicalReports().length).toBeGreaterThanOrEqual(2)
  })

  it('pre-seeds Case A draft (rad-A)', () => {
    const report = store.getRadiologicalReport('rad-A')
    expect(report).toBeDefined()
    expect(report?.examinationType).toBe('USG tarczycy')
    expect(report?.status).toBe('draft')
    expect(report?.caseKey).toBe('A')
  })

  it('pre-seeds Case A approved (rad-A-appr)', () => {
    const report = store.getRadiologicalReport('rad-A-appr')
    expect(report).toBeDefined()
    expect(report?.status).toBe('approved')
    expect(report?.approvedByName).toBe('dr Anna Lewandowska')
  })

  it('pre-seeds Case B (voice-to-report draft)', () => {
    const report = store.getRadiologicalReport('rad-B')
    expect(report).toBeDefined()
    expect(report?.examinationType).toBe('USG jamy brzusznej')
    expect(report?.analysisMode).toBe('voice')
    expect(report?.caseKey).toBe('B')
  })

  it('pre-seeds Case D (multimodal, suboptimal quality)', () => {
    const report = store.getRadiologicalReport('rad-D')
    expect(report).toBeDefined()
    expect(report?.imageQuality).toBe('suboptimal')
    expect(report?.analysisMode).toBe('multimodal')
  })

  it('creates a new radiological report with UUID', () => {
    const report = store.createRadiologicalReport({
      patientId: 'p-anna',
      radiologistId: 'u-rad1',
      examinationType: 'USG nerek',
    })
    expect(report.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(report.status).toBe('draft')
    expect(report.aiGenerated).toBe(false)
  })

  it('filters radiological reports by patientId', () => {
    const reports = store.getAllRadiologicalReports('p-anna')
    expect(reports.every(r => r.patientId === 'p-anna')).toBe(true)
    expect(reports.length).toBeGreaterThanOrEqual(2) // rad-A and rad-A-appr
  })

  it('updates a radiological report', () => {
    const created = store.createRadiologicalReport({
      patientId: 'p-marek',
      radiologistId: 'u-rad1',
      examinationType: 'USG wątroby',
    })
    const updated = store.updateRadiologicalReport(created.id, { impression: 'Wątroba bez zmian.' })
    expect(updated?.impression).toBe('Wątroba bez zmian.')
  })

  it('approves a radiological report', () => {
    const created = store.createRadiologicalReport({
      patientId: 'p-ewa',
      radiologistId: 'u-rad2',
      examinationType: 'USG piersi',
      findings: [{ text: 'Bez zmian.', isDeviation: false, confidence: 'high', anatomicalLocation: 'pierś prawa' }],
      impression: 'Badanie prawidłowe.',
    })
    const approved = store.approveRadiologicalReport(created.id, 'dr Piotr Zieliński')
    expect(approved?.status).toBe('approved')
    expect(approved?.approvedByName).toBe('dr Piotr Zieliński')
    expect(approved?.approvedAt).toBeDefined()
  })

  it('returns null when updating non-existent report', () => {
    const result = store.updateRadiologicalReport('non-existent', { impression: 'test' })
    expect(result).toBeNull()
  })
})

describe('store — medical reports', () => {
  it('pre-seeds Case C (doctor visit draft, med-C)', () => {
    const report = store.getMedicalReport('med-C')
    expect(report).toBeDefined()
    expect(report?.patientId).toBe('p-anna')
    expect(report?.caseKey).toBe('C')
    expect(report?.radiologicalReportId).toBe('rad-A-appr')
    expect(report?.status).toBe('draft')
  })

  it('Case C has patient explanation seeded', () => {
    const report = store.getMedicalReport('med-C')
    expect(report?.patientExplanation).toBeDefined()
    expect(report?.patientExplanation?.keyFindings.length).toBeGreaterThan(0)
  })

  it('creates a medical report with UUID', () => {
    const report = store.createMedicalReport({
      patientId: 'p-marek',
      doctorId: 'u-doc1',
    })
    expect(report.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(report.status).toBe('draft')
  })

  it('filters medical reports by patientId', () => {
    const reports = store.getAllMedicalReports('p-anna')
    expect(reports.every(r => r.patientId === 'p-anna')).toBe(true)
    expect(reports.length).toBeGreaterThanOrEqual(1)
  })

  it('updates a medical report', () => {
    const created = store.createMedicalReport({
      patientId: 'p-tomasz',
      doctorId: 'u-doc2',
    })
    const updated = store.updateMedicalReport(created.id, { diagnosis: 'Zdrowy.' })
    expect(updated?.diagnosis).toBe('Zdrowy.')
  })
})

describe('store — users', () => {
  it('finds user by email', () => {
    const user = store.getUserByEmail('rad1@demo.pl')
    expect(user).toBeDefined()
    expect(user?.name).toBe('dr Anna Lewandowska')
    expect(user?.role).toBe('radiologist')
    expect(user?.password).toBe('demo2024')
  })

  it('returns user without password via getUserById', () => {
    const user = store.getUserById('u-rad1')
    expect(user).toBeDefined()
    expect(user?.name).toBe('dr Anna Lewandowska')
    expect('password' in (user ?? {})).toBe(false)
  })

  it('returns undefined for non-existent email', () => {
    expect(store.getUserByEmail('nobody@demo.pl')).toBeUndefined()
  })
})
