import { describe, it, expect } from 'vitest'
import { apiClient } from '../../lib/api-client'

describe('apiClient', () => {
  it('returns 4 demo patients', async () => {
    const { patients } = await apiClient.getPatients()
    expect(patients).toHaveLength(4)
  })

  it('each patient has required fields', async () => {
    const { patients } = await apiClient.getPatients()
    for (const p of patients) {
      expect(p.id).toBeTruthy()
      expect(p.firstName).toBeTruthy()
      expect(p.lastName).toBeTruthy()
      expect(p.pesel).toBeTruthy()
      expect(p.gender).toMatch(/^[MF]$/)
      expect(p.age).toBeGreaterThan(0)
    }
  })

  it('getPatient returns correct patient by id', async () => {
    const { patient } = await apiClient.getPatient('p-anna')
    expect(patient.firstName).toBe('Anna')
    expect(patient.lastName).toBe('Kowalska')
  })

  it('getPatient throws 404 for unknown id', async () => {
    await expect(apiClient.getPatient('nonexistent')).rejects.toThrow('404')
  })

  it('getRadReports returns reports with proper shape', async () => {
    const { reports } = await apiClient.getRadReports()
    expect(reports.length).toBeGreaterThan(0)
    for (const r of reports) {
      expect(r.id).toBeTruthy()
      expect(r.patientId).toBeTruthy()
      expect(r.examinationType).toBeTruthy()
      expect(r.status).toMatch(/^(draft|approved)$/)
    }
  })

  it('getRadReport returns Case A with correct findings', async () => {
    const { report } = await apiClient.getRadReport('rad-A')
    expect(report.caseKey).toBe('A')
    expect(report.findings.length).toBeGreaterThan(0)
    expect(report.classification?.name).toBe('ACR TI-RADS')
  })

  it('login succeeds with valid demo credentials', async () => {
    const { user } = await apiClient.login('rad1@demo.pl', 'demo2024')
    expect(user.email).toBe('rad1@demo.pl')
    expect(user.role).toBe('radiologist')
  })

  it('login fails with wrong password', async () => {
    await expect(apiClient.login('rad1@demo.pl', 'wrongpass')).rejects.toThrow('401')
  })

  it('getMedReports returns reports with proper shape', async () => {
    const { reports } = await apiClient.getMedReports()
    expect(reports.length).toBeGreaterThan(0)
    for (const r of reports) {
      expect(r.id).toBeTruthy()
      expect(r.patientId).toBeTruthy()
      expect(r.status).toMatch(/^(draft|approved)$/)
    }
  })
})
