// BE2: implement in-memory singleton store pre-seeded with 4 Golden Demo Cases (data from lib/data.jsx)
// Maps: users, patients, radiologicalReports, medicalReports
// See Design Spec section "In-Memory Store" for seed data requirements
//
// This file is a TYPED STUB for BE1 to compile against.
// BE2 (Akira Yamamoto) will replace the implementation bodies.

import type {
  Patient,
  PatientInput,
  RadiologicalReport,
  MedicalReport,
} from './types'

export interface Store {
  // Patients
  getAllPatients(): Patient[]
  getPatient(id: string): Patient | undefined
  createPatient(input: PatientInput): Patient

  // Radiological reports
  getAllRadiologyReports(): RadiologicalReport[]
  getRadiologyReport(id: string): RadiologicalReport | undefined
  createRadiologyReport(input: Record<string, unknown>): RadiologicalReport
  updateRadiologyReport(id: string, updates: Partial<RadiologicalReport>): RadiologicalReport
  approveRadiologyReport(id: string, userId: string, userName: string): RadiologicalReport

  // Medical reports
  getAllMedicalReports(): MedicalReport[]
  getMedicalReport(id: string): MedicalReport | undefined
  createMedicalReport(input: Record<string, unknown>): MedicalReport
  updateMedicalReport(id: string, updates: Partial<MedicalReport>): MedicalReport
  approveMedicalReport(id: string, userId: string): MedicalReport
}

// Placeholder singleton — BE2 will replace this with a real implementation
export const store: Store = {
  getAllPatients: () => { throw new Error('BE2: store not implemented yet') },
  getPatient: () => { throw new Error('BE2: store not implemented yet') },
  createPatient: () => { throw new Error('BE2: store not implemented yet') },

  getAllRadiologyReports: () => { throw new Error('BE2: store not implemented yet') },
  getRadiologyReport: () => { throw new Error('BE2: store not implemented yet') },
  createRadiologyReport: () => { throw new Error('BE2: store not implemented yet') },
  updateRadiologyReport: () => { throw new Error('BE2: store not implemented yet') },
  approveRadiologyReport: () => { throw new Error('BE2: store not implemented yet') },

  getAllMedicalReports: () => { throw new Error('BE2: store not implemented yet') },
  getMedicalReport: () => { throw new Error('BE2: store not implemented yet') },
  createMedicalReport: () => { throw new Error('BE2: store not implemented yet') },
  updateMedicalReport: () => { throw new Error('BE2: store not implemented yet') },
  approveMedicalReport: () => { throw new Error('BE2: store not implemented yet') },
}
