# Sonara — Medical AI POC — Design Spec
**Data:** 2026-06-03  
**Status:** Zatwierdzony  
**Typ:** POC / Demo dla klienta  
**Nazwa aplikacji:** Sonara

---

## Cel

**Sonara** to demo aplikacji usprawniającej pracę radiologa i lekarza przez automatyzację tworzenia raportów medycznych z użyciem AI (analiza obrazu USG + transkrypcja głosu). Aplikacja pokazuje klientowi nowy flow pracy i pozwala ocenić czy automatyzacja faktycznie przyspiesza pracę.

---

## Stack techniczny

- **Framework:** Next.js 14, App Router, TypeScript
- **Styl:** Tailwind CSS
- **Pre-processing obrazów:** sharp (resize + EXIF strip)
- **AI — analiza obrazu / raporty:** Claude Sonnet 4.6 (Anthropic)
- **AI — transkrypcja głosu:** OpenAI Whisper
- **Dane:** In-memory singleton (moduł-level), pre-seedowany danymi demo
- **Auth:** Cookie-based session, hardcoded users
- **Deployment:** Vercel
- **Język UI:** Dwujęzyczny PL/EN (przełącznik w navbarze)

---

## Zmienne środowiskowe

```
ANTHROPIC_API_KEY=...          # Claude Vision + generowanie raportów
OPENAI_API_KEY=...             # Whisper transkrypcja
AUTH_SECRET=...                # Podpisywanie cookie sesji
AI_PIPELINE_ADVANCED=true      # false = Two-Step pipeline (szybszy); true = SIR + Multi-Step + AI Reviewer (dokładniejszy)
```

### AI_PIPELINE_ADVANCED — dwa tryby pipeline

| Flaga | Flow | Prompty do Claude | aiQualityCheck | Czas odpowiedzi |
|-------|------|-------------------|----------------|-----------------|
| `false` | Two-Step: Vision Extraction → Report Generation | 2 (analyze-image) + 1 (generate-report) | brak (pole `undefined`) | ~10–20s |
| `true` | SIR → Multi-Step (5 promptów) → AI Reviewer | 8–10 (analyze-image) + 2 (generate-report) | wypełniony | ~30–60s |

**UI przy `false`:** `quality-check-panel` ukryty (brak `aiQualityCheck`). Sekcja "Surowe obserwacje AI" (collapsible) pokazuje raw observations z Vision Extraction.

**UI przy `true`:** `quality-check-panel` widoczny z wynikami AI Reviewer. Sekcja "Surowe obserwacje AI" schowana — SIR jest wewnętrzny, nie eksponowany w UI.

**Nie ma niespójności danych:** wszystkie pola nowego flow (`structuredFindings`, `aiQualityCheck`) są `optional` w typach TypeScript — UI renderuje je warunkowo.

---

## Użytkownicy (hardcoded)

| Email | Hasło | Rola |
|-------|-------|------|
| rad1@demo.pl | demo2024 | Radiolog |
| rad2@demo.pl | demo2024 | Radiolog |
| rad3@demo.pl | demo2024 | Radiolog |
| doc1@demo.pl | demo2024 | Lekarz |
| doc2@demo.pl | demo2024 | Lekarz |
| doc3@demo.pl | demo2024 | Lekarz |
| doc4@demo.pl | demo2024 | Lekarz |

---

## Architektura projektu

```
/medical-ai-report
  /app
    /api
      /auth
        /login/route.ts
        /logout/route.ts
        /me/route.ts
      /patients
        /route.ts                    # GET lista, POST utwórz
        /[id]/route.ts               # GET szczegóły
      /reports
        /radiological
          /route.ts                  # GET lista, POST utwórz
          /[id]/route.ts             # GET, PUT (edycja), PATCH (zatwierdź)
        /medical
          /route.ts                  # GET lista, POST utwórz
          /[id]/route.ts             # GET, PUT, PATCH (zatwierdź)
      /ai
        /analyze-image/route.ts      # Claude Vision → findings z confidence (tryb image)
        /transcribe/route.ts         # audio → Whisper → tekst
        /generate-report/route.ts    # tekst + rola → Claude → draft raportu
        /fuse-findings/route.ts      # Multimodal: łączy findings z obrazu i mowy → FusionResult
        /generate-patient-explanation/route.ts  # Approved report → wersja zrozumiała dla pacjenta
    /(auth)
      /login/page.tsx
    /(app)
      /layout.tsx                    # Navbar z przełącznikiem PL/EN + logout + stały disclaimer AI
      /dashboard/page.tsx            # Role-based dashboard
      /patients/page.tsx             # Lista pacjentów
      /patients/new/page.tsx         # Formularz nowego pacjenta
      /patients/[id]/page.tsx        # Profil pacjenta
      /examination/new/page.tsx      # Radiolog: nowe badanie
      /examination/[id]/page.tsx     # Radiolog: podgląd / edycja raportu
      /visit/page.tsx                # Lekarz: nowa wizyta
      /visit/[id]/page.tsx           # Lekarz: edycja raportu lekarskiego
  /lib
    /store.ts                        # In-memory data store (singleton)
    /auth.ts                         # Sesje, walidacja użytkowników
    /ai
      /claude.ts                     # Claude API client (z prompt caching, extended thinking)
      /whisper.ts                    # OpenAI Whisper client (language: pl, priming prompt)
      /examTypePrompts.ts            # Biblioteka promptów per typ badania — jedyne źródło wiedzy medycznej
      /image-preprocessor.ts        # Resize obrazów do 1568px, strip EXIF (sharp)
    /types.ts                        # Wspólne typy TypeScript
    /i18n
      /pl.ts                         # Tłumaczenia PL
      /en.ts                         # Tłumaczenia EN
      /index.ts                      # Hook useTranslation
    /examination-types.ts            # Lista typów badań USG
  /components
    /ui/                             # Button, Input, Badge, Card, Modal
    /voice-recorder.tsx              # MediaRecorder API → audioBlob (opus codec, 16kHz mono)
    /image-uploader.tsx              # Drag & drop, max 5 plików, max 10MB każdy
    /examination-context-fields.tsx  # Pola kontekstowe zależne od typu badania (faza cyklu, czczo)
    /report-editor.tsx               # Edytor raportu (textarea z AI badge)
    /findings-list.tsx               # Lista znalezisk z confidence badge + evidence viewer
    /evidence-viewer.tsx             # Podgląd źródeł znalezisk (numery obrazów, fragmenty transkrypcji)
    /ai-suggestions.tsx              # Sekcja "AI Suggestions" — differential dx + obserwacje poza raportem formalnym
    /quality-check-panel.tsx         # Kompaktowy panel AI Quality Check (status + lista checks)
    /fusion-result.tsx               # Widok Multimodal: confirmed / imageOnly / speechOnly / conflicts



    /patient-selector.tsx            # Combobox wyszukiwania pacjenta
    /report-selector.tsx             # Dropdown raportów radiologicznych pacjenta
    /examination-type-select.tsx     # Searchable combobox typów badań
  /middleware.ts                     # Ochrona tras /(app)/*
```

---

## Modele danych

