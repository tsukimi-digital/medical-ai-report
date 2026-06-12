import Anthropic from '@anthropic-ai/sdk'
import type {
  ImageAnalysisResult,
  RadiologyReportDraft,
  MedicalReportDraft,
  ExaminationContext,
  AiQualityCheck,
  Finding,
  FusionResult,
  PatientExplanation,
  RadiologicalReport,
  MedicalReport,
} from '../types'
import { buildAnalyzeImageSystemPrompt, buildGenerateReportSystemPrompt } from './examTypePrompts'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const ADVANCED = process.env.AI_PIPELINE_ADVANCED === 'true'

// Opus 4.8 API compat:
// - thinking: {type:'enabled', budget_tokens:N} is REMOVED on Opus 4.8/4.7 (400 error).
//   The only on-mode is {type:'adaptive'} — the model decides how much to think.
//   Omitting the `thinking` field = thinking disabled (used when useThinking is false).
// - Sampling params (temperature, top_p, top_k) are REMOVED on Opus 4.8/4.7 (400 error
//   on any use) — do NOT add `temperature` to any call in this file.
// SDK 0.27 types don't know `thinking: {type:'adaptive'}` — existing any/as casts cover it.

// Helper: create a system block with prompt caching.
// cache_control is not in SDK 0.27 types but is accepted by the API — cast via unknown.
function cachedTextBlock(text: string): Anthropic.TextBlockParam {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { type: 'text', text, cache_control: { type: 'ephemeral' } } as unknown as Anthropic.TextBlockParam
}

// ============================================================================
// Warstwa 1 — cached base system prompts
// ============================================================================

const SYSTEM_LAYER1_ANALYZE_IMAGE = `Jesteś ekspertem AI w analizie obrazów ultrasonograficznych.

KRYTERIA CONFIDENCE (stosuj te definicje — nie progi procentowe):
- "high":   struktura wyraźnie widoczna, granice ostre, brak alternatywnej interpretacji
- "medium": struktura widoczna, ale granice nieostre LUB inna interpretacja jest możliwa
- "low":    struktura wnioskowana z kontekstu, częściowo zasłonięta lub poza kadrem

OCENA JAKOŚCI OBRAZU (wykonaj jako PIERWSZĄ czynność):
- "diagnostic":     obraz wystarczający do wiarygodnej interpretacji
- "suboptimal":     używalny, ale z ograniczeniami
- "non_diagnostic": obrazu nie można wiarygodnie zinterpretować

ZAKAZY BEZWZGLĘDNE:
- Nie wnioskuj o znaleziskach niewidocznych bezpośrednio na obrazie
- Nie przypisuj "high" na podstawie typowej anatomii — tylko na podstawie tego co WIDAĆ
- Nie dodawaj zaleceń klinicznych ani diagnoz — opisuj wyłącznie widoczne struktury
- Nie podawaj wymiarów jeśli nie widzisz skali na obrazie
- Niewidoczne struktury z checklisty → imagingLimitations, nigdy findings[]
- Zalecenia kliniczne (BAC, kontrola, konsultacja) → impression, nigdy findings[]

REGUŁY CONFIDENCE ROUTING:
- Nie przedstawiaj finding z confidence "low" jako pewnego rozpoznania
- Finding z confidence "low" trafia do lowConfidenceFindings[] lub imagingLimitations
- Impression może zawierać wyłącznie findings z confidence "high" lub "medium"

Gdy imageQuality = "non_diagnostic": zwróć pustą tablicę findings[].

Dla każdego finding podaj imageIndexes (tablica indeksów obrazów 0-based, na których widoczne).

Zwróć wyłącznie poprawny JSON:
{
  "imageQuality": "diagnostic" | "suboptimal" | "non_diagnostic",
  "qualityIssues": string[],
  "findings": [{
    "text": string,
    "isDeviation": boolean,
    "confidence": "high" | "medium" | "low",
    "anatomicalLocation": string,
    "evidence": { "imageIndexes": number[] }
  }],
  "lowConfidenceFindings": [{
    "text": string,
    "isDeviation": boolean,
    "confidence": "low",
    "anatomicalLocation": string,
    "evidence": { "imageIndexes": number[] }
  }],
  "impression": string,
  "imagingLimitations": string | null
}`

