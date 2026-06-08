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
- [ ] app/(auth)/login/page.tsx
- [ ] app/(app)/layout.tsx (navbar + disclaimer)
- [ ] app/(app)/dashboard/page.tsx
- [ ] app/(app)/patients/page.tsx
- [ ] app/(app)/patients/new/page.tsx
- [ ] app/(app)/patients/[id]/page.tsx
- [ ] app/(app)/examination/new/page.tsx
- [ ] app/(app)/examination/[id]/page.tsx
- [ ] app/(app)/visit/page.tsx
- [ ] app/(app)/visit/[id]/page.tsx
- [ ] components/ui/* (design system)
- [ ] components/voice-recorder.tsx
- [ ] components/image-uploader.tsx
- [ ] components/examination-context-fields.tsx
- [ ] components/report-editor.tsx
- [ ] components/findings-list.tsx
- [ ] components/evidence-viewer.tsx
- [ ] components/ai-suggestions.tsx
- [ ] components/quality-check-panel.tsx
- [ ] components/fusion-result.tsx
- [ ] components/patient-selector.tsx
- [ ] components/report-selector.tsx
- [ ] components/examination-type-select.tsx
- [ ] lib/i18n/{pl.ts,en.ts,index.ts}
- [ ] lib/api-client.ts (mock client)
- [ ] Testy jednostkowe FE

## Faza 2a — Auth + dane (BE1: Kenji Mori)
- [ ] middleware.ts
- [ ] lib/auth.ts
- [ ] app/api/auth/login/route.ts
- [ ] app/api/auth/logout/route.ts
- [ ] app/api/auth/me/route.ts
- [ ] app/api/patients/route.ts
- [ ] app/api/patients/[id]/route.ts
- [ ] app/api/reports/radiological/route.ts
- [ ] app/api/reports/radiological/[id]/route.ts
- [ ] app/api/reports/radiological/[id]/approve/route.ts
- [ ] app/api/reports/medical/route.ts
- [ ] app/api/reports/medical/[id]/route.ts
- [ ] app/api/reports/medical/[id]/approve/route.ts
- [ ] Testy jednostkowe BE1

## Faza 2b — AI + store (BE2: Akira Yamamoto)
- [ ] lib/store.ts
- [ ] lib/ai/claude.ts
- [ ] lib/ai/whisper.ts
- [ ] lib/ai/examTypePrompts.ts
- [ ] lib/ai/image-preprocessor.ts
- [ ] app/api/ai/analyze-image/route.ts
- [ ] app/api/ai/transcribe/route.ts
- [ ] app/api/ai/generate-report/route.ts
- [ ] app/api/ai/fuse-findings/route.ts
- [ ] app/api/ai/generate-patient-explanation/route.ts
- [ ] Testy jednostkowe BE2

## Faza 5 — QA (Mei Nakamura) — po merge FE+BE1+BE2
- [ ] tests/e2e/login.spec.ts
- [ ] tests/e2e/case-a.spec.ts (USG tarczycy, image→TI-RADS 4)
- [ ] tests/e2e/case-b.spec.ts (USG jamy brzusznej, voice→korekta)
- [ ] tests/e2e/case-c.spec.ts (lekarz: głos→notatka+wyjaśnienie)
- [ ] tests/e2e/case-d.spec.ts (suboptimal banner + Wymaga weryfikacji)