```typescript
type UUID = string  // format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx, generowane przez crypto.randomUUID()

type UserRole = 'radiologist' | 'doctor'

type User = {
  id: UUID
  name: string
  email: string
  role: UserRole
  password: string  // plaintext — tylko demo
}

type Patient = {
  id: UUID
  firstName: string
  lastName: string
  pesel: string
  gender: 'M' | 'F'
  dateOfBirth: string
  createdAt: string
}

type Confidence = 'high' | 'medium' | 'low'

// Kryteria operacyjne confidence (nie progi %):
// high   — struktura wyraźnie widoczna, granice ostre, brak alternatywnej interpretacji
// medium — struktura widoczna, ale granice nieostre LUB możliwa inna interpretacja
// low    — struktura wnioskowana z kontekstu, częściowo zasłonięta, poza kadrem
//          LUB wypowiedź radiologa z wahaniem/korektą (w przypadku transkrypcji głosu)

type Finding = {
  text: string                  // opis znaleziska, max 120 znaków, jedno zdanie
  isDeviation: boolean
  confidence: Confidence
  anatomicalLocation: string    // np. "wątroba segment VI", "nerka lewa"
  evidence?: {                  // Evidence Layer — skąd AI wzięło to znalezisko
    imageIndexes?: number[]     // indeksy obrazów (0-based) na których widoczne
    transcriptFragments?: string[]  // cytaty z transkrypcji potwierdzające finding
  }
}

type DifferentialDiagnosis = {
  diagnosis: string             // nazwa rozpoznania
  confidence: Confidence        // high/medium/low — jak mocno obraz pasuje
  rationale: string             // max 200 znaków — dlaczego to rozpoznanie
}

type AiInsight = {
  title: string                 // krótki tytuł obserwacji, max 60 znaków
  description: string           // rozwinięcie, max 200 znaków — nie trafia do raportu formalnego
}

// Case D — Quality Review
type QualityCheckStatus = 'ready' | 'needs_attention' | 'blocked'
// ready           — draft gotowy do weryfikacji, bez istotnych problemów
// needs_attention — są ostrzeżenia, ale draft można edytować i zatwierdzić
// blocked         — obraz non_diagnostic LUB transkrypcja zbyt krótka/niezrozumiała → ręczny edytor

type QualityCheckCategory =
  | 'image_quality'        // jakość obrazu USG
  | 'transcription_quality'// jakość transkrypcji Whisper
  | 'completeness'         // czy wszystkie obowiązkowe struktury ocenione
  | 'consistency'          // czy impression wynika ze findings
  | 'classification'       // poprawność TI-RADS, BI-RADS, Bosniak itp.
  | 'source_evidence'      // czy findings mają potwierdzenie w źródle
  | 'patient_explanation'  // jakość wersji dla pacjenta

type QualityCheckItem = {
  category: QualityCheckCategory
  status: 'pass' | 'warning' | 'fail'
  message: string
  relatedFindingIds?: UUID[]
}

type AiQualityCheck = {
  status: QualityCheckStatus
  summary: string
  checks: QualityCheckItem[]
  autoCorrections: string[]    // opisy auto-korekt zastosowanych przez AI Reviewer
  unresolvedItems: string[]    // elementy których AI nie mogło automatycznie naprawić
}

type PatientExplanation = {
  plainLanguageSummary: string // główne podsumowanie prostym językiem
  keyFindings: string[]        // lista kluczowych wyników (bez terminologii łacińskiej)
  nextSteps: string[]          // co pacjent powinien zrobić
  followUp: string | null      // zalecana kontrola (np. "za 6 miesięcy") lub null
  sourceReportId: UUID         // id raportu radiologicznego lub lekarskiego
  generatedAt: string
}

// AI Suggestions — ujednolicony model sugestii AI poza formalnym raportem
type AiSuggestion = {
  type: 'differential_diagnosis' | 'additional_observation' | 'follow_up_question'
  title: string
  description: string
  confidence: Confidence
  rationale: string
  evidence?: {
    imageIndexes?: number[]
    transcriptFragments?: string[]
  }
  canInsertIntoReport: boolean  // czy radiolog może ręcznie przenieść do raportu
}

type StructuredFindings = Record<string, unknown>
// Wewnętrzna reprezentacja SIR — nie pokazywana użytkownikowi bezpośrednio.
// Przykład dla tarczycy: { thyroid: { rightLobe: { visible, normal }, nodule: { size, echogenicity, margin } } }
// Per typ badania — generowana przez Etap 1 analyze-image pipeline.

type FusionResult = {
  confirmedFindings: Finding[]  // widoczne na obrazie ORAZ wspomniane w dyktowaniu
  imageOnlyFindings: Finding[]  // widoczne na obrazie, niepomniane przez radiologa
  speechOnlyFindings: Finding[] // powiedziane przez radiologa, nieznalezione na obrazach
  conflicts: Array<{
    speechClaim: string         // co powiedział radiolog
    imageEvidence: string       // co widać na obrazie
    note: string                // wyjaśnienie konfliktu dla radiologa
  }>
}

type ImageQuality = 'diagnostic' | 'suboptimal' | 'non_diagnostic'

// Kontekst badania — pola zbierane od radiologa w formularzu.
// Wyświetlane WARUNKOWO zależnie od typu badania — radiolog nie widzi nieistotnych pól.
// To są informacje które radiolog i tak wpisuje do raportu manualnie — tu je strukturyzujemy.
type ExaminationContext = {
  // Dla USG ginekologicznych (TV/TA) — wpływa na normy endometrium i torbieli
  menstrualCyclePhase?: 'follicular' | 'ovulatory' | 'luteal' | 'postmenopause' | 'pregnancy' | 'on_contraceptives'

  // Dla USG jamy brzusznej / wątroby / pęcherzyka / trzustki — wpływa na jakość obrazu
  fastingStatus?: 'fasting' | 'non_fasting'

  // Opcjonalne wartości laboratoryjne ze skierowania (TSH, kreatynina itp.)
  relevantLabValues?: Array<{ label: string; value: string; unit: string }>

  // Poprzednie zabiegi mogące wpływać na interpretację (np. cholecystektomia → CBD do 8mm norma)
  priorSurgery?: string
}

type RadiologicalReport = {
  id: UUID
  patientId: UUID
  radiologistId: UUID
  examinationType: string           // np. "USG jamy brzusznej"
  clinicalIndication?: string       // wskazanie ze skierowania — kontekst kliniczny dla AI
  examinationContext?: ExaminationContext  // pola kontekstowe warunkowe per typ badania
  images: Array<{                   // max 5 zdjęć, max 10MB każde po stronie klienta (preprocessowane przez sharp do 1568px — wynik <2MB)
    base64: string
    mimeType: string
    filename: string
  }>
  imageQuality?: ImageQuality       // ocena jakości obrazu przez AI
  comments: string                  // komentarze radiologa przed generowaniem (opcjonalne)
  analysisMode?: 'image' | 'voice' | 'multimodal'  // tryb generowania
  findings: Finding[]               // znaleziska z confidence + evidence (jeśli AI)
  structuredFindings?: StructuredFindings  // wewnętrzna SIR — wynik Etapu 1 pipeline (nie pokazywana w UI)
  fusionResult?: FusionResult       // wynik fuzji — tylko dla analysisMode === 'multimodal'
  aiSuggestions?: AiSuggestion[]    // sugestie AI poza raportem formalnym (differential dx, dodatkowe obserwacje)
  aiInsights?: AiInsight[]          // dodatkowe obserwacje AI (poza raportem formalnym)
  aiQualityCheck?: AiQualityCheck   // wynik Case D — AI Quality Review
  impression?: string               // wnioski kliniczne — najważniejsza część raportu
  radiologistRecommendations?: string  // zalecenia radiologa (BAC, kontrola, konsultacja)
  imagingLimitations?: string       // co AI nie mogło ocenić i dlaczego
  patientExplanation?: PatientExplanation  // wersja dla pacjenta (generowana po zatwierdzeniu)
  rawText: string                   // pełna treść raportu do edycji
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
}

type DiagnosisConfidence = 'definitive' | 'probable' | 'differential' | 'possible'
// definitive  — lekarz stwierdził bez modyfikatorów wątpliwości
// probable    — "prawdopodobnie", "wygląda na", "raczej"
// differential — "może być X albo Y", "różnicowo", "do różnicowania"
// possible    — "podejrzewam", "nie można wykluczyć", "może być"

type MedicalReport = {
  id: UUID
  patientId: UUID
  doctorId: UUID
  radiologicalReportId?: UUID
  transcription: string             // surowa transkrypcja Whisper
  transcriptionQuality?: 'good' | 'partial' | 'poor'  // analogia do imageQuality
  anamnesis: string                 // wywiad podmiotowy (słowa pacjenta)
  diagnosis: string                 // rozpoznanie (z prefiksem jeśli niepewne)
  diagnosisConfidence: DiagnosisConfidence
  recommendations: string           // zalecenia (leki, skierowania, kontrola)
  uncertainItems: string[]          // elementy oznaczone przez AI jako niejasne
  aiQualityCheck?: AiQualityCheck   // wynik Case D — AI Quality Review
  patientExplanation?: PatientExplanation  // wersja dla pacjenta — draft generowany razem z raportem, zatwierdzany przez lekarza
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
}
```

