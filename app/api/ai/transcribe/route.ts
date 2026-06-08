// BE2: implement POST /api/ai/transcribe
// - multipart/form-data: audio (File), language
// - Use lib/ai/whisper.ts — Whisper config + WHISPER_MEDICAL_PROMPT + filler removal
// - Return { transcription, transcriptionWarning? }
export const maxDuration = 60

export async function POST() {
  return Response.json({ error: 'not implemented' }, { status: 501 })
}
