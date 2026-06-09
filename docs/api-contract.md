# Sonara — API Contract

**Version:** 0.1  
**Base URL:** `/api`  
**Auth:** Cookie-based session (`iron-session`). Protected routes require a valid session cookie set by `/api/auth/login`.  
**Content-Type:** `application/json` unless noted otherwise.  
**All AI routes:** `export const maxDuration = 60` (Vercel Pro required — Claude Vision + Whisper exceed 10s default timeout).

---

## Types reference

All request/response types are defined in `lib/types.ts`. Import from there.

```typescript
import type {
  User, Patient, PatientInput,
  RadiologicalReport, RadiologyReportInput, RadiologyReportDraft,
  MedicalReport, MedicalReportInput, MedicalReportDraft,
  ImageAnalysisResult, FusionResult, PatientExplanation,
} from '@/lib/types'
```

---

## Auth

### POST `/api/auth/login`

Login with email and password. Sets a signed HTTP-only cookie (`iron-session`).

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Response `200`:**
```typescript
{ user: User }
```
Sets `Set-Cookie: session=<signed>; HttpOnly; Path=/; SameSite=Lax`.

**Errors:**
- `400` — missing fields
- `401` — invalid credentials

---

### POST `/api/auth/logout`

Clears the session cookie.

**Request body:** none  
**Response `200`:** `{ ok: true }`

---

### GET `/api/auth/me`

Returns the current authenticated user.

**Response `200`:**
```typescript
{ user: User }
```

**Errors:**
- `401` — no valid session

---

## Patients

### GET `/api/patients`

Returns all patients.

**Response `200`:**
```typescript
{ patients: Patient[] }
```

**Errors:**
- `401` — not authenticated

---

### POST `/api/patients`

Creates a new patient.

**Request body:**
```typescript
PatientInput // { firstName, lastName, pesel, gender, dateOfBirth }
```

**Response `201`:**
```typescript
{ patient: Patient }
```

**Errors:**
- `400` — validation error (missing required fields, invalid PESEL format)
- `401` — not authenticated
- `409` — patient with this PESEL already exists

---

### GET `/api/patients/[id]`

Returns a single patient.

**Response `200`:**
```typescript
{ patient: Patient }
```

**Errors:**
- `401` — not authenticated
- `404` — patient not found

---

## Radiological Reports

### GET `/api/reports/radiological`

Returns radiological reports. Radiologists see only their own reports; can filter by patient.

**Query params:**
- `patientId?: string` — filter by patient

**Response `200`:**
```typescript
{ reports: RadiologicalReport[] }
```

**Errors:**
- `401` — not authenticated

---

### POST `/api/reports/radiological`

Creates a new radiological report (draft).

**Request body:**
```typescript
RadiologyReportInput // { patientId, examinationType, clinicalIndication?, examinationContext?, comments?, analysisMode? }
```

**Response `201`:**
```typescript
{ report: RadiologicalReport }
```

**Errors:**
- `400` — validation error
- `401` — not authenticated
- `403` — caller is not a radiologist

---

### GET `/api/reports/radiological/[id]`

Returns a single radiological report.

**Response `200`:**
```typescript
{ report: RadiologicalReport }
```

**Errors:**
- `401` — not authenticated
- `404` — report not found

---

### PUT `/api/reports/radiological/[id]`

Partial update of a radiological report (only drafts can be updated).

**Request body:** `Partial<RadiologicalReport>` — any subset of fields.

**Response `200`:**
```typescript
{ report: RadiologicalReport }
```

**Errors:**
- `400` — validation error
- `401` — not authenticated
- `403` — caller is not the report's radiologist, or report is approved
- `404` — report not found

---

### PATCH `/api/reports/radiological/[id]/approve`

Approves a radiological report. Sets `status: 'approved'`, `approvedAt: now`, `approvedByName`.

**Request body:** none  
**Response `200`:**
```typescript
{ report: RadiologicalReport }
```

**Errors:**
- `400` — report has empty findings AND empty impression (at least one required)
- `401` — not authenticated
- `403` — caller is not the report's radiologist, or report already approved
- `404` — report not found

---

## Medical Reports

### GET `/api/reports/medical`

Returns medical reports. Doctors see only their own reports; can filter by patient.

**Query params:**
- `patientId?: string` — filter by patient

