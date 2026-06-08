// ============================================================================
// Sonara — Shared TypeScript types
// Source of truth: Design Spec + lib/data.jsx (Golden Demo Cases)
// ============================================================================

export type UUID = string // format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

// ---------------------------------------------------------------------------
// Users & Auth
// ---------------------------------------------------------------------------

export type UserRole = 'radiologist' | 'doctor'

/** Shape used in the UI / store (no password) */
export type User = {
  id: UUID
  name: string
  email: string
  role: UserRole
  initials: string
}

/** Shape used for seed/auth checks (includes plaintext password — demo only) */
export type SeedUser = User & {
  password: string
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export type Patient = {
  id: UUID
  firstName: string
  lastName: string
  pesel: string
  gender: 'M' | 'F'
  dateOfBirth: string
  age: number
  createdAt?: string
}

export type PatientInput = Omit<Patient, 'id' | 'age' | 'createdAt'>

// ---------------------------------------------------------------------------
// Core clinical types
// ---------------------------------------------------------------------------

export type AnalysisMode = 'image' | 'voice' | 'multimodal'

export type ImageQuality = 'diagnostic' | 'suboptimal' | 'non_diagnostic'

export type TranscriptionQuality = 'good' | 'partial' | 'poor'

/** Operationally defined — not percentage thresholds (see Design Spec). */
export type ConfidenceLevel = 'high' | 'medium' | 'low'
/** Alias */
export type Confidence = ConfidenceLevel

export type AIPipeline = 'two-step' | 'advanced'

// ---------------------------------------------------------------------------
// Examination types
// ---------------------------------------------------------------------------

export type ExamType =
  | 'USG jamy brzusznej'
  | 'USG tarczycy'
  | 'USG nerek'
  | 'USG wątroby'
  | 'USG pęcherzyka żółciowego'
  | 'USG trzustki'
  | 'USG śledziony'
  | 'USG prostaty'
  | 'USG ginekologiczne transwaginalne (TV)'
  | 'USG ginekologiczne przezbrzuszne (TA)'
  | 'USG piersi'
  | 'USG tkanek miękkich'
  | 'USG Doppler tętnic szyjnych'
  | 'USG Doppler tętnic kończyn dolnych'
  | 'USG Doppler żylny kończyn dolnych (DVT)'
  | 'USG węzłów chłonnych'
  | 'USG moszny i jąder'
  | 'USG układu mięśniowo-szkieletowego (MSK)'
  | 'Echokardiografia'
  | string // free-text fallback

export const EXAM_TYPE_LIST: string[] = [
  'USG jamy brzusznej',
  'USG tarczycy',
  'USG nerek',
  'USG wątroby',
  'USG pęcherzyka żółciowego',
  'USG trzustki',
  'USG śledziony',
  'USG prostaty',
  'USG ginekologiczne transwaginalne (TV)',
  'USG ginekologiczne przezbrzuszne (TA)',
  'USG piersi',
  'USG tkanek miękkich',
  'USG Doppler tętnic szyjnych',
  'USG Doppler tętnic kończyn dolnych',
  'USG Doppler żylny kończyn dolnych (DVT)',
  'USG węzłów chłonnych',
  'USG moszny i jąder',
  'USG układu mięśniowo-szkieletowego (MSK)',
  'Echokardiografia',
]

// ---------------------------------------------------------------------------
// Evidence & Findings
// ---------------------------------------------------------------------------

export type Evidence = {
  imageIndexes?: number[]
  transcriptFragments?: string[]
}

export type Finding = {
  id?: UUID
  text: string                 // max 120 chars, single sentence
  isDeviation: boolean
  confidence: ConfidenceLevel
  anatomicalLocation: string   // e.g. "wątroba segment VI", "nerka lewa"
  evidence?: Evidence
}

export type Classification = {
  name: string   // e.g. "ACR TI-RADS"
  value: string  // e.g. "TR4"
  label: string  // e.g. "Średnie ryzyko"
  points?: number
}

export type DifferentialDiagnosis = {
  diagnosis: string
  confidence: ConfidenceLevel
  rationale: string // max 200 chars
}

export type AiInsight = {
  title: string       // max 60 chars
  description: string // max 200 chars
}

// ---------------------------------------------------------------------------
// AI Suggestions
// ---------------------------------------------------------------------------

export type AISuggestionType =
  | 'differential_diagnosis'
  | 'additional_observation'
  | 'follow_up_question'
  | 'missing_structure'
  | 'risk_factor'

export type AISuggestion = {
  id: UUID
  type: AISuggestionType
  title: string
  description?: string
  confidence: ConfidenceLevel
  rationale: string
  evidence?: Evidence
  canInsertIntoReport: boolean
}

// ---------------------------------------------------------------------------
// Quality Check
// ---------------------------------------------------------------------------

export type QualityCheckStatus = 'ready' | 'needs_attention' | 'blocked'

export type QualityCheckCategory =
  | 'image_quality'
  | 'transcription_quality'
  | 'completeness'
  | 'consistency'
  | 'classification'
  | 'source_evidence'
  | 'patient_explanation'

export type QualityCheckItem = {
  category: QualityCheckCategory
  status: 'pass' | 'warning' | 'fail'
  message: string
  relatedFindingIds?: UUID[]
}

/** Alias for backward compatibility */
export type QualityCheck = QualityCheckItem

export type AiQualityCheck = {
  status: QualityCheckStatus
  summary: string
  checks: QualityCheckItem[]
  autoCorrections: string[]
  unresolvedItems: string[]
}

/** Alias */
export type AIQualityCheck = AiQualityCheck

// ---------------------------------------------------------------------------
// Examination Context
// ---------------------------------------------------------------------------

export type ExaminationContext = {
  /** For gynecological ultrasounds (TV/TA) */
  menstrualCyclePhase?: 'follicular' | 'ovulatory' | 'luteal' | 'postmenopause' | 'pregnancy' | 'on_contraceptives'

  /** For abdominal / liver / gallbladder / pancreas ultrasounds */
  fastingStatus?: 'fasting' | 'non_fasting'

  /** Optional lab values from referral (TSH, creatinine, etc.) */
  relevantLabValues?: Array<{ label: string; value: string; unit: string }>

  /** Prior surgeries affecting interpretation */
  priorSurgery?: string

  /** Anatomical body part (free form) */
  bodyPart?: string

  /** Side (left / right / bilateral) */
  side?: 'left' | 'right' | 'bilateral'
}

// ---------------------------------------------------------------------------
// Fusion Result
// ---------------------------------------------------------------------------

export type FusionResult = {
  confirmedFindings: Finding[]
  imageOnlyFindings: Finding[]
  speechOnlyFindings: Finding[]
  conflicts: Array<{
    speechClaim: string
    imageEvidence: string
    note: string
  }>
}

// ---------------------------------------------------------------------------
// Patient Explanation
// ---------------------------------------------------------------------------

export type PatientExplanation = {
  plainLanguageSummary: string
  keyFindings: string[]
  nextSteps: string[]
  followUp: string | null
  sourceReportId: UUID
  generatedAt: string
}

// ---------------------------------------------------------------------------
// Structured Intermediate Representation (SIR)
// ---------------------------------------------------------------------------

/** Internal AI intermediate representation — not exposed in UI */
export type StructuredFindings = Record<string, unknown>

// ---------------------------------------------------------------------------
// Radiological Report
// ---------------------------------------------------------------------------

export type DiagnosisConfidence = 'definitive' | 'probable' | 'differential' | 'possible'

export type RadiologicalReport = {
  id: UUID
  patientId: UUID
  radiologistId: UUID
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  images: Array<{
    base64: string
    mimeType: string
    filename: string
  }>
  imageQuality?: ImageQuality
  imageCount?: number
  imageLabel?: string
  comments?: string
  analysisMode?: AnalysisMode
  pipeline?: AIPipeline
  rawObservations?: string[]
  qualityIssues?: string[]
  findings: Finding[]
  lowConfidenceFindings?: Finding[]
  structuredFindings?: StructuredFindings
  fusionResult?: FusionResult
  aiSuggestions?: AISuggestion[]
  aiInsights?: AiInsight[]
  aiQualityCheck?: AiQualityCheck
  classification?: Classification | null
  impression?: string
  radiologistRecommendations?: string
  imagingLimitations?: string
  patientExplanation?: PatientExplanation
  rawText?: string
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
  approvedByName?: string
  caseKey?: string | null
}

/** Alias */
export type RadiologyReport = RadiologicalReport

// ---------------------------------------------------------------------------
// Medical Report (Doctor)
// ---------------------------------------------------------------------------

export type MedicalReport = {
  id: UUID
  patientId: UUID
  doctorId: UUID
  radiologicalReportId?: UUID
  transcription: string
  transcriptionQuality?: TranscriptionQuality
  anamnesis: string
  diagnosis: string
  diagnosisConfidence: DiagnosisConfidence
  recommendations: string
  uncertainItems: string[]
  aiQualityCheck?: AiQualityCheck
  patientExplanation?: PatientExplanation
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
  caseKey?: string | null
}

// ---------------------------------------------------------------------------
// API Input / Draft types
// ---------------------------------------------------------------------------

export type RadiologyReportInput = {
  patientId: UUID
  examinationType: string
  clinicalIndication?: string
  examinationContext?: ExaminationContext
  comments?: string
  analysisMode?: AnalysisMode
}

export type RadiologyReportDraft = {
  findings: Finding[]
  lowConfidenceFindings?: Finding[]
  impression?: string
  imagingLimitations?: string
  radiologistRecommendations?: string
  imageQuality?: ImageQuality
  rawObservations?: string[]
  aiSuggestions?: AISuggestion[]
  aiQualityCheck?: AiQualityCheck
  structuredFindings?: StructuredFindings
  rawText?: string
}

export type MedicalReportInput = {
  patientId: UUID
  radiologicalReportId?: UUID
  transcription?: string
}

export type MedicalReportDraft = {
  anamnesis: string
  diagnosis: string
  diagnosisConfidence: DiagnosisConfidence
  recommendations: string
  uncertainItems: string[]
  transcriptionQuality?: TranscriptionQuality
  patientExplanation?: PatientExplanation
  aiQualityCheck?: AiQualityCheck
}

// ---------------------------------------------------------------------------
// AI API Result types
// ---------------------------------------------------------------------------

export type ImageAnalysisResult = {
  imageQuality: ImageQuality
  qualityIssues?: string[]
  findings: Finding[]
  lowConfidenceFindings?: Finding[]
  structuredFindings?: StructuredFindings
  aiSuggestions?: AISuggestion[]
  aiQualityCheck?: AiQualityCheck
  impression?: string
  imagingLimitations?: string | null
  rawObservations?: string[]
}

// ---------------------------------------------------------------------------
// Examination Type Prompt configuration (examTypePrompts.ts)
// ---------------------------------------------------------------------------

export type ExaminationTypePrompt = {
  /** Exam type key (must match ExamType union) */
  examinationType: string

  /** Short description of exam focus */
  examFocus: string

  /** Structures that MUST be assessed */
  mandatoryStructures: string[]

  /** Systematic checklist items in order */
  systematicChecklist: string[]

  /** Reference norms (organ sizes, ratios) */
  referenceNorms: Record<string, string>

  /** Formal classification systems applicable (TIRADS, BIRADS, Bosniak, etc.) */
  classifications: Array<{
    name: string
    description: string
    applicableWhen?: string
  }>

  /** Warning thresholds triggering QualityCheck warnings */
  warningThresholds: Array<{
    field: string
    condition: string
    message: string
  }>

  /** Typical imaging limitations for this exam type */
  imagingLimitations: string[]

  /** Template for the impression section */
  impressionTemplate: string

  /** Context fields shown conditionally in the UI form */
  contextFields?: {
    menstrualCyclePhase?: boolean
    fastingStatus?: boolean
    relevantLabValues?: boolean
    priorSurgery?: boolean
  }

  /** Gender restriction if applicable */
  genderRestriction?: 'M' | 'F'
}