const SYSTEM_LAYER1_GENERATE_REPORT_RADIOLOGIST = `Jesteś asystentem transkrypcji radiologicznej.

KRYTERIA CONFIDENCE DLA GŁOSU:
- "high":   radiolog stwierdził wyraźnie i bez wahania
- "medium": radiolog wyraził niepewność ("chyba", "wydaje się", "możliwe że") lub się poprawił
- "low":    wypowiedź niejasna, urwana lub znaczenie wieloznaczne

ZAKAZY BEZWZGLĘDNE:
- Nie dodawaj żadnego znaleziska niepodanego w transkrypcji
- Nie uzupełniaj urwanych stwierdzeń
- Zachowaj kolejność znalezisk z dyktowania
- Zalecenia kliniczne (BAC, kontrola, konsultacja) → impression, nigdy findings[]
- Liczby bez jednostek i nazwy narządów → confidence "low", odnotuj w transcriptionIssues

OBSŁUGA ZNIEKSZTAŁCEŃ WHISPER:
- Terminy fonetycznie bliskie terminologii medycznej → popraw i odnotuj w transcriptionIssues
- Korekty radiologa w locie ("nerka lewa, nie, prawa") → użyj ostatniej wersji, confidence "medium"
- Liczby: "pięć milimetrów" → "5 mm", "trzy centymetry" → "3 cm"
- Klasyfikacje formalne (TIRADS 4, BIRADS 3) → zachowaj dosłownie z dyktowania

Dla każdego finding podaj transcriptFragments (cytaty verbatim z transkrypcji).

Zwróć wyłącznie poprawny JSON:
{
  "findings": [{
    "text": string,
    "isDeviation": boolean,
    "confidence": "high" | "medium" | "low",
    "anatomicalLocation": string,
    "evidence": { "transcriptFragments": string[] }
  }],
  "impression": string,
  "transcriptionIssues": string[]
}`

const SYSTEM_LAYER1_GENERATE_REPORT_DOCTOR = `Jesteś asystentem dokumentacji klinicznej.

REGUŁY:
- Transkrypcja to nagranie całej wizyty — lekarz i pacjent mówią naprzemiennie
- Ignoruj powitania, pożegnania, przerywniki niemedyczne ("eee", "yyyy", "właśnie")
- Lekarz dyktuje wyniki badania fizykalnego w 3. osobie — to NIE jest wywiad pacjenta
- NIE dodawaj informacji których nie ma w transkrypcji

OBSŁUGA NIEPEWNOŚCI:
- "prawdopodobnie", "wygląda na", "podejrzewam" → prefiks "Prawdopodobnie:" w diagnosis
- "może być X albo Y", "różnicowo" → format "Różnicowo: X / Y" w diagnosis
- "do wykluczenia" → prefiks "Do wykluczenia:" w diagnosis
- Elementy niejasne → [WYMAGA WERYFIKACJI] w polu + dodaj do uncertainItems

Zwróć wyłącznie poprawny JSON:
{
  "anamnesis": string,
  "diagnosis": string,
  "diagnosisConfidence": "definitive" | "probable" | "differential" | "possible",
  "recommendations": string,
  "uncertainItems": string[]
}`

// ============================================================================
// Helper: parse JSON from Claude response
// ============================================================================
function parseJSON<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}

function getTextContent(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')
}

// ============================================================================
// Build runtime context (Warstwa 3) for analyze-image
// ============================================================================
function buildAnalyzeImageUserMessage(params: {
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  comments?: string
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  imageCount: number
}): string {
  const ctx = params.examinationContext ?? {}
  const lines: string[] = [
    '### DANE KLINICZNE',
    `Typ badania: ${params.examinationType}`,
    `Pacjent: ${params.patientGender === 'F' ? 'kobieta' : 'mężczyzna'}, ${params.patientAge} lat`,
  ]
  if (ctx.fastingStatus) lines.push(`Status na czczo: ${ctx.fastingStatus === 'fasting' ? 'tak (>6h)' : 'nie'}`)
  if (ctx.menstrualCyclePhase) lines.push(`Faza cyklu: ${ctx.menstrualCyclePhase}`)
  if (ctx.relevantLabValues?.length) {
    lines.push(`Wartości lab: ${ctx.relevantLabValues.map(l => `${l.label}: ${l.value} ${l.unit}`).join(', ')}`)
  }
  if (ctx.priorSurgery) lines.push(`Poprzednie zabiegi: ${ctx.priorSurgery}`)
  if (params.clinicalIndication) lines.push(`Wskazanie kliniczne: ${params.clinicalIndication}`)
  lines.push('')
  lines.push('### KOMENTARZ RADIOLOGA (przed analizą)')
  lines.push(params.comments || '[brak komentarzy]')
  lines.push('')
  lines.push(`### ZADANIE`)
  lines.push('Przeanalizuj obrazy łącznie.')
  if (params.imageCount > 1) {
    lines.push('Sprzeczności między obrazami: opisz oba warianty jako oddzielne findings (oba confidence low) z numerami obrazów. W impression wyjaśnij sprzeczność.')
  }
  lines.push('Findings oznacz numerem obrazu-źródła gdy więcej niż 1.')
  lines.push('Zwróć JSON. Bez tekstu poza JSON.')
  lines.push(`Język raportu: ${params.language}`)
  return lines.join('\n')
}