---

## In-Memory Store

Moduł-level singleton — jeden obiekt z Mapami dla każdego typu danych. Pre-seedowany przy pierwszym imporcie.

**Pre-seed danych demo — 4 Golden Demo Cases:**

| Case | Typ | Cel prezentacji | Element "wow" |
|------|-----|-----------------|---------------|
| **Case A** | USG tarczycy (image-to-report) | Analiza obrazu, TI-RADS, evidence | AI wykrywa zmianę, przypisuje klasyfikację, pokazuje z których obrazów wynikają findings |
| **Case B** | USG jamy brzusznej (voice-to-report) | Transkrypcja dyktowania | Z naturalnego dyktowania powstaje strukturalny raport; niejasne fragmenty w AI Quality Check |
| **Case C** | Wizyta lekarza z pacjentem | Pełna ścieżka od USG do dokumentu dla pacjenta | AI tworzy notatkę lekarską + wersję dla pacjenta jednym nagraniem |
| **Case D** | AI Quality Review — conflict | Warstwa jakości | AI oznacza konflikt lub low-confidence element; nie przedstawia go jako pewny wniosek |

Wszystkie dane syntetyczne (bez prawdziwych pacjentów). Deterministyczne — te same dane po każdym restarcie.

Ograniczenie Vercel: funkcje serverless mogą być restartowane po ~15 min nieaktywności — dane nowo dodane przez użytkownika mogą zniknąć. Dane seed są zawsze przywracane. Akceptowalne dla demo.

---

## AI — Szczegóły integracji

### Architektura promptów — system trójwarstwowy

Każde wywołanie Claude składa się z trzech warstw kompilowanych przed wysłaniem do API:

```
Warstwa 1: Base System Prompt (stały)
  — rola AI, kryteria confidence, zakazy bezwzględne, format JSON

Warstwa 2: Exam Domain Context (dynamiczny, per typ badania)
  — generowany przez examTypePrompts.ts na podstawie examinationType
  — zawiera: struktury do oceny, normy referencyjne, klasyfikacje formalne
    (TIRADS dla tarczycy, BIRADS dla piersi, Bosniak dla nerek itd.),
    checklist systematyczny, template impression

Warstwa 3: Runtime Context (per wywołanie, user message)
  — dane pacjenta, wskazanie kliniczne, kontekst badania, obrazy, język
```

`examTypePrompts.ts` jest jedynym plikiem zawierającym wiedzę medyczną.
Dodanie nowego typu badania = jeden obiekt konfiguracji, zero zmian w API routes.

**Dlaczego trójwarstwowy system, nie 19 osobnych promptów?**

Każdy typ badania USG ma swój własny, specjalistyczny kontekst domenowy (Warstwa 2) — AI analizująca tarczycę dostaje inny checklist, inne normy i inne klasyfikacje (TI-RADS) niż AI analizująca nerki (Bosniak, SFU). Efekt jest identyczny z posiadaniem 19 osobnych promptów.

Trójwarstwowa architektura zamiast 19 kompletnych standalone promptów wynika z **prompt caching**. Warstwa 1 (rola, zakazy bezwzględne, schemat JSON) jest identyczna dla wszystkich typów badań — Anthropic cache'uje ją po pierwszym wywołaniu i nie liczy jej tokenów przy kolejnych zapytaniach. Gdyby każdy typ badania miał własny kompletny system prompt, każdy musiałby duplikować te same zakazy i schemat JSON — nie byłoby co cache'ować, a każde wywołanie płaciłoby pełny koszt tokenów za powtarzający się tekst bazowy.

W praktyce: Warstwa 1 (~600 tokenów) jest cache'owana przez 5 minut od ostatniego użycia (`ephemeral` TTL Anthropic). Każde kolejne badanie w tym oknie (niezależnie od typu) płaci tylko za Warstwę 2 + Warstwę 3. Po upływie 5 minut nieaktywności — cache miss, Warstwa 1 liczona ponownie.

**Typy badań z klasyfikacją formalną (priorytet implementacji):**

| Typ badania | Klasyfikacja | Zakres |
|-------------|-------------|--------|
| USG tarczycy | ACR TI-RADS (TR1–TR5, system punktowy) | Każdy guzek musi mieć kategorię |
| USG piersi | ACR BI-RADS (0–6, z progami biopsji) | Każda zmiana ogniskowa |
| USG nerek (torbiele) | Bosniak 2019 (I, II, IIF, III, IV) | I i II z USG, wyższe → CT/MRI |
| USG nerek (wodonercze) | SFU grade 0–IV | Ocena rozstrzeni |
| USG Doppler tętnic szyjnych | NASCET (% zwężenia + PSV/EDV) | Parametry tylko z dyktowania |
| USG jamy brzusznej | Brak — opis systematyczny | Kolejność: wątroba→CBD→pęcherzyk→trzustka→śledziona→nerki→aorta→wolny płyn |
| USG ginekologiczne TV | **O-RADS US 2022** (ACR) dla zmian przydatków | Wymaga fazy cyklu. O-RADS US 2022 wybrany jako standard — scoring opisowy (kategorie 1–5), możliwy do zastosowania przez AI na podstawie opisu struktury. IOTA ADNEX pominięty — wymaga parametrów numerycznych z modelu statystycznego, niemożliwe do automatycznego obliczenia z obrazu USG. |

**Ważne ograniczenie AI dla badań Doppler:** parametry przepływu (PSV, EDV, RI) są danymi numerycznymi z aparatu — AI nie widzi ich na statycznym zdjęciu. Pochodzi wyłącznie z dyktowania głosowego radiologa.

---

### Analiza obrazu USG (`/api/ai/analyze-image`)

**Input:** `multipart/form-data` — pola: `images` (1–5 plików binarnych, max 10MB każdy), `examinationType`, `clinicalIndication`, `examinationContext` (JSON string), `comments`, `patientAge`, `patientGender`, `language`

Klient: `FormData.append('images', blob, filename)`. Serwer: `request.formData()` → preprocessing sharp po stronie serwera → base64 do store.

Powód `multipart` zamiast JSON: base64 w JSON body zwiększa rozmiar o ~33% — 5 obrazów × 10MB = ~67MB zakodowanego JSON wielokrotnie przekracza limit Vercel 4.5MB. `multipart/form-data` wysyła dane binarne bez narzutu base64.

**Pre-processing obrazów (image-preprocessor.ts):**
Przed base64 encoding każdy obraz przechodzi przez `sharp`:
- Resize do max 1568px po dłuższym boku (zachowanie proporcji)
- Konwersja do JPEG quality 85
- Strip EXIF (usuwa dane pacjenta zapisane przez aparat USG)
- Efekt: 40–70% mniej tokenów przy tej samej jakości diagnostycznej

**System prompt (Warstwa 1 + Warstwa 2, z prompt caching):**
```
[WARSTWA 1 — stała, cachowana]
Jesteś ekspertem AI w analizie obrazów ultrasonograficznych.

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

Gdy imageQuality = "non_diagnostic": zwróć pustą tablicę findings[].

Zwróć wyłącznie poprawny JSON:
{
  "imageQuality": "diagnostic" | "suboptimal" | "non_diagnostic",
  "qualityIssues": string[],
  "findings": [{
    "text": string,           // max 120 znaków, jedno zdanie
    "isDeviation": boolean,
    "confidence": "high" | "medium" | "low",
    "anatomicalLocation": string
  }],
  "impression": string,
  "imagingLimitations": string | null
}

[WARSTWA 2 — generowana przez examTypePrompts.buildAnalyzeImageSystemPrompt(examinationType, patientGender)]
## KONTEKST DOMENOWY: {examinationType}
Cel badania: {examFocus}
Struktury obowiązkowe: {anatomicalScope.mandatory}
Checklist systematyczny: {systematicChecklist}
Normy referencyjne: {referenceNorms}
Klasyfikacje formalne: {formalClassifications} ← TIRADS / BIRADS / Bosniak itd.
Typowe ograniczenia: {imagingLimitations}
Struktura impression: {impressionTemplate}
```

