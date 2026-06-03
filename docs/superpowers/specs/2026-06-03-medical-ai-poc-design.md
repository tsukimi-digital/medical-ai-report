# Medical AI POC — Design Spec
**Data:** 2026-06-03  
**Status:** Zatwierdzony  
**Typ:** POC / Demo dla klienta

---

## Cel

Demo aplikacji usprawniającej pracę radiologa i lekarza przez automatyzację tworzenia raportów medycznych z użyciem AI (analiza obrazu USG + transkrypcja głosu). Aplikacja pokazuje klientowi nowy flow pracy i pozwala ocenić czy automatyzacja faktycznie przyspiesza pracę.

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
ANTHROPIC_API_KEY=...   # Claude Vision + generowanie raportów
OPENAI_API_KEY=...      # Whisper transkrypcja
AUTH_SECRET=...         # Podpisywanie cookie sesji
```

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
        /analyze-image/route.ts      # Claude Vision → findings z confidence
        /transcribe/route.ts         # audio → Whisper → tekst
        /generate-report/route.ts    # tekst + rola → Claude → draft raportu
    /(auth)
      /login/page.tsx
    /(app)
      /layout.tsx                    # Navbar z przełącznikiem PL/EN + logout + stały disclaimer AI
      /dashboard/page.tsx            # Role-based dashboard
      /patients/page.tsx             # Lista pacjentów
      /patients/new/page.tsx         # Formularz nowego pacjenta
      /patients/[id]/page.tsx        # Profil pacjenta + historia raportów
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
    /image-uploader.tsx              # Drag & drop, max 5 plików, max 5MB każdy
    /examination-context-fields.tsx  # Pola kontekstowe zależne od typu badania (faza cyklu, czczo)
    /report-editor.tsx               # Edytor raportu (textarea z AI badge)
    /findings-list.tsx               # Lista znalezisk z confidence badge
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
  images: Array<{                   // max 5 zdjęć, max 5MB każde (preprocessowane do 1568px)
    base64: string
    mimeType: string
    filename: string
  }>
  imageQuality?: ImageQuality       // ocena jakości obrazu przez AI
  comments: string                  // komentarze radiologa przed generowaniem (opcjonalne)
  findings: Finding[]               // znaleziska z confidence (jeśli AI)
  impression?: string               // wnioski kliniczne — najważniejsza część raportu
  radiologistRecommendations?: string  // zalecenia radiologa (BAC, kontrola, konsultacja)
  imagingLimitations?: string       // co AI nie mogło ocenić i dlaczego
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
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
}
```

---

## In-Memory Store

Moduł-level singleton — jeden obiekt z Mapami dla każdego typu danych. Pre-seedowany przy pierwszym imporcie.

**Pre-seed danych demo:**
- 3 pacjentów z wypełnionymi danymi
- 2–3 zatwierdzonych raportów radiologicznych (różne typy badań)
- 1 roboczego draftu raportu lekarskiego

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

**Input:** `multipart/form-data` — pola: `images` (1–5 plików binarnych, max 5MB każdy), `examinationType`, `clinicalIndication`, `examinationContext` (JSON string), `comments`, `patientAge`, `patientGender`, `language`

Klient: `FormData.append('images', blob, filename)`. Serwer: `request.formData()` → preprocessing sharp po stronie serwera → base64 do store.

Powód `multipart` zamiast JSON: base64 w JSON body zwiększa rozmiar o ~33% — 5 obrazów × 5MB = ~33MB zakodowanego JSON przekracza limit Vercel 4.5MB. `multipart/form-data` wysyła dane binarne bez narzutu base64.

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
- `thinking: { type: 'enabled', budget_tokens: 8000 }` — włączone gdy `imageCount ≥ 3` lub `imageQuality === 'suboptimal'`
- `temperature: 0` — TYLKO gdy thinking wyłączone (Anthropic API odrzuca `temperature` ≠ 1 gdy thinking aktywne)
- `max_tokens: 10000` gdy thinking aktywne / `1500` gdy wyłączone (`max_tokens` musi być > `budget_tokens`)
- `cache_control: { type: 'ephemeral' }` na Warstwie 1+2 system promptu

```typescript
const useThinking = imageCount >= 3 || imageQuality === 'suboptimal'
const apiParams = {
  model: 'claude-sonnet-4-6',
  max_tokens: useThinking ? 10000 : 1500,
  ...(useThinking
    ? { thinking: { type: 'enabled', budget_tokens: 8000 } }
    : { temperature: 0 })
}
```

**Output:** `imageQuality` + `Finding[]` + `impression` + `imagingLimitations`.
Gdy `imageQuality === 'non_diagnostic'` — UI pokazuje czerwony baner, findings ukryte.

