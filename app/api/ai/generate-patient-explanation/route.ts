// BE2: implement POST /api/ai/generate-patient-explanation
// - Body: { reportId, reportType: 'radiological'|'medical', transcription? }
// - Load report from lib/store.ts, generate PatientExplanation via Claude
// - Rules: no new medical facts, no Latin, preserve uncertainty, sections: found/means/next
// - Save PatientExplanation back to report in store
export const maxDuration = 60

export async function POST() {
  return Response.json({ error: 'not implemented' }, { status: 501 })
}
