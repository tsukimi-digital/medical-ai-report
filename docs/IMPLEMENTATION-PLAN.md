# Plan implementacji — Sonara (Medical AI Report)

## Context

Repo zawiera **design spec** (`docs/superpowers/specs/2026-06-03-medical-ai-poc-design.md`, źródło wymagań), `docs/TODO.md` (carve-outy produkcyjne/RODO) oraz **frontendowy prototyp** z handoffu Claude Design — `docs/prototype/Sonara - Medical AI.html` (React 18 UMD + Babel-in-browser) rozbity na `app/*.jsx`, `components/ui.jsx`, `lib/*.jsx`, `styles/globals.css`. Prototyp to **źródło prawdy wyglądu i interakcji**, ale jest w 100% zamockowany (brak AI, API, persystencji, auth) i — po rozbiciu na pliki — **nie ma punktu wejścia, więc się nie uruchamia**. Pusty szkielet katalogów Next.js istnieje, ale bez `package.json`, configów i route handlerów.

Cel: zbudować działające demo (POC) zgodne ze spec — Next.js 14 (App Router, TypeScript, **Tailwind**), realna integracja **Claude `claude-opus-4-8`** (Vision + raporty) + **OpenAI Whisper** (transkrypcja), in-memory store z 4 Golden Demo Cases, cookie-auth, oba tryby pipeline AI sterowane flagą `AI_PIPELINE_ADVANCED`.

**Decyzje (potwierdzone z użytkownikiem):**
1. **Model wykonania:** pełny zespół multi-agent wg `CLAUDE.md` (TL + FE + BE1 + BE2 + QA, worktrees, PR-y, cross-review, merge wg zależności).
2. **Style:** przepisać design-system z `styles/globals.css` na **Tailwind** (tokeny → `tailwind.config`), zachowując wierność wizualną prototypu.
3. **Pipeline AI:** zaimplementować **oba** tryby (Two-Step **i** SIR+Multi-Step+Reviewer) sterowane `AI_PIPELINE_ADVANCED` — by później porównać, który działa lepiej.
4. **Model AI:** `claude-opus-4-8` (wszędzie gdzie spec pisał `claude-sonnet-4-6`; logika thinking/temperature bez zmian — `temperature` tylko gdy thinking wyłączone). *(korekta 2026-06-12: Opus 4.8 nie przyjmuje `temperature` ani `enabled`+`budget_tokens` — używamy adaptive thinking `{type:'adaptive'}`, bez parametrów samplingu)*

Pełny **Audyt UI (KROK 1)** został przedstawiony użytkownikowi w czacie; niniejszy plik to KROK 2 (plan).

---

## Architektura docelowa (skrót — pełna w spec, sekcja „Architektura projektu")

- `app/(auth)/login`, `app/(app)/{dashboard,patients,patients/new,patients/[id],examination/new,examination/[id],visit,visit/[id]}` + `(app)/layout.tsx` (navbar PL/EN + logout + stały disclaimer AI).
- `app/api/{auth/{login,logout,me}, patients, patients/[id], reports/radiological, reports/medical, ai/{analyze-image,transcribe,generate-report,fuse-findings,generate-patient-explanation}}`.
- `lib/{store.ts, auth.ts, types.ts, examination-types.ts}`, `lib/ai/{claude.ts, whisper.ts, examTypePrompts.ts, image-preprocessor.ts}`, `lib/i18n/{pl.ts,en.ts,index.ts}`, `middleware.ts`.
- `components/ui/*` + `voice-recorder.tsx`, `image-uploader.tsx`, `examination-context-fields.tsx`, `report-editor.tsx`, `findings-list.tsx`, `evidence-viewer.tsx`, `ai-suggestions.tsx`, `quality-check-panel.tsx`, `fusion-result.tsx`, `patient-selector.tsx`, `report-selector.tsx`, `examination-type-select.tsx`.

**Seam między zespołami = `docs/api-contract.md`** (deliverable TL). FE pracuje przeciw typowanemu mock-klientowi zgodnemu z kontraktem; BE implementuje ten sam kontrakt; integracja podmienia mock na realne `fetch`.

---

## Fazy implementacji