**User message (Warstwa 3):**
```
### DANE KLINICZNE
Typ badania: {examinationType}
Pacjent: {patientGender === 'F' ? 'kobieta' : 'mężczyzna'}, {patientAge} lat
{fastingStatus ? `Status na czczo: ${fastingStatus === 'fasting' ? 'tak (>6h)' : 'nie'}` : ''}
{menstrualCyclePhase ? `Faza cyklu: {menstrualCyclePhase}` : ''}
{relevantLabValues?.length ? `Wartości lab: {relevantLabValues.map(l => `${l.label}: ${l.value} ${l.unit}`).join(', ')}` : ''}
{priorSurgery ? `Poprzednie zabiegi: {priorSurgery}` : ''}
Wskazanie kliniczne: {clinicalIndication}

### KOMENTARZ RADIOLOGA (przed analizą)
{comments || '[brak komentarzy]'}

### OBRAZY ({imageCount} z {imageCount})
[obrazy jako content blocks — największy pierwszy]

### ZADANIE
Przeanalizuj obrazy łącznie.
{imageCount > 1 ? 'Sprzeczności między obrazami: opisz oba warianty jako oddzielne findings (oba confidence low) z numerami obrazów. W impression wyjaśnij sprzeczność.' : ''}
Findings oznacz numerem obrazu-źródła gdy więcej niż 1.
Zwróć JSON. Bez tekstu poza JSON.
Język raportu: {language}
```

**Konfiguracja API call:**
- `thinking: { type: 'adaptive' }` — włączone gdy `imageCount ≥ 3` lub `imageQuality === 'suboptimal'` (Opus 4.8 — `enabled`+`budget_tokens` usunięte; gdy thinking wyłączone, pole `thinking` pomijamy)
- bez parametrów samplingu — Opus 4.8 nie przyjmuje `temperature` / `top_p` / `top_k` (400)
- `max_tokens: 10000` gdy thinking aktywne / `4000` gdy wyłączone (tokeny thinking liczą się do `max_tokens`)
- `cache_control: { type: 'ephemeral' }` na Warstwie 1+2 system promptu

```typescript
const useThinking = imageCount >= 3 || imageQuality === 'suboptimal'
const apiParams = {
  model: 'claude-opus-4-8',
  max_tokens: useThinking ? 10000 : 4000,
  // Opus 4.8 — adaptive thinking; enabled+budget_tokens oraz temperature usunięte z API
  ...(useThinking ? { thinking: { type: 'adaptive' } } : {})
}
```

**Output:** `imageQuality` + `Finding[]` + `impression` + `imagingLimitations`.
Gdy `imageQuality === 'non_diagnostic'` — UI pokazuje czerwony baner, findings ukryte.

**Obsługa błędów — analyze-image:**
- Timeout: 45s (ustaw `export const maxDuration = 60` w route handler — wymaga Vercel Pro)
- Błąd API Anthropic (4xx/5xx): UI pokazuje "Analiza niedostępna. Spróbuj ponownie lub kontynuuj ręcznie." z przyciskiem ponowienia
- Retry: max 1 auto-retry z korektywnym komunikatem `"Your previous response was not valid JSON. Return ONLY the JSON object:"` — korektywny prefiks zmienia prompt, więc retry ma szansę dać poprawny JSON (Opus 4.8 nie przyjmuje `temperature`)
- Po 2 nieudanych próbach: odblokuj edytor z pustym raportem, pokaż baner "AI niedostępne — wprowadź raport ręcznie"

### Transkrypcja głosu (`/api/ai/transcribe`)

**Konfiguracja Whisper:**
```typescript
openai.audio.transcriptions.create({
  model: 'whisper-1',
  language: 'pl',              // wymagane — bez tego Whisper może wybrać CZ/SK
  response_format: 'verbose_json',  // daje segmenty z avg_logprob
  temperature: 0,
  prompt: WHISPER_MEDICAL_PROMPT,   // ~224 tokeny polskiej terminologii medycznej
})
```

`WHISPER_MEDICAL_PROMPT` — fonetyczne zakotwiczenie dla terminologii USG, nazw leków (Metoprolol, Amlodypina, Pantoprazol), akronimów (USG, CRP, TSH, BMI), łaciny (in situ, per os, status post).

**Pre-processing transkrypcji** (przed wysłaniem do Claude):
- Usunięcie fillerów (eee, yyy, mmm)
- Auto-korekty typowych błędów Whisper PL (np. "meta prolol" → metoprolol)
- Segmenty z `avg_logprob < -0.8` → ostrzeżenie o niskiej pewności

**MediaRecorder (voice-recorder.tsx):**
```typescript
getUserMedia({ audio: {
  sampleRate: { ideal: 16000 }, channelCount: 1,
  echoCancellation: true, noiseSuppression: true, autoGainControl: true
}})
// Codec: audio/webm;codecs=opus (Chrome/Edge) → audio/webm → audio/mp4 (Safari fallback)
```

**Output:** `{ transcription: string, transcriptionWarning?: string }`
Gdy transkrypcja < 200 znaków → `transcriptionWarning: "Nagranie może być zbyt krótkie"` — UI ostrzega przed generowaniem raportu. Próg 200 znaków odpowiada minimalnemu opisowi prostego badania (np. "wątroba bez zmian ogniskowych, nerki wydolne, bez wolnego płynu" to ~80 znaków — Whisper zazwyczaj zwraca więcej). Próg 50 znaków generował fałszywe alarmy dla standardowych krótkich opisów i uczył użytkownika ignorować banery.

**Obsługa błędów — transcribe:**
- Brak uprawnień mikrofonu: `getUserMedia()` rzuca `NotAllowedError` → UI: "Brak dostępu do mikrofonu. Sprawdź uprawnienia przeglądarki." przed próbą nagrania
- Whisper 429 / timeout: UI: "Transkrypcja niedostępna. Spróbuj ponownie lub wpisz tekst ręcznie." z polem textarea jako fallback
- MediaRecorder MIME: `audio/webm;codecs=opus` (Chrome/Edge), fallback `audio/mp4` (Safari) — wykryć przez `MediaRecorder.isTypeSupported()`. Plik wysyłać z rozszerzeniem `.webm` lub `.mp4` — Whisper wymaga rozszerzenia do wykrycia formatu

### Generowanie raportu z transkrypcji (`/api/ai/generate-report`)

**Input:** transkrypcja, rola (`radiologist` | `doctor`), examinationType, examinationContext, patientAge, patientGender, language

**System prompt — radiolog (Warstwa 1 + Warstwa 2):**
```
[WARSTWA 1 — stała, cachowana]
Jesteś asystentem transkrypcji radiologicznej.

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

Zwróć wyłącznie poprawny JSON:
{
  "findings": [{
    "text": string,
    "isDeviation": boolean,
    "confidence": "high" | "medium" | "low",
    "anatomicalLocation": string
  }],
  "impression": string,
  "transcriptionIssues": string[]
}

[WARSTWA 2 — kontekst domenowy per typ badania z examTypePrompts.ts]
```

**User message — radiolog:**
```
### DANE KLINICZNE
Typ badania: {examinationType}
Pacjent: {patientGender === 'F' ? 'kobieta' : 'mężczyzna'}, {patientAge} lat
{menstrualCyclePhase ? `Faza cyklu: {menstrualCyclePhase}` : ''}
{fastingStatus ? `Status na czczo: {fastingStatus}` : ''}
Wskazanie kliniczne: {clinicalIndication}
Język raportu: {language}

### TRANSKRYPCJA DYKTOWANIA RADIOLOGA
"{transcription}"
```

**System prompt — lekarz:**
```
Jesteś asystentem dokumentacji klinicznej.

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
}
```

**User message — lekarz:**
```
Pacjent: {patientAge} lat, płeć: {patientGender}
Język raportu: {pl|en}
{radiologicalReport ? `Raport radiologiczny USG (kontekst):
---
${radiologicalReport.rawText}
---
Gdy lekarz odnosi się do wyników USG, uwzględnij to w sekcji diagnosis.` : ""}

Transkrypcja wizyty:
"{transcription}"
```

### Wewnętrzna architektura AI pipeline (analyze-image)

