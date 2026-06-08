// BE2: implement POST /api/ai/fuse-findings
// - Body: { findingsFromImages: Finding[], findingsFromSpeech: Finding[] }
// - Claude fusion layer prompt — compare two finding sets, return FusionResult
// - Do not assume conflict without clear evidence (probe angle/phase differences ≠ conflict)
export const maxDuration = 60

export async function POST() {
  return Response.json({ error: 'not implemented' }, { status: 501 })
}