### Faza 0 — Scaffold (TL: Hiroshi Tanaka) — *blokuje resztę*
Initial commit na `main`:
- `package.json` (Next 14, react 18, typescript, tailwindcss/postcss/autoprefixer, `@anthropic-ai/sdk`, `openai`, `sharp`, `zod`; dev: `vitest`/`@testing-library`, `@playwright/test`, `eslint`), `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `.env.example` (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `AUTH_SECRET`, `AI_PIPELINE_ADVANCED`).
- `lib/types.ts` — **wszystkie** typy ze spec (modele danych, sekcja „Modele danych"). To kontrakt typów dla całego zespołu.
- `docs/api-contract.md` — endpointy, kształty request/response, kody błędów (z sekcji „AI — Szczegóły integracji" i „Architektura"). Wszyscy developerzy czytają to przed implementacją.
- `docs/PROGRESS.md` — checklista zadań per agent (każdy odhacza swoje).
- `tailwind.config.ts` — przeniesienie tokenów z `styles/globals.css` (zmienne CSS → `theme.extend.colors/fontFamily` IBM Plex, spacing, radius); globalny `app/globals.css` z `@tailwind base/components/utilities` + warstwa bazowa fontów.
- Pliki-placeholdery z `// BE1/BE2/FE: implement here`, `.gitignore` (już jest).