Użytkownik wykonuje dokładnie te same czynności — wrzuca obrazy, klika "Generuj". Wewnątrz `/api/ai/analyze-image` pracuje trójstopniowy pipeline poprawiający jakość draftu bez dodatkowego inputu od radiologa.

```
Images
↓
[Etap 1] Structured Intermediate Representation (SIR)
↓
[Etap 2] Multi-Step Clinical Reasoning
↓
[Etap 3] AI Reviewer (Self-Critique)
↓
Final Draft → User
```

---

#### Etap 1 — Structured Intermediate Representation (SIR)

AI nie tworzy raportu od razu. Najpierw generuje ustrukturyzowany opis badania per organ — oddzielając **obserwacje** od **interpretacji**.

**Prompt Etapu 1:**
```
Opisz wyłącznie to co WIDZISZ na obrazach. Nie interpretuj, nie klasyfikuj, nie generuj raportu.
Zwróć JSON z opisem każdej widocznej struktury: rozmiar, echogeniczność, marginesy, obecność zmian.
```

**Przykład SIR dla USG tarczycy:**
```json
{
  "thyroid": {
    "rightLobe": { "visible": true, "dimensions": "normal", "echotexture": "homogeneous" },
    "leftLobe": { "visible": true, "dimensions": "normal", "echotexture": "heterogeneous" },
    "nodule": { "size": "8mm", "echogenicity": "hypoechoic", "margin": "irregular", "microcalcifications": true }
  },
  "lymphNodes": { "visible": false }
}
```

**Efekt:** Mniej pominiętych struktur, lepsza spójność findings ↔ impression, mniejsza liczba hallucynacji (model "widzi" zanim "interpretuje"). SIR nie jest pokazywane użytkownikowi — istnieje tylko wewnętrznie jako wejście do Etapu 2.

---

#### Etap 2 — Multi-Step Clinical Reasoning Pipeline

SIR przechodzi przez sekwencję wyspecjalizowanych promptów zamiast jednego "zrób wszystko" prompt:

```
SIR
↓ Prompt A: Anatomy Detection → identifiedStructures[]
↓ Prompt B: Observation Extraction → observations[] (bez interpretacji)
↓ Prompt C: Abnormality Detection → normalFindings[], abnormalFindings[]
↓ Prompt D: Classification → classifications[] (TI-RADS, BI-RADS etc. per znalezisko)
↓ Prompt E: Report Generation → findings[], impression, imagingLimitations
```

Każdy prompt robi JEDNĄ rzecz — model nie musi jednocześnie wykrywać struktur, oceniać patologii, przypisywać klasyfikacji i pisać raportu. Specjalizacja promptów → dokładniejsze wykrywanie patologii, mniej błędów klasyfikacyjnych, lepsza zgodność z checklistami domenowymi z `examTypePrompts.ts`.

**Implementacja:** Wszystkie etapy w `claude.ts` jako sekwencja wywołań — jeden `analyze-image` call po stronie API nadal zwraca `{ structuredFindings, reportDraft }`. Złożoność ukryta wewnętrznie.

---

#### Etap 3 — AI Reviewer (Self-Critique Layer)

Drugi model (lub drugi prompt) weryfikuje draft raportu zanim trafi do użytkownika.

**Prompt Reviewer:**
```
Jesteś doświadczonym radiologiem weryfikującym draft raportu USG.
Sprawdź:
1. Completeness — czy wszystkie obowiązkowe struktury z checklisty zostały ocenione?
2. Consistency — czy wnioski (impression) logicznie wynikają ze znalezisk?
3. Classification — czy klasyfikacje (TI-RADS, BI-RADS etc.) są poprawnie uzasadnione?
4. Hallucinations — czy raport nie zawiera struktur/wymiarów niewidocznych na obrazach?

Zwróć JSON: { issues: string[], corrections: Array<{ field, original, corrected }>, approved: boolean }
```

**Auto-correction:**
```
Draft → Reviewer → issues[] → Correction prompt → Final Draft → User
```

Jeśli `approved: true` — draft trafia do użytkownika bez zmian (typowy przypadek dla dobrego obrazu).
Jeśli `approved: false` — Claude generuje poprawioną wersję uwzględniającą `corrections[]`.
Użytkownik widzi wyłącznie wersję końcową — zero dodatkowych kroków.

**Efekt:** Wyższy jakościowo pierwszy draft, mniej ręcznych poprawek radiologa, większe zaufanie do AI.

Output `analyze-image` i `generate-report` rozszerzony o `aiQualityCheck: AiQualityCheck` — wynik Etapu 3 przekazywany do UI jako Case D panel.

---

### Case D — AI Quality Review Flow

Nie jest osobnym workflow klinicznym. Uruchamiany automatycznie po każdym wygenerowaniu draftu (Case A, B i C). Użytkownik nie wykonuje żadnych dodatkowych kroków.

**Co sprawdza per case:**

*Case A (analiza obrazu):*
- jakość obrazu: diagnostic / suboptimal / non_diagnostic
- kompletność obowiązkowych struktur dla danego typu USG
- zgodność findings z impression
- poprawność klasyfikacji formalnych (TI-RADS, BI-RADS, Bosniak, O-RADS)
- czy findings nie zawierają struktur niewidocznych na obrazie
- czy low-confidence findings nie są przedstawione jako pewne rozpoznania

*Case B (dyktowanie):*
- jakość transkrypcji
- niejasne fragmenty (korekty w locie, liczby bez jednostek)
- braki względem checklisty danego typu badania
- opcjonalna walidacja z obrazami jeśli dostępne

*Case C (wizyta lekarza):*
- rozróżnienie wypowiedzi lekarza i pacjenta
- zgodność notatki z raportem radiologicznym
- czy zalecenia wynikają z rozmowy lub raportu
- niejasne elementy wizyty (`uncertainItems`)
- czy wersja dla pacjenta nie dodaje nowych faktów medycznych

**Reguły confidence routing:**
- `confidence: 'high'` → trafia do raportu formalnego jako standardowy finding
- `confidence: 'medium'` → trafia do raportu formalnego z badge'em; jeśli dotyczy istotnego odchylenia → `QualityCheckItem` status `warning`
- `confidence: 'low'` → trafia do sekcji "Wymaga weryfikacji" (nie do raportu formalnego). Musi być oznaczone językiem niepewności jeśli radiolog zdecyduje się je przenieść
- `blocked` → gdy `imageQuality === 'non_diagnostic'` LUB transkrypcja zbyt krótka/niezrozumiała → UI odblokowuje ręczny edytor, jasny komunikat o powodzie

**Prompt addition (do wszystkich generate prompts):**
```
REGUŁY CONFIDENCE ROUTING:
- Nie przedstawiaj finding z confidence "low" jako pewnego rozpoznania
- Finding z confidence "low" trafia do imagingLimitations lub sekcji unresolvedItems quality check
- Impression może zawierać wyłącznie findings z confidence "high" lub "medium"
```

---

### Multimodal Radiologist Copilot (`/api/ai/fuse-findings`)

Trzeci tryb generowania — radiolog uploaduje obrazy I jednocześnie nagrywa dyktowanie. AI analizuje oba źródła równolegle, a następnie łączy wyniki w warstwie fuzji.

**Pipeline:**

```
Step 1 (równolegle):
  analyze-image → findingsFromImages: Finding[]
  transcribe + generate-report → findingsFromSpeech: Finding[]

Step 2 — Fusion Layer (/api/ai/fuse-findings):
  Input: findingsFromImages + findingsFromSpeech
  Output: FusionResult {
    confirmedFindings   // finding widoczny NA OBRAZIE i WSPOMNIANY w dyktowaniu → confidence +1 poziom
    imageOnlyFindings   // widoczny na obrazie, niepomnany — AI sugeruje radiologowi sprawdzenie
    speechOnlyFindings  // powiedziane przez radiologa, nieznalezione na obrazie
    conflicts           // sprzeczność: radiolog mówi "8mm", obraz pokazuje co innego
  }
```

**Przykład konfliktu wyświetlanego w UI:**
> "Zmiana opisana przez radiologa nie została odnaleziona na dostarczonych obrazach. Możliwe: obraz wykonany przed lub po zmianie lokalizacji głowicy."

