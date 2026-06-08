// BE2: implement exam type prompts library — the ONLY file containing medical domain knowledge
// buildAnalyzeImageSystemPrompt(examinationType, patientGender): string — Warstwa 2 for analyze-image
// buildGenerateReportSystemPrompt(examinationType): string — Warstwa 2 for generate-report (radiologist)
// getExamTypeConfig(examinationType): ExaminationTypePrompt — full config per exam type
//
// Must implement configs for all 19 types from EXAM_TYPE_LIST (see lib/types.ts):
// Priority types with formal classifications:
//   USG tarczycy       → ACR TI-RADS (TR1–TR5, point system)
//   USG piersi         → ACR BI-RADS (0–6, biopsy thresholds)
//   USG nerek          → Bosniak 2019 (I, II, IIF, III, IV) + SFU grade 0–IV for hydronephrosis
//   USG Doppler tętnic szyjnych → NASCET (% stenosis, PSV/EDV — from dictation only)
//   USG ginekologiczne (TV) → O-RADS US 2022 for adnexal changes
// All other types → systematic descriptive protocol
export {}
