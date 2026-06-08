// BE2: implement POST /api/ai/generate-report
// - Body: { transcription, role, examinationType?, examinationContext?, patientAge, patientGender, language, radiologicalReportId? }
// - role='radiologist' → RadiologyReportDraft; role='doctor' → MedicalReportDraft + PatientExplanation
// - Use lib/ai/claude.ts with role-specific prompts + lib/ai/examTypePrompts.ts for Warstwa 2
export const maxDuration = 60

export async function POST() {
  return Response.json({ error: 'not implemented' }, { status: 501 })
}