### Faza 1 — Dokończenie UI na mockach (FE: Yuki Sato)
Migracja prototypu → Next.js + Tailwind (prototyp = źródło prawdy):
- Przepisać `app/shell.jsx` + `screens/*.jsx` na strony App Router (`page.tsx`) z realnym routingiem URL zamiast in-memory `switch`. Przepisać `components/ui.jsx` → `components/ui/*` (Tailwind).
- Komponenty domenowe (lista w architekturze) — **realne**: `image-uploader` z `<input type=file>`, drag&drop, walidacja 5 plików/10MB, miniatury; `voice-recorder` z `MediaRecorder` (opus 16kHz mono, fallback Safari `audio/mp4`); `evidence-viewer`, `quality-check-panel`, `fusion-result`, `ai-suggestions`, `examination-context-fields` (warunkowe pola per typ badania).
- **Brakujące stany:** loading (realne async), empty, error (bannery suboptimal/non_diagnostic/transcription quality + ścieżka „Kontynuuj bez AI"), walidacja (PESEL 11 cyfr, email, wymagane pola formularza pacjenta).
- **i18n** PL/EN z `lib/i18n` (port `lib/i18n.jsx`); toast przy zmianie języka po wygenerowaniu draftu.
- **A11y:** `<button>` zamiast klikalnych `<div>`, ARIA/role, focus-trap + `role=dialog` w modalu, `alt`/`aria-hidden` na ikonach, nawigacja klawiaturą w combobox. Zachować confidence badge = kolor + etykieta (WCAG 1.4.1).
- **Mock API client** (`lib/api-client.ts`) zgodny z `api-contract.md` — zwraca dane z istniejącego `lib/data.jsx` (4 Golden Cases), async z opóźnieniem. To pozwala dokończyć i przetestować UI zanim backend gotowy.
- Stały disclaimer AI w `(app)/layout.tsx`; badge proweniencji AI na draftach/zatwierdzonych.

### Faza 2 — Backend równoległy (BE1 + BE2 jednocześnie, przeciw `api-contract.md`)

**BE1 (Kenji Mori) — auth + dane:**
- `lib/auth.ts` — sesja jako signed HTTP-only cookie (`AUTH_SECRET`), walidacja hardcoded users.
- `app/api/auth/{login,logout,me}` ; `middleware.ts` chroniący `/(app)/*` (redirect `/login`).
- `app/api/patients` (GET/POST) + `[id]` (GET); `app/api/reports/radiological` i `/medical` (GET/POST + `[id]` GET/PUT/PATCH-approve). Walidacja `zod` (PESEL, wymagane pola). Reguła approve: blokada gdy `findings[]` puste ORAZ `impression` puste.
- Timeout sesji 10/15 min (ostrzeżenie + invalidacja).

**BE2 (Akira Yamamoto) — warstwa AI + store:**
- `lib/store.ts` — in-memory singleton (Mapy), pre-seed 4 Golden Cases (port `lib/data.jsx`), `crypto.randomUUID()`.
- `lib/ai/image-preprocessor.ts` — `sharp` resize 1568px, JPEG q85, strip EXIF.
- `lib/ai/whisper.ts` — `whisper-1`, `language:'pl'`, `verbose_json`, priming prompt; preprocessing transkrypcji; próg ostrzeżenia <200 znaków.
- `lib/ai/examTypePrompts.ts` — Warstwa 2 per typ badania (19 typów + fallback), klasyfikacje formalne (TI-RADS/BI-RADS/Bosniak/SFU/NASCET/O-RADS).
- `lib/ai/claude.ts` — klient `claude-opus-4-8` z prompt caching (`cache_control: ephemeral` Warstwa 1+2), adaptive thinking `{type:'adaptive'}` (gdy `imageCount≥3` lub `suboptimal`; Opus 4.8 — bez `temperature` i bez `budget_tokens`; `max_tokens` 10000/4000). **Oba pipeline za `AI_PIPELINE_ADVANCED`:** `false`=Two-Step (Vision Extraction → Report Generation, „surowe obserwacje AI"); `true`=SIR → Multi-Step (A–E) → AI Reviewer (wypełnia `aiQualityCheck`). Wspólny output kontraktu — UI renderuje warunkowo (pola `optional`).
- `app/api/ai/{analyze-image (multipart),transcribe,generate-report,fuse-findings,generate-patient-explanation}` — każdy `export const maxDuration = 60`. Obsługa błędów: timeout 45s, 1 auto-retry, fallback do ręcznego edytora po 2 porażkach.

### Faza 3 — Integracja (FE + BE2 cross-review)
- FE podmienia mock-klienta na realne `fetch` do route'ów. Wpięcie realnego uploadu (multipart), nagrywania (blob → `/transcribe`), trzech trybów generowania (image / voice / multimodal), „Generuj wyjaśnienie dla pacjenta", approve.
- Voice flow: surowa transkrypcja Whisper natychmiast w readonly preview, Claude w tle podmienia draft.
- Weryfikacja przepływu danych end-to-end na Golden Cases.

### Faza 4 — Hardening
- Pełne ścieżki błędów AI (4xx/5xx, retry, banner „AI niedostępne — wprowadź ręcznie"), `non_diagnostic` → „Kontynuuj bez AI".
- Walidacja klient+serwer (rozmiar/typ pliku), timeout sesji, disclaimer + proweniencja, responsywność desktop/tablet (`data-device`/`data-orient` lub realne breakpointy — do decyzji FE/TL).
- Każdy developer dostarcza własne testy jednostkowe/integracyjne w swoim PR.

### Faza 5 — QA e2e (Mei Nakamura) — *dopiero po merge FE+BE1+BE2*
- Worktree QA tworzony po merge. Testy **produktowe** e2e (Playwright) weryfikujące cele z Design Spec, nie testy jednostkowe.
- Pokrycie 4 Golden Cases + przepływy: login→dashboard→nowe badanie→generacja→edycja→approve→wyjaśnienie dla pacjenta; wizyta lekarza (jedno nagranie → dwa dokumenty); Quality Check / konflikt (Case D).

---

## Kontrakty API (skrót — pełne w `api-contract.md`, szczegóły w spec)

- `POST /api/auth/login` `{email,password}` → set-cookie + `User`; `/logout`; `GET /me` → `User`.
- `GET/POST /api/patients`, `GET /api/patients/[id]` → `Patient`.
- `GET/POST /api/reports/radiological`, `GET/PUT/PATCH /api/reports/radiological/[id]` (PATCH=approve). Analogicznie `/medical`.
- `POST /api/ai/analyze-image` — **multipart/form-data** (`images` 1–5 ≤10MB, `examinationType`, `clinicalIndication`, `examinationContext` JSON, `comments`, `patientAge`, `patientGender`, `language`) → `{imageQuality, qualityIssues[], findings[], impression, imagingLimitations, structuredFindings?, aiQualityCheck?}`.
- `POST /api/ai/transcribe` — audio → `{transcription, transcriptionWarning?}`.
- `POST /api/ai/generate-report` — `{transcription, role, examinationType, examinationContext, patientAge, patientGender, language}` → radiolog: `{findings[],impression,transcriptionIssues[]}` / lekarz: `{anamnesis,diagnosis,diagnosisConfidence,recommendations,uncertainItems[]}`.
- `POST /api/ai/fuse-findings` — `{findingsFromImages[], findingsFromSpeech[]}` → `FusionResult`.
- `POST /api/ai/generate-patient-explanation` — `{reportId, transcription?}` → `PatientExplanation`.

Typy: `lib/types.ts` (kompletny zestaw ze spec). Pola nowego flow (`structuredFindings`, `aiQualityCheck`) `optional`.

---

## Kolejność i kamienie milowe

1. **M0:** Faza 0 zmergowana (scaffold + `api-contract.md` + `types.ts` + `PROGRESS.md` na `main`). Blokuje wszystko.
2. **M1:** FE/BE1/BE2 pracują równolegle w worktrees przeciw kontraktowi. Każdy: własne testy + PR.
3. **Cross-review** (wg `CLAUDE.md`): TL — wszystkie PR-y; BE1 recenzuje BE2; BE2 recenzuje FE.
4. **M2 — merge wg zależności:** BE2 → BE1 → FE (`merge_method: "merge"`, nie squash; tożsamość przez `GIT_AUTHOR_NAME/EMAIL`).
5. **M3:** worktree QA + e2e na aktualnym `main` → PR QA → review TL → merge.
6. **Cleanup** worktrees dopiero po jawnym potwierdzeniu odbioru przez użytkownika.

Zależności: M0 blokuje M1; integracja (Faza 3) wymaga przynajmniej BE2 + FE; QA (Faza 5) wymaga pełnego M2.

---

## Weryfikacja (jak sprawdzić end-to-end)

- **Build/lint/typy:** `npm run build`, `npm run lint`, `tsc --noEmit` bez błędów.
- **Testy jednostkowe/integracyjne** (per developer): `npm run test` (vitest) — m.in. `examTypePrompts` (klasyfikacje), walidacja auth/patients, parsowanie JSON z Claude, preprocessing sharp/transkrypcji.
- **E2e (QA):** `npx playwright test` — 4 Golden Cases + przepływy produktowe; uruchamiane na realnym dev serverze (`npm run dev`).
- **Manualnie / `/run`:** uruchomić app, zalogować `rad1@demo.pl` / `demo2024`, przejść Case A (obraz→TI-RADS 4, evidence wskazuje obrazy), Case B (głos→raport, korekta „nerka lewa, nie, prawa"), Case C (lekarz: jedno nagranie → notatka + wersja dla pacjenta), Case D (suboptimal banner + „Wymaga weryfikacji"). Przełączyć `AI_PIPELINE_ADVANCED` i potwierdzić oba tryby (panel Quality Check vs „surowe obserwacje AI").
- **Z realnymi kluczami:** ustawić `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` w `.env.local`, zweryfikować realne wywołania Vision + Whisper (a nie tylko seed).
- **A11y smoke:** nawigacja klawiaturą po formularzu/modalu/combobox, focus-trap w modalu, etykiety confidence niezależne od koloru.

---

## Ryzyka / uwagi
- `AI_PIPELINE_ADVANCED=true` + Opus 4.8 → bliżej górnej granicy `maxDuration=60` (wymaga Vercel Pro). Monitorować czasy; ewentualnie obniżyć `max_tokens` (`budget_tokens` nie istnieje na Opus 4.8 — adaptive thinking).
- Multipart upload kontra limit body 4.5MB Vercel — trzymać się `multipart/form-data` (bez base64 w JSON).
- In-memory store gubi dane użytkownika po ~15 min bezczynności na Vercel; seed zawsze przywracany — akceptowalne dla demo (Postgres/Neon = `docs/TODO.md`, poza zakresem POC).
- Tylko dane syntetyczne; brak DPA/anonimizacji pikselowej — produkcyjne carve-outy w `docs/TODO.md`, świadomie poza POC.