// ============================================================================
// ANALYZE IMAGE — Two-Step Pipeline (AI_PIPELINE_ADVANCED=false)
// ============================================================================
async function analyzeImagesTwoStep(params: {
  images: Array<{ data: Buffer; mimeType: 'image/jpeg' }>
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  comments?: string
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  imageQualityHint?: 'diagnostic' | 'suboptimal' | 'non_diagnostic'
}): Promise<ImageAnalysisResult> {
  // non_diagnostic is intentionally excluded: when the image is unreadable,
  // the user is routed to manual entry mode — extended thinking would waste budget with no benefit.
  const useThinking = params.images.length >= 3 || params.imageQualityHint === 'suboptimal'
  const imageCount = params.images.length

  const imageContent: Anthropic.ImageBlockParam[] = params.images.map(img => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mimeType,
      data: img.data.toString('base64'),
    },
  }))

  const examLayer2 = buildAnalyzeImageSystemPrompt(params.examinationType, params.patientGender)

  // ---- Step 1: Vision Extraction ----
  const systemBlocks = [
    cachedTextBlock(SYSTEM_LAYER1_ANALYZE_IMAGE),
    cachedTextBlock(examLayer2),
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractionParams: any = {
    model: 'claude-opus-4-8',
    max_tokens: useThinking ? 10000 : 1500,
    system: systemBlocks,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Typ badania: ${params.examinationType}
Wskazanie kliniczne: ${params.clinicalIndication || 'brak'}
Wiek pacjenta: ${params.patientAge} lat, płeć: ${params.patientGender === 'M' ? 'mężczyzna' : 'kobieta'}
${params.comments ? `Uwagi lekarza: ${params.comments}` : ''}

Wyodrębnij surowe obserwacje z obrazów. Lista punktowana, technicznie, bez interpretacji klinicznej. Po angielsku.`,
          },
        ],
      },
    ],
  }

  if (useThinking) {
    // Adaptive thinking (Opus 4.8) — no budget_tokens; thinking tokens count toward max_tokens.
    extractionParams.thinking = { type: 'adaptive' }
  }

  const extractionResponse = await client.messages.create(extractionParams) as Anthropic.Message

  const rawObservations = getTextContent(extractionResponse.content)
    .split('\n')
    .filter(l => l.trim().length > 0)

  // ---- Step 2: Report Generation ----
  const reportResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: systemBlocks,
    messages: [
      {
        role: 'user',
        content: buildAnalyzeImageUserMessage({ ...params, imageCount }) +
          `\n\nSurowe obserwacje z etapu 1:\n${rawObservations.join('\n')}\n\nNa podstawie powyższych obserwacji wygeneruj pełny ustrukturyzowany raport JSON.`,
      },
    ],
  } as Parameters<typeof client.messages.create>[0]) as Anthropic.Message

  const text = getTextContent(reportResponse.content)
  let parsed = parseJSON<Partial<ImageAnalysisResult>>(text)

  // Retry on parse failure
  if (!parsed) {
    const retryResponse = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: 'Your previous response was not valid JSON. Return ONLY the JSON object:\n' +
            buildAnalyzeImageUserMessage({ ...params, imageCount }),
        },
      ],
    })
    const retryText = getTextContent(retryResponse.content)
    parsed = parseJSON<Partial<ImageAnalysisResult>>(retryText)
  }

  return {
    imageQuality: parsed?.imageQuality ?? 'suboptimal',
    qualityIssues: parsed?.qualityIssues ?? [],
    findings: parsed?.findings ?? [],
    lowConfidenceFindings: parsed?.lowConfidenceFindings ?? [],
    impression: parsed?.impression,
    imagingLimitations: parsed?.imagingLimitations,
    rawObservations,
  }
}

// ============================================================================
// ANALYZE IMAGE — Advanced Pipeline (AI_PIPELINE_ADVANCED=true)
// SIR → Multi-Step (A–E) → AI Reviewer
// ============================================================================
async function analyzeImagesAdvanced(params: {
  images: Array<{ data: Buffer; mimeType: 'image/jpeg' }>
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  comments?: string
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  imageQualityHint?: 'diagnostic' | 'suboptimal' | 'non_diagnostic'
}): Promise<ImageAnalysisResult> {
  // non_diagnostic is intentionally excluded: when the image is unreadable,
  // the user is routed to manual entry mode — extended thinking would waste budget with no benefit.
  const useThinking = params.images.length >= 3 || params.imageQualityHint === 'suboptimal'
  const examLayer2 = buildAnalyzeImageSystemPrompt(params.examinationType, params.patientGender)

  const imageContent: Anthropic.ImageBlockParam[] = params.images.map(img => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.mimeType,
      data: img.data.toString('base64'),
    },
  }))

  // ---- Etap 1: SIR — Structured Image Reading ----
  const advSystemBlocks = [
    cachedTextBlock(SYSTEM_LAYER1_ANALYZE_IMAGE),
    cachedTextBlock(examLayer2),
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sirParams: any = {
    model: 'claude-opus-4-8',
    max_tokens: useThinking ? 10000 : 1500,
    system: advSystemBlocks,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Typ badania: ${params.examinationType}

Opisz wyłącznie to co WIDZISZ na obrazach. Nie interpretuj, nie klasyfikuj, nie generuj raportu.
Zwróć JSON z opisem każdej widocznej struktury: widoczność (true/false), wymiary jeśli skala widoczna, echogeniczność (homogeneous/heterogeneous/hypoechoic/hyperechoic/isoechoic/anechoic), marginesy (smooth/irregular/ill-defined), obecność zmian (none/cyst/nodule/mass/calcification/other).

Format: { "structures": { "struktura": { "visible": boolean, "description": string, "dimensions": string|null, "echotexture": string, "findings": string[] } } }`,
          },
        ],
      },
    ],
  }
  if (useThinking) {
    // Adaptive thinking (Opus 4.8) — no budget_tokens; thinking tokens count toward max_tokens.
    sirParams.thinking = { type: 'adaptive' }
  }

  const sirResponse = await client.messages.create(sirParams)
  const sirText = getTextContent(sirResponse.content)
  const sirData = parseJSON<Record<string, unknown>>(sirText) ?? {}

  // ---- Etap 2A: Anatomy Detection ----
  const anatomyResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: advSystemBlocks,
    messages: [{
      role: 'user',
      content: `Na podstawie SIR, zidentyfikuj wszystkie widoczne struktury anatomiczne.
SIR: ${JSON.stringify(sirData)}
Typ badania: ${params.examinationType}

JSON: { "identifiedStructures": string[], "missingStructures": string[] }`,
    }],
  } as Parameters<typeof client.messages.create>[0]) as Anthropic.Message
  const anatomyText = getTextContent(anatomyResponse.content)
  const anatomy = parseJSON<{ identifiedStructures: string[]; missingStructures: string[] }>(anatomyText)

  // ---- Etap 2B: Observation Extraction — extract all observable features per structure ----
  const obsParams = {
    model: 'claude-opus-4-8' as const,
    max_tokens: 1500,
    system: advSystemBlocks,
    messages: [
      {
        role: 'user' as const,
        content: `Based on the ultrasound images and this anatomy context:
${JSON.stringify(anatomy)}

Extract ALL observable features for each identified structure:
- Echogenicity (normal/hypo/hyper/iso/anechoic)
- Size in mm (if measurable)
- Margins (sharp/irregular/lobulated)
- Internal structure (homogeneous/heterogeneous/cystic/solid)
- Vascularity if Doppler visible
- Any calcifications, nodules, or focal lesions

Return JSON: { "observations": { "<structure>": { "echogenicity": string, "size_mm": number|null, "margins": string, "texture": string, "vascularity": string|null, "focal_lesions": string|null } } }`,
      }
    ]
  }
  const obsResponse = await client.messages.create(obsParams) as Anthropic.Message
  const obsText = obsResponse.content.find(b => b.type === 'text')?.text ?? '{}'
  let observations: Record<string, unknown> = {}
  try { observations = JSON.parse(obsText.match(/\{[\s\S]*\}/)?.[0] ?? '{}') } catch { observations = {} }

  // ---- Etap 2C: Abnormality Detection ----
  const abnormalityResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: advSystemBlocks,
    messages: [{
      role: 'user',
      content: `Na podstawie SIR i zidentyfikowanych struktur, wykryj odchylenia od normy.
SIR: ${JSON.stringify(sirData)}
Zidentyfikowane struktury: ${JSON.stringify(anatomy)}
Obserwacje: ${JSON.stringify(observations)}

JSON: {
  "normalFindings": [{ "text": string, "anatomicalLocation": string, "evidence": { "imageIndexes": number[] } }],
  "abnormalFindings": [{ "text": string, "anatomicalLocation": string, "severity": "minor"|"moderate"|"major", "evidence": { "imageIndexes": number[] } }],
  "imageQuality": "diagnostic"|"suboptimal"|"non_diagnostic",
  "qualityIssues": string[]
}`,
    }],
  })
  const abnormalityText = getTextContent(abnormalityResponse.content)
  const abnormality = parseJSON<{
    normalFindings: Finding[]
    abnormalFindings: Array<Finding & { severity: string }>
    imageQuality: ImageAnalysisResult['imageQuality']
    qualityIssues: string[]
  }>(abnormalityText)

  // ---- Etap 2D: Classification — formal classification systems (TI-RADS, BI-RADS, etc.) ----
  const classParams = {
    model: 'claude-opus-4-8' as const,
    max_tokens: 1500,
    system: advSystemBlocks,
    messages: [
      {
        role: 'user' as const,
        content: `Based on the findings:
Anatomy: ${JSON.stringify(anatomy)}
Abnormalities: ${JSON.stringify(abnormality)}

Apply relevant formal classification systems for this examination type (${params.examinationType}):
- TI-RADS for thyroid nodules (if applicable)
- BI-RADS for breast (if applicable)
- Bosniak for renal cysts (if applicable)
- O-RADS for ovarian (if applicable)
- NASCET for carotid stenosis (if applicable)
- SFU for hydronephrosis (if applicable)

Return JSON: { "classifications": [{ "system": string, "value": string, "label": string, "score": number|null, "criteria": string[] }], "primaryClassification": string|null }`,
      }
    ]
  }
  const classResponse = await client.messages.create(classParams) as Anthropic.Message
  const classText = classResponse.content.find(b => b.type === 'text')?.text ?? '{}'
  let classifications: { classifications: Array<{system: string, value: string, label: string, score: number|null, criteria: string[]}>, primaryClassification: string|null } = { classifications: [], primaryClassification: null }
  try {
    const parsed = JSON.parse(classText.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
    classifications = parsed
  } catch { /* use default */ }

  // ---- Etap 2E: Report Generation ----
  const reportResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: advSystemBlocks,
    messages: [{
      role: 'user',
      content: `Wygeneruj finalny raport radiologiczny na podstawie analizy.
Typ badania: ${params.examinationType}
Pacjent: ${params.patientGender === 'F' ? 'kobieta' : 'mężczyzna'}, ${params.patientAge} lat
Wskazanie: ${params.clinicalIndication || 'brak'}
Język: ${params.language}

Znaleziska normalne: ${JSON.stringify(abnormality?.normalFindings ?? [])}
Znaleziska patologiczne: ${JSON.stringify(abnormality?.abnormalFindings ?? [])}
Obserwacje strukturalne: ${JSON.stringify(observations)}
Klasyfikacje formalne: ${JSON.stringify(classifications)}
Struktury niewidoczne: ${JSON.stringify(anatomy?.missingStructures ?? [])}

Zwróć JSON zgodny ze schematem ImageAnalysisResult (findings, lowConfidenceFindings, impression, imagingLimitations, aiSuggestions).
Pola: findings[], lowConfidenceFindings[], impression, imagingLimitations, aiSuggestions[]`,
    }],
  })

  const reportText = getTextContent(reportResponse.content)
  let reportResult = parseJSON<Partial<ImageAnalysisResult>>(reportText) ?? {}

  // ---- Etap 3: AI Reviewer ----
  const reviewResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Jesteś doświadczonym radiologiem weryfikującym draft raportu USG.