**Response `200`:**
```typescript
{ reports: MedicalReport[] }
```

**Errors:**
- `401` — not authenticated

---

### POST `/api/reports/medical`

Creates a new medical report (draft).

**Request body:**
```typescript
MedicalReportInput // { patientId, radiologicalReportId? }
```

**Response `201`:**
```typescript
{ report: MedicalReport }
```

**Errors:**
- `400` — validation error
- `401` — not authenticated
- `403` — caller is not a doctor

---

### GET `/api/reports/medical/[id]`

Returns a single medical report.

**Response `200`:**
```typescript
{ report: MedicalReport }
```

**Errors:**
- `401` — not authenticated
- `404` — report not found

---

### PUT `/api/reports/medical/[id]`

Partial update of a medical report (only drafts can be updated).

**Request body:** `Partial<MedicalReport>`

**Response `200`:**
```typescript
{ report: MedicalReport }
```

**Errors:**
- `400` — validation error
- `401` — not authenticated
- `403` — caller is not the report's doctor, or report is approved
- `404` — report not found

---

### PATCH `/api/reports/medical/[id]/approve`

Approves a medical report and its patient explanation simultaneously.

**Request body:** none  
**Response `200`:**
```typescript
{ report: MedicalReport }
```

**Errors:**
- `400` — required fields missing (anamnesis, diagnosis, recommendations)
- `401` — not authenticated
- `403` — caller is not the report's doctor, or already approved
- `404` — report not found

---

## AI Routes

> All AI routes require `export const maxDuration = 60` (implemented by BE2).

### POST `/api/ai/analyze-image`

Analyzes USG images using Claude Vision pipeline. Supports two-step (AI_PIPELINE_ADVANCED=false) and advanced multi-step + AI Reviewer (AI_PIPELINE_ADVANCED=true).

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `images` | File (1–5) | yes | Binary image files, max 10 MB each (server pre-processes with sharp to max 1568px) |
| `examinationType` | string | yes | From `EXAM_TYPE_LIST` or free-text |
| `clinicalIndication` | string | no | From referral |
| `examinationContext` | JSON string | no | `ExaminationContext` serialized |
| `comments` | string | no | Radiologist pre-analysis notes |
| `patientAge` | string | yes | Age in years |
| `patientGender` | `'M' | 'F'` | yes | |
| `language` | `'pl' | 'en'` | yes | Report language |

**Response `200`:**
```typescript
ImageAnalysisResult
// {
//   imageQuality: ImageQuality
//   qualityIssues?: string[]
//   findings: Finding[]
//   lowConfidenceFindings?: Finding[]
//   structuredFindings?: StructuredFindings  // advanced pipeline only
//   aiSuggestions?: AISuggestion[]
//   aiQualityCheck?: AiQualityCheck          // advanced pipeline only
//   impression?: string
//   imagingLimitations?: string | null
//   rawObservations?: string[]               // two-step pipeline only
// }
```

**Implementation notes (BE2):**
- Check `process.env.AI_PIPELINE_ADVANCED === 'true'` to select pipeline.
- Preprocess images with `lib/ai/image-preprocessor.ts` (resize → 1568px, JPEG q85, strip EXIF).
- Use `lib/ai/claude.ts` for Claude API calls with prompt caching (system prompt Warstwa 1+2).
- Extended thinking: enable when `imageCount >= 3 || imageQuality === 'suboptimal'`.
- Max 1 auto-retry on JSON parse failure.
- `export const maxDuration = 60`

**Errors:**
- `400` — missing required fields, invalid file type, file too large
- `401` — not authenticated
- `500` — Claude API error (return structured error for UI fallback)

---

### POST `/api/ai/transcribe`

Transcribes audio using OpenAI Whisper.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | yes | Audio blob (`.webm` or `.mp4`) |
| `language` | `'pl' | 'en'` | yes | |

**Response `200`:**
```typescript
{
  transcription: string
  transcriptionWarning?: string // set when transcription < 200 chars
}
```

**Implementation notes (BE2):**
- Use `lib/ai/whisper.ts`. Config: `model: 'whisper-1'`, `language: 'pl'`, `response_format: 'verbose_json'`, `temperature: 0`, `prompt: WHISPER_MEDICAL_PROMPT`.
- Pre-process: strip fillers (eee, yyy, mmm), auto-correct common Whisper PL errors.
- Segments with `avg_logprob < -0.8` → set `transcriptionWarning`.
- `export const maxDuration = 60`

