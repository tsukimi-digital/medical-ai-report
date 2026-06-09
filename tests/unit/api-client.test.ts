import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../../lib/api-client'

// ---------------------------------------------------------------------------
// Fetch mock — api-client uses real fetch against /api/* routes; in jsdom
// there is no running server, so we intercept at the fetch layer.
// ---------------------------------------------------------------------------

const PATIENTS = [
  { id: 'p-anna',   firstName: 'Anna',   lastName: 'Kowalska',   pesel: '74050512388', gender: 'F', dateOfBirth: '1974-05-05', age: 52 },
  { id: 'p-marek',  firstName: 'Marek',  lastName: 'Nowak',      pesel: '65021034177', gender: 'M', dateOfBirth: '1965-02-10', age: 61 },
  { id: 'p-tomasz', firstName: 'Tomasz', lastName: 'Wiśniewski', pesel: '81071245699', gender: 'M', dateOfBirth: '1981-07-12', age: 45 },
  { id: 'p-ewa',    firstName: 'Ewa',    lastName: 'Mazur',      pesel: '90031567422', gender: 'F', dateOfBirth: '1990-03-15', age: 36 },
]

const RAD_REPORTS = [
  { id: 'rad-A', caseKey: 'A', patientId: 'p-anna', examinationType: 'thyroid', status: 'draft',
    findings: [{ id: 'f1', text: 'Guzek lewego płata', confidence: 'high', aiGenerated: true }],
    classification: { name: 'ACR TI-RADS', value: 'TR4', label: 'Średnie ryzyko', points: 9 } },
]

const MED_REPORTS = [
  { id: 'med-C', patientId: 'p-anna', status: 'draft', role: 'doctor' },
]

const makeResponse = (data: unknown, status = 200): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(String(status)),
  }) as unknown as Response

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString()
  const method = (init?.method ?? 'GET').toUpperCase()
  const body = init?.body ? JSON.parse(init.body as string) : null

  if (url === '/api/patients' && method === 'GET')
    return Promise.resolve(makeResponse({ patients: PATIENTS }))

  if (url.startsWith('/api/patients/') && method === 'GET') {
    const id = url.split('/api/patients/')[1]
    const patient = PATIENTS.find(p => p.id === id)
    return patient
      ? Promise.resolve(makeResponse({ patient }))
      : Promise.resolve(makeResponse({ error: 'Not found' }, 404))
  }

  if (url === '/api/reports/radiological' && method === 'GET')
    return Promise.resolve(makeResponse({ reports: RAD_REPORTS }))

  if (url.startsWith('/api/reports/radiological/') && method === 'GET') {
    const id = url.split('/api/reports/radiological/')[1]
    const report = RAD_REPORTS.find(r => r.id === id)
    return report
      ? Promise.resolve(makeResponse({ report }))
      : Promise.resolve(makeResponse({ error: 'Not found' }, 404))
  }

  if (url === '/api/reports/medical' && method === 'GET')
    return Promise.resolve(makeResponse({ reports: MED_REPORTS }))

  if (url === '/api/auth/login' && method === 'POST') {
    if (body?.email === 'rad1@demo.pl' && body?.password === 'demo2024')
      return Promise.resolve(makeResponse({ user: { email: 'rad1@demo.pl', role: 'radiologist', id: 'u-rad1', name: 'dr Kowalski', initials: 'KK' } }))
    return Promise.resolve(makeResponse({ error: 'Invalid credentials' }, 401))
  }

  return Promise.resolve(makeResponse({ error: 'Not found' }, 404))
}

beforeAll(() => { vi.stubGlobal('fetch', mockFetch) })
afterAll(() => { vi.unstubAllGlobals() })

// ---------------------------------------------------------------------------

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
