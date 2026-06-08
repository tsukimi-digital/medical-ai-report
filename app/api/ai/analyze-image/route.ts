// BE2: implement POST /api/ai/analyze-image
// - multipart/form-data: images(1-5 files), examinationType, clinicalIndication, examinationContext(JSON), comments, patientAge, patientGender, language
// - Preprocess images with lib/ai/image-preprocessor.ts
// - Check AI_PIPELINE_ADVANCED env var → two-step or advanced pipeline (lib/ai/claude.ts)
// - Return ImageAnalysisResult (see lib/types.ts)
export const maxDuration = 60

export async function POST() {
  return Response.json({ error: 'not implemented' }, { status: 501 })
}