**Efekt dla demo:** AI przestaje wyglądać jak generator tekstu — wygląda jak inteligentny współpracownik który weryfikuje czy radiolog czegoś nie przeoczył lub nie pomylił.

**Prompt fusion layer (System):**
```
Masz wyniki dwóch niezależnych analiz tego samego badania USG:
- Analiza obrazów: lista findings z confidence i lokalizacją
- Analiza dyktowania radiologa: lista findings z confidence i lokalizacją

Porównaj oba zestawy. Nie zakładaj sprzeczności bez wyraźnych dowodów — wiele pozornych różnic wynika z ujęcia głowicy lub fazy oddechu.
Zwróć JSON z: confirmedFindings (oba źródła zgodne), imageOnlyFindings, speechOnlyFindings, conflicts (tylko gdy jednoznaczna sprzeczność).
```

---

### Two-Step AI Pipeline (analiza obrazu)

Wewnętrznie `analyze-image` działa dwuetapowo — ujawnione w UI dla efektu demo:

**Step 1 — Vision Extraction:** Claude wyciąga surowe obserwacje z obrazu w języku angielskim (`observations: string[]`). Np. `["hypoechogenic lesion", "8mm", "right thyroid lobe", "irregular margins"]`.

**Step 2 — Report Generation:** Claude przetwarza obserwacje + kontekst domenowy → strukturyzowane findings z confidence, klasyfikacje formalne (TI-RADS etc.), impression.

**UI:** Między krokami wyświetlić sekcję "Surowe obserwacje AI" jako collapsible — stakeholder widzi co AI „widzi" zanim przetworzy to w raport. Silny efekt demonstracyjny transparentności.

---

### Evidence Layer

Każde finding generowane przez AI zawiera pole `evidence` — skąd AI wzięło to znalezisko:

```typescript
evidence: {
  imageIndexes: [1, 3]           // obraz nr 2 i nr 4 (0-based) potwierdzają finding
  transcriptFragments: ["zmiana 8 mm w prawym płacie"]  // cytat z dyktowania
}
```

**UI `evidence-viewer`:** Kliknięcie ikony "źródło" przy finding otwiera panel:
- Miniatury powiązanych obrazów (podświetlone jeśli możliwe, lub po prostu wskazane numerem)
- Cytat z transkrypcji jeśli dostępny

**Prompt addition (do Warstwy 1 `analyze-image`):**
```
Dla każdego finding podaj: imageIndexes (tablica indeksów obrazów 0-based, na których widoczne).
Dla każdego finding z generate-report podaj: transcriptFragments (cytaty verbatim z transkrypcji).
```

---

### Differential Diagnosis

AI generuje listę możliwych rozpoznań dla każdego signifikantnego finding w raporcie radiologicznym.

**Prompt addition (do generate-report dla radiologa):**
```
Dla każdej istotnej zmiany ogniskowej lub niepewnego znaleziska wygeneruj maksymalnie 3 rozpoznania różnicowe.
Każde: { diagnosis: string, confidence: 'high'|'medium'|'low', rationale: string (max 150 znaków) }
```

**Output field:** `RadiologicalReport.aiSuggestions[]` (type: `'differential_diagnosis'`)

**Kluczowa reguła:** Differential diagnosis są sugestiami AI — **domyślnie nie są częścią formalnego raportu**. Radiolog może je ręcznie wykorzystać. Każdy element ma `rationale` i `confidence`. Przycisk "Dodaj do raportu" per suggestion.

**UI `ai-suggestions`:** Sekcja "AI Suggestions" poniżej raportu formalnego, wyraźnie oddzielona. Nagłówek: "Te elementy nie zostały automatycznie dodane do raportu."

---

### AI Insights

Obserwacje AI wykraczające poza formalne findings — dodawane do `aiSuggestions[]` (type: `'additional_observation'`), nie do raportu automatycznie.

**Prompt addition:**
```
Jeśli widzisz cokolwiek godnego uwagi co NIE kwalifikuje się jako finding, dodaj do aiInsights[].
Max 3 insights. Każdy: { title: string (max 60 znaków), description: string (max 200 znaków) }
```

**UI `ai-suggestions`:** Obserwacje i differential diagnosis renderowane razem w jednej sekcji "AI Suggestions" — oddzielnej od raportu formalnego.

---

### Patient Communication Generator (`/api/ai/generate-patient-explanation`)

**Case A / radiolog:** Generowane po zatwierdzeniu raportu — przycisk "Generuj wyjaśnienie dla pacjenta".
**Case C / lekarz:** Generowane **jednocześnie** z raportem lekarskim — od razu dostępne jako draft w panelu "Dla pacjenta", edytowalny przed zatwierdzeniem.

**Input:** `reportId` + opcjonalnie `transcription` (dla Case C)

**System prompt:**
```
Jesteś asystentem komunikacji medycznej.
ZASADY:
- Nie dodawaj żadnych faktów medycznych których nie ma w raporcie źródłowym
- Unikaj terminologii łacińskiej — zastąp polskim odpowiednikiem
- Nie bagatelizuj ani nie dramatyzuj — zachowaj niepewność jeśli raport ją zawiera
- Rozdziel: "co znaleziono" / "co to oznacza" / "co dalej"
Zwróć JSON: { plainLanguageSummary, keyFindings[], nextSteps[], followUp }
```

**Output:** `PatientExplanation` (structured) zapisane w RadiologicalReport lub MedicalReport.

**UI (Case A):** Osobna zakładka "Dla pacjenta" po zatwierdzeniu — sekcje keyFindings, nextSteps, followUp. Do wydruku lub przekazania (poza zakresem POC).
**UI (Case C):** Panel "Dla pacjenta" renderowany obok raportu lekarskiego — draft edytowalny, zatwierdzany razem z raportem.

---

### Confidence — UI

| Poziom | Kolor badge | Etykieta tekstowa (PL) | Etykieta tekstowa (EN) |
|--------|-------------|------------------------|------------------------|
| high | Zielony | "pewne" | "high" |
| medium | Żółty | "niepewne" | "medium" |
| low | Czerwony | "wątpliwe" | "low" |

Badge zawiera zawsze kolor TŁA + etykietę tekstową. Kolor nigdy nie jest jedynym rozróżnieniem (WCAG 1.4.1 — Color Use).

| imageQuality | UI |
|---|---|
| diagnostic | Brak komunikatu — analiza wyświetlana normalnie |
| suboptimal | Żółty baner: "Obraz suboptimalny — {qualityIssues}. Wyniki mogą być ograniczone." |
| non_diagnostic | Czerwony baner: "Obraz niediagnostyczny — {qualityIssues}. Analiza AI niemożliwa." + przycisk "Kontynuuj bez AI" który odblokowuje pusty edytor. Radiolog może nie zgadzać się z oceną AI i wpisać raport ręcznie. |

| transcriptionQuality | UI (lekarz) |
|---|---|
| good | Brak komunikatu |
| partial | Żółty baner: "Transkrypcja częściowa — sprawdź nagranie przed zatwierdzeniem." |
| poor | Czerwony baner: "Transkrypcja słabej jakości — weryfikacja wymagana." |

Baner `transcriptionQuality` musi być widoczny w edytorze raportu lekarskiego PRZED przyciskiem "Zatwierdź i zapisz".

---

## Flow radiologa — szczegółowy

### Case A — Image-to-Report / Case B — Voice-to-Report

Radiolog wybiera tryb generowania na etapie kroku 4. Reszta flow identyczna.