**Errors:**
- `400` — missing audio file
- `401` — not authenticated
- `429` / `500` — Whisper API error

---

### POST `/api/ai/generate-report`

Generates a structured report from transcription using Claude.

**Request body:**
```typescript
{
  transcription: string
  role: UserRole                    // 'radiologist' | 'doctor'
  examinationType?: string          // for radiologist role
  examinationContext?: ExaminationContext
  patientAge: number
  patientGender: 'M' | 'F'
  language: 'pl' | 'en'
  radiologicalReportId?: UUID       // for doctor role — loads context from store
}
```

**Response `200` (radiologist):**
```typescript
RadiologyReportDraft
// { findings, impression, imagingLimitations?, aiQualityCheck? }
```

**Response `200` (doctor):**
```typescript
MedicalReportDraft
// { anamnesis, diagnosis, diagnosisConfidence, recommendations, uncertainItems, patientExplanation?, transcriptionQuality?, aiQualityCheck? }
```

**Implementation notes (BE2):**
- Use `lib/ai/claude.ts` with role-specific system prompts.
- For `role: 'doctor'`: if `radiologicalReportId` provided, load the report from `lib/store.ts` and include `rawText` in user message.
- For `role: 'doctor'`: generate `patientExplanation` in the same call (or as second Claude call) — draft always returned.
- Use `lib/ai/examTypePrompts.ts` to build Warstwa 2 for radiologist.
- `export const maxDuration = 60`

**Errors:**
- `400` — missing transcription
- `401` — not authenticated
- `500` — Claude API error

---

### POST `/api/ai/fuse-findings`

Fuses findings from image analysis and speech transcription (multimodal mode).

**Request body:**
```typescript
{
  findingsFromImages: Finding[]
  findingsFromSpeech: Finding[]
}
```

**Response `200`:**
```typescript
FusionResult
// {
//   confirmedFindings: Finding[]
//   imageOnlyFindings: Finding[]
//   speechOnlyFindings: Finding[]
//   conflicts: Array<{ speechClaim, imageEvidence, note }>
// }
```

**Implementation notes (BE2):**
- Use `lib/ai/claude.ts` with fusion system prompt.
- Do not assume conflict without clear evidence — positional differences may be probe angle artifacts.
- `export const maxDuration = 60`

**Errors:**
- `400` — missing finding arrays
- `401` — not authenticated
- `500` — Claude API error

---

### POST `/api/ai/generate-patient-explanation`

Generates a plain-language patient explanation from an approved report.

**Request body:**
```typescript
{
  reportId: UUID
  reportType: 'radiological' | 'medical'
  transcription?: string  // for Case C (doctor) — adds conversational context
}
```

**Response `200`:**
```typescript
PatientExplanation
// {
//   plainLanguageSummary: string
//   keyFindings: string[]
//   nextSteps: string[]
//   followUp: string | null
//   sourceReportId: UUID
//   generatedAt: string
// }
```

**Implementation notes (BE2):**
- Load report from `lib/store.ts`.
- Rules: no new medical facts, no Latin terminology, preserve uncertainty, separate "what was found" / "what it means" / "next steps".
- Saves `patientExplanation` back to the report in store.
- `export const maxDuration = 60`

**Errors:**
- `400` — missing reportId or reportType
- `401` — not authenticated
- `404` — report not found
- `500` — Claude API error

---

## Error response format

All errors return:
```typescript
{ error: string, details?: unknown }
```

---

## Session cookie

`iron-session` configuration (BE1 — `lib/auth.ts`):
```typescript
{
  cookieName: 'sonara_session',
  password: process.env.AUTH_SECRET,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }
}
```

Session payload: `{ userId: UUID, role: UserRole }`.

---

## Hardcoded users (demo)

| Email | Password | Role |
|-------|----------|------|
| rad1@demo.pl | demo2024 | radiologist |
| rad2@demo.pl | demo2024 | radiologist |
| rad3@demo.pl | demo2024 | radiologist |
| doc1@demo.pl | demo2024 | doctor |
| doc2@demo.pl | demo2024 | doctor |
| doc3@demo.pl | demo2024 | doctor |
| doc4@demo.pl | demo2024 | doctor |
