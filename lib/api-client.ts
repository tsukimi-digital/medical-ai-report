/**
 * Sonara — Real API Client
 * Typed fetch functions matching all endpoints in docs/api-contract.md.
 * Auth is cookie-based (iron-session) — no tokens managed here.
 */

import type {
  User,
  Patient,
  PatientInput,
  RadiologicalReport,
  RadiologyReportInput,
  RadiologyReportDraft,
  MedicalReport,
  MedicalReportInput,
  MedicalReportDraft,
  ImageAnalysisResult,
  ExaminationContext,
  FusionResult,
  PatientExplanation,
  Finding,
} from './types'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || String(res.status))
  }
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authClient = {
  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    return handleResponse<{ user: User }>(res)
  },

  async logout(): Promise<void> {
    const res = await fetch('/api/auth/logout', { method: 'POST' })
    if (!res.ok) throw new Error(await res.text())
  },

  async me(): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me')
    return handleResponse<{ user: User }>(res)
  },
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patientsClient = {
  async getPatients(): Promise<{ patients: Patient[] }> {
    const res = await fetch('/api/patients')
    return handleResponse<{ patients: Patient[] }>(res)
  },

  async getPatient(id: string): Promise<{ patient: Patient }> {
    const res = await fetch(`/api/patients/${id}`)
    return handleResponse<{ patient: Patient }>(res)
  },

  async createPatient(data: PatientInput): Promise<{ patient: Patient }> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<{ patient: Patient }>(res)
  },
}

// ---------------------------------------------------------------------------
// Radiological Reports
// ---------------------------------------------------------------------------