Sprawdź:
1. Completeness — czy wszystkie obowiązkowe struktury z checklisty zostały ocenione?
2. Consistency — czy wnioski (impression) logicznie wynikają ze znalezisk?
3. Classification — czy klasyfikacje (TI-RADS, BI-RADS etc.) są poprawnie uzasadnione?
4. Hallucinations — czy raport nie zawiera struktur/wymiarów niewidocznych na obrazach?

Typ badania: ${params.examinationType}
Draft: ${JSON.stringify(reportResult, null, 2)}

Odpowiedz JSON:
{
  "approved": boolean,
  "status": "ready" | "needs_attention" | "blocked",
  "summary": string,
  "checks": [{ "category": "image_quality"|"completeness"|"consistency"|"classification"|"source_evidence", "status": "pass"|"warning"|"fail", "message": string }],
  "corrections": string[],
  "autoCorrections": string[],
  "unresolvedItems": string[]
}`,
    }],
  })

  const reviewText = getTextContent(reviewResponse.content)
  const reviewResult = parseJSON<{
    approved?: boolean
    status: string
    summary: string
    checks: AiQualityCheck['checks']
    corrections?: string[]
    autoCorrections: string[]
    unresolvedItems: string[]
  }>(reviewText) ?? { approved: true, status: 'ready', summary: '', checks: [], corrections: [], autoCorrections: [], unresolvedItems: [] }

  const approved = reviewResult.approved ?? true

  // ---- Etap 3b: Apply corrections when reviewer did not approve ----
  if (!approved && (reviewResult.corrections?.length ?? 0) > 0) {
    const correctionParams = {
      model: 'claude-opus-4-8' as const,
      max_tokens: useThinking ? 10000 : 1500,
      // Adaptive thinking (Opus 4.8) — budget_tokens removed; omit thinking when disabled.
      ...(useThinking ? { thinking: { type: 'adaptive' as const } } : {}),
      system: advSystemBlocks,
      messages: [
        {
          role: 'user' as const,
          content: `The AI Quality Reviewer identified the following issues with this draft report:
