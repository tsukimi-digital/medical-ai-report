# PROGRESS.md — Sonara

## Faza 0 — Scaffold (TL: Hiroshi Tanaka)
- [x] package.json + tsconfig + next.config.mjs
- [x] tailwind.config.ts + postcss.config.js
- [x] .env.example
- [x] app/globals.css + app/layout.tsx
- [x] app/page.tsx (root redirect → /dashboard)
- [x] lib/types.ts (kompletne typy)
- [x] docs/api-contract.md
- [x] docs/PROGRESS.md
- [x] Pliki placeholder
- [x] Pliki prototypu (handoff): app/screens/, app/shell.jsx, components/ui.jsx, lib/data.jsx, lib/device.jsx, lib/i18n.jsx

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
- [x] components/ui/* (design system: icon, button, badge, modal, banner, collapse, combobox, toast)
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
- [x] middleware.ts (ochrona /(app)/*)
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

## Faza 3 — Integracja (FE: Yuki Sato + BE2: Akira Yamamoto) — blokuje Fazę 5

**Gate przed spawnem QA:** `grep -r "fetch(" lib/api-client.ts` musi zwrócić wyniki.

### BE2 (Akira Yamamoto) — feature/faza3-be2-fixes
- [x] Fix Bug #1: session.userId → session.user we wszystkich 5 AI routes
- [x] Import SESSION_OPTIONS z lib/auth.ts (usunąć duplikaty z AI routes)
- [x] Fix limit pliku serwer → 5MB spójne z klientem + dodać MIME type validation
- [x] Dodać retry/timeout 45s do generate-report, fuse-findings, generate-patient-explanation
- [x] Fix rad3: store.ts — zsynchronizować imię z auth.ts (Katarzyna Wróbel)

### FE (Yuki Sato) — feature/faza3-integration
- [x] lib/api-client.ts: podmienić mock na realne fetch('/api/...')
- [x] examination/new: dwufazowy voice flow (Whisper→preview, Claude w tle→draft)
- [x] examination/new: multimodal flow (analyzeImage + transcribe równolegle → fuseFindings)
- [x] examination/new: "Analizuj wielomodalnie" aktywny tylko gdy obrazy + nagranie
- [x] visit/[id]: dwufazowy voice flow (identyczny jak examination)
- [x] visit/[id]: generowanie patientExplanation równolegle z raportem lekarskim

## Faza 4 — Hardening (FE: Yuki Sato + BE2: Akira Yamamoto)

### FE (Yuki Sato) — feature/faza3-integration (ta sama gałąź co Faza 3)
- [x] "Kontynuuj bez AI" button — dodać onClick handler (manualMode = true)
- [x] visit/[id]: bannery jakości transkrypcji (partial→żółty, poor→czerwony)
- [x] visit/[id]: badge proweniencji AI (analogicznie do examination/[id])
- [x] components/ui/modal.tsx: auto-focus na pierwszy element przy otwarciu
- [x] Toast: zmiana języka po wygenerowaniu draftu (klucz langToast)
- [x] lib/examination-types.ts: osobny plik per spec (re-export z lib/types.ts)

## Faza 5 — QA (Mei Nakamura) — po merge Fazy 3 i 4
- [x] tests/setup.ts (vitest global setup)
- [x] tests/e2e/helpers/auth.ts (helper loginViaApi do testów e2e)
- [x] tests/e2e/login.spec.ts
- [x] tests/e2e/case-a.spec.ts (USG tarczycy, image→TI-RADS 4)
- [x] tests/e2e/case-b.spec.ts (USG jamy brzusznej, voice→korekta)
- [x] tests/e2e/case-c.spec.ts (lekarz: głos→notatka+wyjaśnienie)
- [x] tests/e2e/case-d.spec.ts (suboptimal banner + Wymaga weryfikacji)
- [x] tests/e2e/dashboard.spec.ts (radiolog + lekarz dashboard)
- [x] tests/e2e/navigation.spec.ts (navbar, disclaimer, lang toggle, logout, keyboard)

## Faza 6 — Poprawki po audycie QA cross-verification (FE + BE2)

### Zidentyfikowane przez: 4 agentów QA (Weryfikator 1-3 + Frontend UX QA)

#### HIGH — Braki blokujące demo
- [x] **Evidence Viewer osiągalny** — dodać prop `onEvidence` do `ReportEditorProps` w `components/report-editor.tsx` + przekazać do `FindingsList`; w `examination/[id]/page.tsx` podłączyć callback `setEvidenceFinding` + `setShowEvidenceModal`
- [x] **Nowa wizyta — selektor pacjenta i raportu radiologicznego** — `app/(app)/visit/[id]/page.tsx`: dodać `PatientSelector` + `ReportSelector` przed VoiceRecorder gdy isNew; usunąć hardkodowany `patients[0]` z `handleVoiceRecording`
- [x] **Limit pliku 5 MB → 10 MB** — `components/image-uploader.tsx` (MAX_SIZE + hint) + `app/api/ai/analyze-image/route.ts` (serwer) — zgodnie ze spec (realne pliki USG)

#### MED — Przed prezentacją klientowi
- [x] **Patient Explanation w raporcie radiologicznym — pełny widok** — `examination/[id]/page.tsx`: dodać `keyFindings[]`, `nextSteps[]`, `followUp` (analogicznie jak w `visit/[id]`)
- [x] **Sidebar z raportem radiologicznym w wizycie lekarza** — `visit/[id]/page.tsx`: gdy `report.radiologicalReportId` — fetch + `Collapse` z findings + impression
- [x] **Approval badge proweniencji AI** — `examination/[id]/page.tsx`: po zatwierdzeniu pokazuje "Źródło AI: zdjęcia USG / nagranie głosowe / multimodal" (używa istniejących kluczy i18n: `approvedSource`, `srcImage`, `srcVoice`, `srcMulti`)

## Faza 5b — QA Update post-integration (Mei Nakamura)
- [x] Bug fix: auth.ts loginViaApi → używa formularza logowania (ustawia in-memory sessionUser)
- [x] Bug fix: app/(app)/layout.tsx → re-hydratacja sessionUser z /api/auth/me przy hard refresh
- [x] tests/e2e/new-ui-elements.spec.ts — 11 nowych testów produktowych:
  - [x] Brak banera jakości transkrypcji gdy quality='good' (med-C)
  - [x] Badge-AI na szkicu wizyty (med-C: aiGenerated=true, status=draft)
  - [x] Brak badge-AI na zatwierdzonej wizycie (med-seed-1: status=approved)
  - [x] Baner ostrzegawczy dla suboptimal (rad-D) — bez "Kontynuuj bez AI"
  - [x] Toast przy zmianie języka PL→EN
  - [x] Auto-dismiss toastu po ~4 sekundach
  - [x] Treść toastu zawiera informację o języku raportu
  - [x] rad-A ładuje dane przez realne API (TI-RADS, findings)
  - [x] Pełny cykl approve (rad-A): Zatwierdź → modal → confirm → badge-approved
  - [x] Badge-AI widoczny na szkicu (rad-B — izolacja od mutacji approve)
  - [x] rad-A-appr: badge-approved, brak badge-AI, brak przycisku Zatwierdź
- [x] Weryfikacja gate: fetch( w api-client.ts → 21 wywołań (> 0 ✓)
- [x] Wynik: 79 testów — 79 passed, 0 failed

## Faza 7 — Poprawki UI z audytu QA #2 (FE: Yuki Sato) — feature/qa-fixes-fe-2

### FE (Yuki Sato) — feature/qa-fixes-fe-2
- [x] **VoiceRecorder i18n** — `components/voice-recorder.tsx`: replace hardcoded PL strings (recReady/recSend/recReset) with `useI18n` + nowe klucze w pl.ts/en.ts
- [x] **Generate button dynamiczna etykieta** — `examination/new/page.tsx`: idle→genImage/genVoice/genMulti, loading→analyzing; disable multimodal gdy brak obu inputów
- [x] **Findings "zmodyfikowane" badge** — `components/findings-list.tsx`: po edycji tekstu finding → chip-edited z ostrzeżeniem
- [x] **Modal a11y** — `components/ui/modal.tsx`: przenieść `role="dialog"` + `aria-modal` z .scrim na .modal; scrim → `role="presentation"`
- [x] **langToast dynamiczny** — `app/(app)/layout.tsx`: komunikat dostosowany do aktualnego języka (PL/EN) zamiast hardcoded "PL"
- [x] **visit/[id] layout dwukolumnowy** — zmiana `page-narrow` → `page-wide` gdy raport istnieje
- [x] **visit/[id] edytowalna patient explanation** — pola input/textarea zamiast read-only przed zatwierdzeniem; merge do approve payload
- [x] **visit/[id] render uncertainItems[]** — sekcja "Wymaga weryfikacji" po polu diagnosis gdy !isApproved
- [x] **visit/[id] badge "Źródło AI"** — po zatwierdzeniu wizyty pokazuje `approvedSource: srcVoice`
- [x] **examination-context-fields priorSurgery** — nowe pole dla USG brzusznych/wątrobowych + klucze i18n