export const radReportsClient = {
  async getReports(patientId?: string): Promise<{ reports: RadiologicalReport[] }> {
    const url = patientId
      ? `/api/reports/radiological?patientId=${encodeURIComponent(patientId)}`
      : '/api/reports/radiological'
    const res = await fetch(url)
    return handleResponse<{ reports: RadiologicalReport[] }>(res)
  },

  async getReport(id: string): Promise<{ report: RadiologicalReport }> {
    const res = await fetch(`/api/reports/radiological/${id}`)
    return handleResponse<{ report: RadiologicalReport }>(res)
  },

  async createReport(data: RadiologyReportInput): Promise<{ report: RadiologicalReport }> {
    const res = await fetch('/api/reports/radiological', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<{ report: RadiologicalReport }>(res)
  },

  async updateReport(id: string, data: Partial<RadiologicalReport>): Promise<{ report: RadiologicalReport }> {
    const res = await fetch(`/api/reports/radiological/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<{ report: RadiologicalReport }>(res)
  },

  async approveReport(id: string): Promise<{ report: RadiologicalReport }> {
    const res = await fetch(`/api/reports/radiological/${id}/approve`, {
      method: 'PATCH',
    })
    return handleResponse<{ report: RadiologicalReport }>(res)
  },
}

// ---------------------------------------------------------------------------
// Medical Reports
// ---------------------------------------------------------------------------

export const medReportsClient = {
  async getReports(patientId?: string): Promise<{ reports: MedicalReport[] }> {
    const url = patientId
      ? `/api/reports/medical?patientId=${encodeURIComponent(patientId)}`
      : '/api/reports/medical'
    const res = await fetch(url)
    return handleResponse<{ reports: MedicalReport[] }>(res)
  },

  async getReport(id: string): Promise<{ report: MedicalReport }> {
    const res = await fetch(`/api/reports/medical/${id}`)
    return handleResponse<{ report: MedicalReport }>(res)
  },

  async createReport(data: MedicalReportInput): Promise<{ report: MedicalReport }> {
    const res = await fetch('/api/reports/medical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<{ report: MedicalReport }>(res)
  },

  async updateReport(id: string, data: Partial<MedicalReport>): Promise<{ report: MedicalReport }> {
    const res = await fetch(`/api/reports/medical/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<{ report: MedicalReport }>(res)
  },

  async approveReport(id: string): Promise<{ report: MedicalReport }> {
    const res = await fetch(`/api/reports/medical/${id}/approve`, {
      method: 'PATCH',
    })
    return handleResponse<{ report: MedicalReport }>(res)
  },
}

// ---------------------------------------------------------------------------
// AI
// ---------------------------------------------------------------------------

export const aiClient = {
  /**
   * Analyze USG images. Accepts a pre-built FormData (caller appends 'images' + metadata).
   * Do NOT set Content-Type header — browser sets it with the correct multipart boundary.
   */
  async analyzeImage(formData: FormData): Promise<ImageAnalysisResult> {
    const res = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      body: formData,
    })
    return handleResponse<ImageAnalysisResult>(res)
  },

  /**
   * Transcribe audio via Whisper.
   * Builds FormData internally from the Blob.
   */
  async transcribeAudio(blob: Blob, lang: string): Promise<{ transcription: string; transcriptionWarning?: string }> {
    const fd = new FormData()
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
    fd.append('audio', blob, `recording.${ext}`)
    fd.append('language', lang)
    const res = await fetch('/api/ai/transcribe', { method: 'POST', body: fd })
    return handleResponse<{ transcription: string; transcriptionWarning?: string }>(res)
  },

  /** Legacy alias used in some pages — delegates to transcribeAudio */
  async transcribe(audio: Blob, language: 'pl' | 'en'): Promise<{ transcription: string; transcriptionWarning?: string }> {
    return aiClient.transcribeAudio(audio, language)
  },

  async generateReport(params: {
    transcription: string
    role: 'radiologist' | 'doctor'
    examinationType?: string
    examinationContext?: ExaminationContext
    patientAge: number
    patientGender: 'M' | 'F'
    language: 'pl' | 'en'
    radiologicalReportId?: string
  }): Promise<RadiologyReportDraft | MedicalReportDraft> {
    const res = await fetch('/api/ai/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return handleResponse<RadiologyReportDraft | MedicalReportDraft>(res)
  },

  async fuseFindings(data: {
    findingsFromImages: Finding[]
    findingsFromSpeech: Finding[]
  }): Promise<FusionResult> {
    const res = await fetch('/api/ai/fuse-findings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<FusionResult>(res)
  },

  async generatePatientExplanation(params: {
    reportId: string
    reportType: 'radiological' | 'medical'
    transcription?: string
  }): Promise<PatientExplanation> {
    const res = await fetch('/api/ai/generate-patient-explanation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    return handleResponse<PatientExplanation>(res)
  },
}

// ---------------------------------------------------------------------------
// Session helpers (cookie-based auth — no localStorage needed)
// These are no-ops / thin wrappers kept for interface compatibility.
// ---------------------------------------------------------------------------

let _sessionUser: User | null = null

export function getSessionUser(): User | null {
  return _sessionUser
}

export function setSessionUser(u: User | null): void {
  _sessionUser = u
}

// ---------------------------------------------------------------------------
// Convenience export (combined apiClient)
// ---------------------------------------------------------------------------

export const apiClient = {
  // auth
  login: authClient.login.bind(authClient),
  logout: authClient.logout.bind(authClient),
  me: authClient.me.bind(authClient),

  // patients
  getPatients: patientsClient.getPatients.bind(patientsClient),
  getPatient: patientsClient.getPatient.bind(patientsClient),
  createPatient: patientsClient.createPatient.bind(patientsClient),

  // radiological reports
  getRadReports: radReportsClient.getReports.bind(radReportsClient),
  getRadReport: radReportsClient.getReport.bind(radReportsClient),
  createRadReport: radReportsClient.createReport.bind(radReportsClient),
  updateRadReport: radReportsClient.updateReport.bind(radReportsClient),
  approveRadReport: radReportsClient.approveReport.bind(radReportsClient),

  // medical reports
  getMedReports: medReportsClient.getReports.bind(medReportsClient),
  getMedReport: medReportsClient.getReport.bind(medReportsClient),
  createMedReport: medReportsClient.createReport.bind(medReportsClient),
  updateMedReport: medReportsClient.updateReport.bind(medReportsClient),
  approveMedReport: medReportsClient.approveReport.bind(medReportsClient),

  // ai
  analyzeImage: aiClient.analyzeImage.bind(aiClient),
  transcribe: aiClient.transcribe.bind(aiClient),
  transcribeAudio: aiClient.transcribeAudio.bind(aiClient),
  generateReport: aiClient.generateReport.bind(aiClient),
  fuseFindings: aiClient.fuseFindings.bind(aiClient),
  generatePatientExplanation: aiClient.generatePatientExplanation.bind(aiClient),

  // session helpers
  getSessionUser,
  setSessionUser,
}

export default apiClient