${(reviewResult.corrections ?? []).map((c: string, i: number) => `${i+1}. ${c}`).join('\n')}

Original report:
${JSON.stringify(reportResult)}

Please produce a corrected version of the report addressing ALL identified issues.
Return the same JSON structure as the original report.`,
        }
      ]
    } as Parameters<typeof client.messages.create>[0]

    try {
      const correctionResponse = await client.messages.create(correctionParams) as Anthropic.Message
      const correctionText = correctionResponse.content.find(b => b.type === 'text')?.text ?? ''
      const corrected = parseJSON<Partial<ImageAnalysisResult>>(correctionText)
      if (corrected?.findings) {
        // Merge corrections into reportResult
        reportResult = { ...reportResult, ...corrected }
      }
    } catch { /* keep original if correction fails */ }
  }

  const aiQualityCheck: AiQualityCheck = {
    status: reviewResult.status as AiQualityCheck['status'] ?? 'ready',
    summary: reviewResult.summary ?? '',
    checks: reviewResult.checks ?? [],
    autoCorrections: reviewResult.corrections ?? reviewResult.autoCorrections ?? [],
    unresolvedItems: reviewResult.unresolvedItems ?? [],
  }

  return {
    imageQuality: abnormality?.imageQuality ?? reportResult.imageQuality ?? 'suboptimal',
    qualityIssues: abnormality?.qualityIssues ?? reportResult.qualityIssues ?? [],
    findings: reportResult.findings ?? [],
    lowConfidenceFindings: reportResult.lowConfidenceFindings ?? [],
    structuredFindings: { ...sirData, observations, classifications },
    impression: reportResult.impression,
    imagingLimitations: reportResult.imagingLimitations,
    aiSuggestions: reportResult.aiSuggestions,
    aiQualityCheck,
  }
}

// ============================================================================
// Public: analyzeImages
// ============================================================================
export async function analyzeImages(params: {
  images: Array<{ data: Buffer; mimeType: 'image/jpeg' }>
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  comments?: string
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  imageQualityHint?: 'diagnostic' | 'suboptimal' | 'non_diagnostic'
}): Promise<ImageAnalysisResult> {
  if (ADVANCED) {
    return analyzeImagesAdvanced(params)
  } else {
    return analyzeImagesTwoStep(params)
  }
}

// ============================================================================
// GENERATE REPORT — Radiologist (voice flow)
// ============================================================================
async function generateRadiologyReport(params: {
  transcription: string
  examinationType: string
  examinationContext?: ExaminationContext
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
}): Promise<RadiologyReportDraft> {
  const examLayer2 = buildGenerateReportSystemPrompt(params.examinationType)
  const ctx = params.examinationContext ?? {}

  const userMessage = [
    '### DANE KLINICZNE',
    `Typ badania: ${params.examinationType}`,
    `Pacjent: ${params.patientGender === 'F' ? 'kobieta' : 'mężczyzna'}, ${params.patientAge} lat`,
    ctx.menstrualCyclePhase ? `Faza cyklu: ${ctx.menstrualCyclePhase}` : '',
    ctx.fastingStatus ? `Status na czczo: ${ctx.fastingStatus}` : '',
    `Język raportu: ${params.language}`,
    '',
    '### TRANSKRYPCJA DYKTOWANIA RADIOLOGA',
    `"${params.transcription}"`,
  ].filter(l => l !== '').join('\n')

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: [cachedTextBlock(SYSTEM_LAYER1_GENERATE_REPORT_RADIOLOGIST), cachedTextBlock(examLayer2)],
    messages: [{ role: 'user', content: userMessage }],
  } as Parameters<typeof client.messages.create>[0]) as Anthropic.Message

  const text = getTextContent(response.content)
  const parsed = parseJSON<RadiologyReportDraft>(text)

  return parsed ?? { findings: [], impression: '', rawText: params.transcription }
}

// ============================================================================
// GENERATE REPORT — Doctor (voice flow)
// ============================================================================
async function generateMedicalReport(params: {
  transcription: string
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  radiologicalReport?: RadiologicalReport | null
}): Promise<MedicalReportDraft> {
  const userMessage = [
    `Pacjent: ${params.patientAge} lat, płeć: ${params.patientGender === 'F' ? 'K' : 'M'}`,
    `Język raportu: ${params.language}`,
    params.radiologicalReport
      ? `\nRaport radiologiczny USG (kontekst):\n---\n${params.radiologicalReport.rawText ?? JSON.stringify({ impression: params.radiologicalReport.impression, findings: params.radiologicalReport.findings })}\n---\nGdy lekarz odnosi się do wyników USG, uwzględnij to w sekcji diagnosis.`
      : '',
    '',
    'Transkrypcja wizyty:',
    `"${params.transcription}"`,
  ].filter(l => l !== '').join('\n')

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    system: [cachedTextBlock(SYSTEM_LAYER1_GENERATE_REPORT_DOCTOR)],
    messages: [{ role: 'user', content: userMessage }],
  } as Parameters<typeof client.messages.create>[0]) as Anthropic.Message

  const text = getTextContent(response.content)
  const parsed = parseJSON<Omit<MedicalReportDraft, 'patientExplanation'>>(text)

  if (!parsed) {
    return {
      anamnesis: '',
      diagnosis: '',
      diagnosisConfidence: 'possible',
      recommendations: '',
      uncertainItems: [],
    }
  }

  // Generate patient explanation in a second call
  const explanationResponse = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Napisz wyjaśnienie wyników badania dla pacjenta — językiem prostym, bez żargonu medycznego.
Nie sugeruj poważnej choroby bez podstaw. Nie używaj terminologii łacińskiej.
Zachowaj niepewność tam gdzie jest w raporcie. Oddziel: "co znaleziono" / "co to oznacza" / "co dalej".

Rozpoznanie: ${parsed.diagnosis}
Zalecenia: ${parsed.recommendations}

JSON: { "plainLanguageSummary": string, "keyFindings": string[], "nextSteps": string[], "followUp": string | null }`,
    }],
  })

  const explanationText = getTextContent(explanationResponse.content)
  const explanationParsed = parseJSON<Omit<PatientExplanation, 'sourceReportId' | 'generatedAt'>>(explanationText)

  const patientExplanation: PatientExplanation | undefined = explanationParsed
    ? {
        ...explanationParsed,
        sourceReportId: '', // will be set by caller after report creation
        generatedAt: new Date().toISOString(),
      }
    : undefined

  return {
    ...parsed,
    patientExplanation,
  }
}

