import OpenAI from 'openai'

// Lazy initialization — defer client creation to request time so next build passes without env vars
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

/**
 * ~224 tokens of Polish medical terminology priming for Whisper.
 * Provides phonetic anchoring for USG terminology, drug names, acronyms, and Latin.
 */
export const WHISPER_MEDICAL_PROMPT = `Terminologia medyczna po polsku.
Transkrybuj dokładnie, zachowując wahania (eee, hmm) i korekty (nie, przepraszam, prawa).
Zachowaj liczby i jednostki: milimetrów, mm, cm, mIU/L, U/L, mg/dL, mmHg.
Terminy USG: echogeniczność, hipoechogeniczny, hiperechogeniczny, izoechogeniczny, anechogeniczny,
torbiel, guzek, zmiana ogniskowa, zwapnienia, mikrozwapnienia, unaczynienie, przepływ Dopplera,
wodonercze, kamica, polip, miąższ, drogi żółciowe, przewód trzustkowy, żyła wrotna.
Narządy: wątroba, trzustka, śledziona, nerki, pęcherzyk żółciowy, tarczyca, gruczoł krokowy,
macica, jajniki, przydatki, cieśń tarczycy.
Klasyfikacje: TI-RADS, BI-RADS, Bosniak, O-RADS, NASCET, SFU.
Leki: Metoprolol, Amlodypina, Pantoprazol, Atorwastatyna, Lisinopril, Bisoprolol, Omeprazol.
Skróty: USG, CRP, TSH, fT4, BMI, PSV, EDV, RI, IMT, CBD, UKM, BAC.
Łacina: in situ, per os, status post, per rectum.
Liczby: jeden, dwa, trzy, cztery, pięć, sześć, siedem, osiem, dziewięć, dziesięć milimetrów centymetrów.`

/**
 * Strip common Polish speech fillers from transcription.
 */
function stripFillers(text: string): string {
  return text
    .replace(/\b(eee+|yyy+|mmm+|yyy|hmm+|yyy+|no więc|więc tak|powiedzmy)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Auto-correct common Whisper PL errors (phonetically similar misrecognitions).
 */
function autoCorrectWhisperErrors(text: string): string {
  const corrections: [RegExp, string][] = [
    [/\bmeta\s*prolol\b/gi, 'Metoprolol'],
    [/\bamlodypina\b/gi, 'Amlodypina'],
    [/\bpantoprazol\b/gi, 'Pantoprazol'],
    [/\btajrads\b/gi, 'TI-RADS'],
    [/\bti\s*rads\b/gi, 'TI-RADS'],
    [/\bbi\s*rads\b/gi, 'BI-RADS'],
    [/\bo\s*rads\b/gi, 'O-RADS'],
    [/\bnascet\b/gi, 'NASCET'],
    [/\bbosniak\b/gi, 'Bosniak'],
    [/\bechogenicznosc\b/gi, 'echogeniczność'],
    [/\bhipo\s*echo\b/gi, 'hipoecho'],
    [/\bhiper\s*echo\b/gi, 'hiperecho'],
  ]

  let result = text
  for (const [pattern, replacement] of corrections) {
    result = result.replace(pattern, replacement)
  }
  return result
}

export interface TranscribeResult {
  transcription: string
  transcriptionWarning?: string
}

/**
 * Transcribes audio using OpenAI Whisper with Polish medical priming.
 * - model: whisper-1, language: pl, response_format: verbose_json
 * - Segments with avg_logprob < -0.8 → transcriptionWarning
 * - transcription < 200 chars → transcriptionWarning
 */
export async function transcribeAudio(
  audioBlob: Buffer,
  mimeType: string
): Promise<TranscribeResult> {
  const extension = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm'
  const filename = `recording.${extension}`

  // Copy Buffer into a plain ArrayBuffer to satisfy strict TypeScript BlobPart types
  const arrayBuffer = audioBlob.buffer.slice(audioBlob.byteOffset, audioBlob.byteOffset + audioBlob.byteLength) as ArrayBuffer
  const file = new File([arrayBuffer], filename, { type: mimeType })

  const result = await getOpenAI().audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'pl',
    response_format: 'verbose_json',
    temperature: 0,
    prompt: WHISPER_MEDICAL_PROMPT,
  })

  // Check for low-confidence segments
  let hasLowConfidenceSegments = false
  if (result.segments) {
    hasLowConfidenceSegments = result.segments.some(
      (seg: { avg_logprob?: number }) => typeof seg.avg_logprob === 'number' && seg.avg_logprob < -0.8
    )
  }

  // Post-process transcription
  let transcription = result.text
  transcription = stripFillers(transcription)
  transcription = autoCorrectWhisperErrors(transcription)

  // Determine warning
  let transcriptionWarning: string | undefined
  if (transcription.length < 200) {
    transcriptionWarning = 'Nagranie może być zbyt krótkie — sprawdź czy nagranie jest kompletne.'
  } else if (hasLowConfidenceSegments) {
    transcriptionWarning = 'Niektóre fragmenty transkrypcji mają niską pewność — sprawdź przed wygenerowaniem raportu.'
  }

  return { transcription, transcriptionWarning }
}