1. **Login** → przekierowanie do Dashboard
2. **Dashboard** → lista jego badań (data, pacjent, typ, status), przycisk "Nowe badanie"
3. **Nowe badanie:**
   - Wybierz pacjenta: `patient-selector` (combobox, wyszukiwanie po imieniu/nazwisku/PESEL) + link "Dodaj nowego pacjenta"
   - Typ badania: `examination-type-select` (searchable combobox z predefiniowaną listą + własny wpis)
   - **Pola kontekstowe** — `examination-context-fields` renderuje je warunkowo po wyborze typu badania:
     - USG ginekologiczne (TV/TA): dropdown **Faza cyklu** (folikularna / lutealna / menopauza / ciąża / antykoncepcja)
     - USG jamy brzusznej / wątroby / pęcherzyka / trzustki: checkbox **Pacjent na czczo (>6h)**
     - Opcjonalnie dla wszystkich: pole **Wartości lab ze skierowania** (wolny tekst, np. "TSH 6.2 mIU/L")
   - Wskazanie kliniczne: pole tekstowe (opcjonalne, przepisane ze skierowania)
   - Upload zdjęć: drag & drop, max 5 plików, max **10 MB** każdy (walidacja client-side), podgląd miniatur. Limit 10MB po stronie klienta — sharp na serwerze reskaluje do 1568px (wynik zwykle <2MB). Limit 5MB odrzucałby realne pliki z aparatów USG przed preprocessingiem.
   - Komentarze: textarea (opcjonalne)
4. **Generowanie draftu** (trzy tryby do wyboru):
   - Przycisk **"Generuj ze zdjęcia"** → Two-Step Pipeline: surowe obserwacje AI (collapsible) → findings z confidence w edytorze
   - Przycisk **"Nagraj głos"** → REC (czerwona pulsująca ikona) → STOP → **Whisper zwraca surową transkrypcję natychmiast** (wyświetlana w readonly preview poniżej przycisku) → **Claude przetwarza w tle** → gdy gotowy, draft zastępuje preview w edytorze. Radiolog może od razu sprawdzić czy Whisper dobrze zrozumiał terminy medyczne, podczas gdy Claude strukturyzuje findings — eliminuje odczucie "czekam na nic".
   - Przycisk **"Analizuj wielomodalnie"** (aktywny tylko gdy są ZARÓWNO obrazy jak i nagranie) → Multimodal pipeline: analiza obrazów + transkrypcja → Fusion Layer → widok FusionResult z sekcjami: Potwierdzone / Tylko na obrazie / Tylko w dyktowaniu / Konflikty
5. **Edytor raportu** — dwa obszary wizualnie oddzielone:

   **Raport formalny** (4 sekcje edytowalne):
   - **Znaleziska (high/medium confidence)** — lista strukturalna. Każde finding z badge confidence + ikona "źródło" (`evidence-viewer`). Po edycji badge zastępowany ikoną "zmodyfikowane ✎".
   - **Wymaga weryfikacji** — oddzielna sekcja na findings z `confidence: 'low'`. Etykieta: "Te elementy wymagają weryfikacji — AI nie było pewne." Nie są przedstawiane jako pewne rozpoznania. Radiolog może je przenieść do raportu formalnego lub usunąć.
   - **Wnioski** (`impression`) — textarea
   - **Ograniczenia badania** (`imagingLimitations`) — textarea
   - **Zalecenia** (`radiologistRecommendations`) — textarea

   **AI Suggestions** (poza raportem formalnym, `ai-suggestions.tsx`):
   - Możliwe rozpoznania różnicowe z confidence i rationale
   - Dodatkowe obserwacje AI (`aiInsights`)
   - Nagłówek: "Te elementy nie zostały automatycznie dodane do raportu. Możesz je ręcznie wykorzystać podczas edycji."
   - Przycisk "Dodaj do raportu" per suggestion → wstawia tekst do odpowiedniej sekcji

   **AI Quality Check** (`quality-check-panel.tsx`) — kompaktowy panel nad przyciskiem "Zatwierdź":
   ```
   AI Quality Check
   Status: Gotowe do weryfikacji / Wymaga uwagi / Zablokowane

   ✓ Kompletność struktur
   ✓ Spójność opisu i wniosków
   ⚠ Niska pewność: 2 elementy → sekcja "Wymaga weryfikacji"
   ⚠ Klasyfikacja TI-RADS wymaga potwierdzenia cech punktowanych
   ```
   Panel wspiera szybkie skanowanie — radiolog widzi co wymaga uwagi bez szukania w całym raporcie.
   
   Draft z AI oznaczony stałym badge'em "Wygenerowane przez AI — wymaga weryfikacji" (widoczny dopóki status = draft). Po zatwierdzeniu: badge zmienia się na "Raport zatwierdzony przez [imię] — [data]. Źródło AI: [zdjęcia USG | nagranie głosowe | multimodal]" — zachowuje proweniencję AI w finalnym dokumencie. Źródło mapuje się z pola `analysisMode` raportu.

   Walidacja przed zatwierdzeniem: przycisk "Zatwierdź" zablokowany gdy `findings[]` jest puste ORAZ `impression` jest puste — przynajmniej jedno z nich musi być wypełnione.

6. **Przycisk "Zatwierdź raport"** → dialog potwierdzający → `status: approved`, `approvedAt: timestamp` → raport read-only z oznaczeniem "ZATWIERDZONE [data]" → przycisk **"Generuj wyjaśnienie dla pacjenta"** (jednorazowy, po zatwierdzeniu)

---

## Flow lekarza — szczegółowy

### Case C — Doctor Visit-to-Patient-Report

AI automatycznie: odróżnia wypowiedzi lekarza od pacjenta, wyciąga rozpoznanie i zalecenia, powiązuje rozmowę z raportem radiologicznym, generuje raport lekarski **i** wersję dla pacjenta jednocześnie.

1. **Login** → Dashboard
2. **Dashboard** → lista jego wizyt (data, pacjent, status), przycisk "Nowa wizyta"
3. **Nowa wizyta:**
   - Wybierz pacjenta: `patient-selector` (combobox)
   - Wybierz raport radiologiczny: `report-selector` (dropdown z listą zatwierdzonych raportów pacjenta — data, typ badania, radiolog)
4. **Podgląd raportu radiologicznego** — sticky sidebar widoczny podczas całego flow wizyty (nie znika po przewinięciu). Pokazuje: `impression` i `radiologistRecommendations` na górze (najważniejsze dla lekarza), pełna lista findings poniżej z badge confidence. Lekarz może zwinąć/rozwinąć sidebar. Jeśli nie wybrano raportu radiologicznego (`radiologicalReportId` opcjonalne) — sekcja ukryta, lekarz dyktuje bez kontekstu USG.
5. **"Nagraj wizytę"** → REC → rozmowa z pacjentem → STOP → **Whisper zwraca surową transkrypcję natychmiast** (wyświetlana w readonly preview) → **Claude przetwarza w tle** → draft zastępuje preview. Lekarz może od razu sprawdzić transkrypcję (np. czy Whisper poprawnie rozumiał nazwy leków) podczas gdy Claude buduje sekcje raportu.
6. **Edytor — dwa panele obok siebie:**

   **Panel lewy — Raport medyczny (dla lekarza):**
   - **Wywiad** (`anamnesis`) — podmiotowy i przedmiotowy
   - **Rozpoznanie** (`diagnosis`) — z prefiksem gdy niepewne
   - **Zalecenia** (`recommendations`)
   - Elementy `uncertainItems[]` inline jako `[WYMAGA WERYFIKACJI]`
   - **AI Quality Check** — kompaktowy panel: spójność z raportem radiologicznym, rozróżnienie lekarza/pacjenta, niejasne elementy wizyty

   **Panel prawy — Dla pacjenta (draft edytowalny):**
   - `plainLanguageSummary` — co znaleziono (bez terminologii łacińskiej)
   - `keyFindings[]` — lista kluczowych wyników
   - `nextSteps[]` — co pacjent powinien zrobić
   - `followUp` — zalecana kontrola
   - Badge: "AI wygenerowała tę wersję na podstawie raportu i rozmowy. Nie dodaje nowych faktów medycznych."
   - Edytowalna przed zatwierdzeniem — lekarz może zmodyfikować język

   Jeśli `transcriptionQuality === 'partial'` lub `'poor'` → baner widoczny nad przyciskiem zatwierdzenia.

7. **"Zatwierdź i zapisz"** → dialog potwierdzający → `status: approved` dla raportu lekarskiego i wersji pacjenckiej jednocześnie

AI generuje raport w języku aktualnie wybranym w przełączniku PL/EN. Zmiana języka po wygenerowaniu draftu **nie** tłumaczy istniejącej treści — toast: "Wygenerowany raport jest w języku [PL/EN]. Zmiana języka interfejsu nie wpływa na treść raportu."

---