// ============================================================================
// Public: generateReport
// ============================================================================
export async function generateReport(params: {
  transcription: string
  role: 'radiologist' | 'doctor'
  examinationType?: string
  examinationContext?: ExaminationContext
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  radiologicalReport?: RadiologicalReport | null
}): Promise<RadiologyReportDraft | MedicalReportDraft> {
  if (params.role === 'radiologist') {
    return generateRadiologyReport({
      transcription: params.transcription,
      examinationType: params.examinationType ?? 'USG jamy brzusznej',
      examinationContext: params.examinationContext,
      patientAge: params.patientAge,
      patientGender: params.patientGender,
      language: params.language,
    })
  } else {
    return generateMedicalReport({
      transcription: params.transcription,
      patientAge: params.patientAge,
      patientGender: params.patientGender,
      language: params.language,
      radiologicalReport: params.radiologicalReport ?? null,
    })
  }
}

// ============================================================================
// FUSE FINDINGS — Multimodal fusion layer
// ============================================================================
export async function fuseFindings(params: {
  findingsFromImages: Finding[]
  findingsFromSpeech: Finding[]
}): Promise<FusionResult> {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Masz wyniki dwóch niezależnych analiz tego samego badania USG:
- Analiza obrazów: lista findings z confidence i lokalizacją
- Analiza dyktowania radiologa: lista findings z confidence i lokalizacją

Porównaj oba zestawy. Nie zakładaj sprzeczności bez wyraźnych dowodów — wiele pozornych różnic wynika z ujęcia głowicy lub fazy oddechu.

Z obrazu: ${JSON.stringify(params.findingsFromImages)}
Z głosu: ${JSON.stringify(params.findingsFromSpeech)}

Zwróć JSON:
{
  "confirmedFindings": Finding[],
  "imageOnlyFindings": Finding[],
  "speechOnlyFindings": Finding[],
  "conflicts": [{ "speechClaim": string, "imageEvidence": string, "note": string }]
}`,
    }],
  })

  const text = getTextContent(response.content)
  const parsed = parseJSON<FusionResult>(text)

  return parsed ?? {
    confirmedFindings: [],
    imageOnlyFindings: params.findingsFromImages,
    speechOnlyFindings: params.findingsFromSpeech,
    conflicts: [],
  }
}

// ============================================================================
// GENERATE PATIENT EXPLANATION — from approved report
// ============================================================================
export async function generatePatientExplanation(params: {
  report: RadiologicalReport | MedicalReport
  transcription?: string
}): Promise<PatientExplanation> {
  const reportSummary = 'findings' in params.report
    ? {
        type: 'radiological',
        impression: (params.report as RadiologicalReport).impression,
        findings: (params.report as RadiologicalReport).findings?.slice(0, 10),
        recommendations: (params.report as RadiologicalReport).radiologistRecommendations,
      }
    : {
        type: 'medical',
        diagnosis: (params.report as MedicalReport).diagnosis,
        recommendations: (params.report as MedicalReport).recommendations,
        uncertainItems: (params.report as MedicalReport).uncertainItems,
      }

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Napisz wyjaśnienie wyników badania dla pacjenta — językiem prostym, bez żargonu medycznego.
Zasady: nie dodawaj nowych faktów medycznych, nie używaj terminologii łacińskiej, zachowaj niepewność,
rozdziel: "co znaleziono" / "co to oznacza" / "następne kroki".

Raport: ${JSON.stringify(reportSummary)}
${params.transcription ? `Transkrypcja wizyty (kontekst dodatkowy): "${params.transcription.substring(0, 500)}"` : ''}

JSON: { "plainLanguageSummary": string, "keyFindings": string[], "nextSteps": string[], "followUp": string | null }`,
    }],
  })

  const text = getTextContent(response.content)
  const parsed = parseJSON<Omit<PatientExplanation, 'sourceReportId' | 'generatedAt'>>(text)

  return {
    plainLanguageSummary: parsed?.plainLanguageSummary ?? '',
    keyFindings: parsed?.keyFindings ?? [],
    nextSteps: parsed?.nextSteps ?? [],
    followUp: parsed?.followUp ?? null,
    sourceReportId: params.report.id,
    generatedAt: new Date().toISOString(),
  }
}
