# PROGRESS.md — Sonara

## Faza 0 — Scaffold (TL: Hiroshi Tanaka)
- [x] package.json + tsconfig + next.config.mjs
- [x] tailwind.config.ts + postcss.config.js
- [x] .env.example
- [x] app/globals.css + app/layout.tsx
- [x] lib/types.ts (kompletne typy)
- [x] docs/api-contract.md
- [x] docs/PROGRESS.md
- [x] Pliki placeholder

## Faza 1 — UI (FE: Yuki Sato)
- [x] app/(auth)/login/page.tsx
- [x] app/(app)/layout.tsx (navbar + disclaimer)
- [x] app/(app)/dashboard/page.tsx
- [x] app/(app)/patients/page.tsx
- [x] app/(app)/patients/new/page.tsx
- [x] app/(app)/patients/[id]/page.tsx
- [x] app/(app)/examination/new/page.tsx
- [x] app/(app)/examination/[id]/page.tsx
- [x] app/(app)/visit/page.tsx
- [x] app/(app)/visit/[id]/page.tsx
- [x] components/ui/* (design system: icon, button, badge, modal, banner, collapse, combobox)
- [x] components/voice-recorder.tsx
- [x] components/image-uploader.tsx
- [x] components/examination-context-fields.tsx
- [x] components/report-editor.tsx
- [x] components/findings-list.tsx
- [x] components/evidence-viewer.tsx
- [x] components/ai-suggestions.tsx
- [x] components/quality-check-panel.tsx
- [x] components/fusion-result.tsx
- [x] components/patient-selector.tsx
- [x] components/report-selector.tsx
- [x] components/examination-type-select.tsx
- [x] lib/i18n/{pl.ts,en.ts,index.ts}
- [x] lib/api-client.ts (mock client, 4 Golden Cases)
- [x] Testy jednostkowe FE (30 testów — i18n, api-client, validation, badge)

## Faza 2a — Auth + dane (BE1: Kenji Mori)
- [x] middleware.ts
- [x] lib/auth.ts
- [x] app/api/auth/login/route.ts
- [x] app/api/auth/logout/route.ts
- [x] app/api/auth/me/route.ts
- [x] app/api/patients/route.ts
- [x] app/api/patients/[id]/route.ts
- [x] app/api/reports/radiological/route.ts
- [x] app/api/reports/radiological/[id]/route.ts
- [x] app/api/reports/radiological/[id]/approve/route.ts
- [x] app/api/reports/medical/route.ts
- [x] app/api/reports/medical/[id]/route.ts
- [x] app/api/reports/medical/[id]/approve/route.ts
- [x] Testy jednostkowe BE1

## Faza 2b — AI + store (BE2: Akira Yamamoto)
- [x] lib/store.ts
- [x] lib/ai/claude.ts
- [x] lib/ai/whisper.ts
- [x] lib/ai/examTypePrompts.ts
- [x] lib/ai/image-preprocessor.ts
- [x] app/api/ai/analyze-image/route.ts
- [x] app/api/ai/transcribe/route.ts
- [x] app/api/ai/generate-report/route.ts
- [x] app/api/ai/fuse-findings/route.ts
- [x] app/api/ai/generate-patient-explanation/route.ts
- [x] Testy jednostkowe BE2

## Faza 5 — QA (Mei Nakamura) — po merge FE+BE1+BE2
- [ ] tests/e2e/login.spec.ts
- [ ] tests/e2e/case-a.spec.ts (USG tarczycy, image→TI-RADS 4)
- [ ] tests/e2e/case-b.spec.ts (USG jamy brzusznej, voice→korekta)
- [ ] tests/e2e/case-c.spec.ts (lekarz: głos→notatka+wyjaśnienie)
- [ ] tests/e2e/case-d.spec.ts (suboptimal banner + Wymaga weryfikacji)