## Lista typów badań USG (combobox)

**Z dedykowanym kontekstem domenowym w `examTypePrompts.ts`:**
USG jamy brzusznej, USG tarczycy, USG nerek, USG wątroby, USG pęcherzyka żółciowego, USG trzustki, USG śledziony, USG prostaty, USG ginekologiczne transwaginalne (TV), USG ginekologiczne przezbrzuszne (TA), USG piersi, USG tkanek miękkich, USG Doppler tętnic szyjnych, USG Doppler tętnic kończyn dolnych, USG Doppler żylny kończyn dolnych (DVT), USG węzłów chłonnych, USG moszny i jąder, USG układu mięśniowo-szkieletowego (MSK), echokardiografia

**Oraz możliwość wpisania własnego** — fallback prompt generyczny.

Uwaga: "USG naczyniowe (Doppler)" rozbite na konkretne typy — każdy Doppler ma inne normy i inne protokoły.

---

## Profil pacjenta — pola

| Pole | Typ | Wymagane |
|------|-----|----------|
| Imię | text | tak |
| Nazwisko | text | tak |
| PESEL | text (11 cyfr) | tak |
| Płeć | M / K | tak |
| Data urodzenia | date | tak |

---

## Golden Demo Cases — scenariusze prezentacyjne

Cztery pre-seedowane scenariusze w in-memory store — deterministyczne dane syntetyczne. Presenter wybiera case z dashboardu i pokazuje konkretny element "wow" bez ryzyka niespodzianki.

### Case A — USG tarczycy (image-to-report)
- **Pacjent:** Syntetyczny, kobieta 52 lata, wskazanie: "guzek tarczycy do oceny"
- **Obrazy:** 3 syntetyczne zdjęcia USG tarczycy z widoczną zmianą hipoechogeniczną 8mm lewego płata
- **Oczekiwane AI:** TI-RADS 4, zmiana 8mm, echogeniczność niska, marginesy nieregularne, mikrozwapnienia — confidence high/medium, evidence wskazuje na obraz 2 i 3
- **Element "wow":** AI przypisuje klasyfikację formalną (TI-RADS 4), pokazuje z których obrazów wynika finding, AI Suggestions zawiera rozpoznanie różnicowe

### Case B — USG jamy brzusznej (voice-to-report)
- **Pacjent:** Syntetyczny, mężczyzna 61 lat, wskazanie: "bóle brzucha, kontrola"
- **Transkrypcja:** Pre-nagrana lub pre-wpisana — zawiera korektę w locie ("nerka lewa, nie, prawa"), liczbę z jednostką ("torbiel pięć milimetrów"), pewien element niejasny
- **Oczekiwane AI:** Ustrukturyzowany raport z obsługą korekty radiologa, liczba przetworzona na "5 mm", niejasny element trafia do AI Quality Check jako warning
- **Element "wow":** Z chaotycznego dyktowania powstaje profesjonalny raport; Quality Check pokazuje co wymagało uwagi

### Case C — Wizyta lekarza z pacjentem
- **Pacjent:** Ten sam co Case A lub Case B (ciągłość ścieżki)
- **Raport radiologiczny:** Zatwierdzony raport z Case A
- **Transkrypcja wizyty:** Pre-nagrana — lekarz i pacjent rozmawiają naprzemiennie, lekarz omawia wyniki USG
- **Oczekiwane AI:** Notatka lekarska (anamnesis/diagnosis/recommendations) + wersja dla pacjenta jednocześnie. AI rozróżnia wypowiedzi lekarza od pacjenta. Raport powiązany z wynikami USG.
- **Element "wow":** Jedno nagranie → dwa dokumenty. Wersja dla pacjenta prostym językiem, bez terminologii łacińskiej.

### Case D — AI Quality Review / Conflict
- **Pacjent:** Syntetyczny, mężczyzna 45 lat, USG tarczycy
- **Obrazy:** Niska jakość (suboptimal) + element low-confidence (struktura częściowo zasłonięta)
- **Oczekiwane AI:** imageQuality: suboptimal → żółty baner. Finding low-confidence trafia do "Wymaga weryfikacji", nie do raportu formalnego. AI Quality Check pokazuje warning. AI Suggestions zawiera obserwację której AI nie mogło potwierdzić.
- **Element "wow":** AI nie udaje pewności — otwarcie komunikuje co wymaga weryfikacji i dlaczego.

---

## Znane ograniczenia kliniczne (POC)

- `ExaminationContext` nie zawiera dedykowanego pola `allergies` — alergie trafiają do komentarzy jako wolny tekst
- `imageQuality` jest oceną globalną badania, nie per-narząd — USG jamy brzusznej może mieć widoczną wątrobę (diagnostic) i niewidoczną trzustkę (non_diagnostic); AI opisuje to w `imagingLimitations`
- Parametry Dopplera (PSV, EDV, RI) niewidoczne na statycznym zdjęciu — AI nie może ich ocenić, pochodzi wyłącznie z dyktowania głosowego
- Klasyfikacje Bosniak IIF+ wymagają CT/MRI — AI klasyfikuje z USG tylko kategorie I i II, wyższe opisuje jako "wymaga badania kontrastowego"
- `transcriptionQuality` jest szacowany heurystycznie (długość, ostrzeżenia Whisper) — nie jest to pomiar obiektywny
- **Aplikacja jest narzędziem demonstracyjnym — nie jest certyfikowanym wyrobem medycznym i nie może być stosowana jako jedyne narzędzie diagnostyczne w warunkach klinicznych.** Wszystkie raporty wymagają weryfikacji i zatwierdzenia przez uprawnionego specjalistę. Szczegółowy plan przygotowania do wdrożenia produkcyjnego: `docs/TODO.md`

## Disclaimer AI w UI

Stały pasek informacyjny w `(app)/layout.tsx` — widoczny na każdej stronie aplikacji, nieusuwany przez użytkownika:

> "System AI wspomagający — wszystkie raporty wymagają weryfikacji i zatwierdzenia przez uprawnionego specjalistę. Nie stosować jako jedynego narzędzia diagnostycznego."

Każdy draft raportu (przed zatwierdzeniem) oznaczony badge'em: **"Wygenerowane przez AI — wymaga weryfikacji"**. Po zatwierdzeniu przez radiologa/lekarza: badge zmienia się na **"Raport zatwierdzony przez [imię] — [data]. Źródło AI: [zdjęcia USG | nagranie głosowe | multimodal]"** i raport staje się read-only. Adnotacja o proweniencji AI pozostaje widoczna w finalnym dokumencie.

---

## Middleware i bezpieczeństwo

- `middleware.ts` chroni wszystkie trasy `/(app)/*` — redirect do `/login` jeśli brak sesji
- Sesja jako signed HTTP-only cookie (AUTH_SECRET)
- Brak wrażliwych danych w lokalnym storage przeglądarki
- API keys tylko po stronie serwera (nigdy w kliencie)
- Walidacja rozmiaru i typu pliku po stronie klienta I serwera
- Timeout sesji nieaktywnej: po 10 min nieaktywności toast ostrzegawczy "Sesja wygaśnie za 5 minut — zapisz raport". Po 15 min nieaktywności: invalidacja sesji po stronie serwera, redirect do `/login`. Standardowe minimum dla systemów zawierających dane medyczne.

---

## Deployment

Deployment przez integrację GitHub ↔ Vercel — zero dodatkowych narzędzi CLI.

1. Repo podłączone do Vercel przez panel (github.com → Vercel dashboard)
2. Każdy push na `main` triggeruje automatyczny deploy
3. Zmienne środowiskowe ustawiane raz w panelu Vercel (Settings → Environment Variables):

```
ANTHROPIC_API_KEY
OPENAI_API_KEY
AUTH_SECRET
```

**Wymagany Vercel Pro plan** — Claude Vision z extended thinking zajmuje 20–40s, Whisper transkrypcja ~10–15s. Domyślny timeout Vercel Hobby to 10s → 504 Gateway Timeout. Każdy AI route handler musi mieć:

```typescript
export const maxDuration = 60  // sekund — wymaga Pro planu
```

Brak `vercel` CLI, brak dodatkowych bibliotek Vercel w projekcie.