**Obsługa błędów — analyze-image:**
- Timeout: 45s (ustaw `export const maxDuration = 60` w route handler — wymaga Vercel Pro)
- Błąd API Anthropic (4xx/5xx): UI pokazuje "Analiza niedostępna. Spróbuj ponownie lub kontynuuj ręcznie." z przyciskiem ponowienia
- Retry: max 1 auto-retry z korektywnym komunikatem `"Your previous response was not valid JSON. Return ONLY the JSON object:"` — przy `temperature: 0` identyczny prompt da ten sam błąd
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
Gdy transkrypcja < 50 znaków → `transcriptionWarning: "Nagranie może być zbyt krótkie"` — UI ostrzega przed generowaniem raportu.

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
   - Upload zdjęć: drag & drop, max 5 plików, max 5 MB każdy, walidacja client-side, podgląd miniatur
   - Komentarze: textarea (opcjonalne)
4. **Generowanie draftu** (do wyboru):
   - Przycisk **"Generuj ze zdjęcia"** → spinner → findings z confidence w edytorze
   - Przycisk **"Nagraj głos"** → REC (czerwona pulsująca ikona) → STOP → spinner Whisper → spinner Claude → draft w edytorze
5. **Edytor raportu:** Cztery oddzielne edytowalne sekcje (nie jeden textarea):
   - **Znaleziska** — lista strukturalna. Każde finding jako osobna pozycja z edytowalnym tekstem + badge confidence. Po edycji tekstu finding przez radiologa badge confidence zastępowany ikoną "zmodyfikowane ✎" (badge AI znika — nie można twierdzić że AI jest "pewne" czegoś co radiolog przepisał).
   - **Wnioski** (`impression`) — textarea
   - **Ograniczenia badania** (`imagingLimitations`) — textarea (prefillowane przez AI, edytowalne)
   - **Zalecenia radiologa** (`radiologistRecommendations`) — textarea
   
   Draft z AI oznaczony stałym badge'em "Wygenerowane przez AI — wymaga weryfikacji" (widoczny dopóki status = draft). Po zatwierdzeniu: badge zmienia się na "Zweryfikowane przez [imię] — [data]".

   Walidacja przed zatwierdzeniem: przycisk "Zatwierdź" zablokowany gdy `findings[]` jest puste ORAZ `impression` jest puste — przynajmniej jedno z nich musi być wypełnione.

6. **Przycisk "Zatwierdź raport"** → dialog potwierdzający: "Zatwierdzenie raportu jest nieodwracalne. Raport będzie widoczny dla lekarzy. Czy chcesz kontynuować?" → `status: approved`, `approvedAt: timestamp` → raport read-only z oznaczeniem "ZATWIERDZONE [data]" → widoczny dla lekarzy

---

## Flow lekarza — szczegółowy

1. **Login** → Dashboard
2. **Dashboard** → lista jego wizyt (data, pacjent, status), przycisk "Nowa wizyta"
3. **Nowa wizyta:**
   - Wybierz pacjenta: `patient-selector` (combobox)
   - Wybierz raport radiologiczny: `report-selector` (dropdown z listą zatwierdzonych raportów pacjenta — data, typ badania, radiolog)
4. **Podgląd raportu radiologicznego** — sticky sidebar widoczny podczas całego flow wizyty (nie znika po przewinięciu). Pokazuje: `impression` i `radiologistRecommendations` na górze (najważniejsze dla lekarza), pełna lista findings poniżej z badge confidence. Lekarz może zwinąć/rozwinąć sidebar. Jeśli nie wybrano raportu radiologicznego (`radiologicalReportId` opcjonalne) — sekcja ukryta, lekarz dyktuje bez kontekstu USG.
5. **"Nagraj wizytę"** → REC → rozmowa z pacjentem → STOP → Whisper → Claude → draft w trzech sekcjach
6. **Edytor raportu lekarskiego:** trzy sekcje edytowalne osobno:
   - **Wywiad** (`anamnesis`) — wywiad podmiotowy i przedmiotowy (podpowiedź w sekcji: "Wywiad podmiotowy i wyniki badania fizykalnego")
   - **Rozpoznanie** (`diagnosis`) — z prefiksem gdy niepewne (np. "Prawdopodobnie:", "Różnicowo:")
   - **Zalecenia** (`recommendations`)
   
   Draft z AI oznaczony badge'em "Wygenerowane przez AI — wymaga weryfikacji". Elementy `uncertainItems[]` zaznaczone inline jako `[WYMAGA WERYFIKACJI]`.
   
   Jeśli `transcriptionQuality === 'partial'` lub `'poor'` → baner (żółty/czerwony) widoczny nad przyciskiem zatwierdzenia.

7. **"Zatwierdź i zapisz"** → dialog potwierdzający → `status: approved`

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

Każdy draft raportu (przed zatwierdzeniem) oznaczony badge'em: **"Wygenerowane przez AI — wymaga weryfikacji"**. Po zatwierdzeniu przez radiologa/lekarza: badge zmienia się na **"Zweryfikowane przez [imię] — [data]"** i raport staje się read-only.

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
