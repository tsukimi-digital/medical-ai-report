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
      /layout.tsx                    # Navbar z przełącznikiem PL/EN + logout
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
      /claude.ts                     # Claude API client
      /whisper.ts                    # OpenAI Whisper client
    /types.ts                        # Wspólne typy TypeScript
    /i18n
      /pl.ts                         # Tłumaczenia PL
      /en.ts                         # Tłumaczenia EN
      /index.ts                      # Hook useTranslation
    /examination-types.ts            # Lista typów badań USG
  /components
    /ui/                             # Button, Input, Badge, Card, Modal
    /voice-recorder.tsx              # MediaRecorder API → audioBlob
    /image-uploader.tsx              # Drag & drop, max 5 plików, max 5MB każdy
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
type UserRole = 'radiologist' | 'doctor'

type User = {
  id: string
  name: string
  email: string
  role: UserRole
  password: string  // plaintext — tylko demo
}

type Patient = {
  id: string
  firstName: string
  lastName: string
  pesel: string
  gender: 'M' | 'F'
  dateOfBirth: string
  createdAt: string
}

type Confidence = 'high' | 'medium' | 'low'

type Finding = {
  text: string
  isDeviation: boolean
  confidence: Confidence
}

type RadiologicalReport = {
  id: string
  patientId: string
  radiologistId: string
  examinationType: string        // np. "USG jamy brzusznej"
  images: Array<{               // max 5 zdjęć, max 5MB każde
    base64: string
    mimeType: string
    filename: string
  }>
  comments: string               // komentarze radiologa przed generowaniem
  findings: Finding[]            // znaleziska z confidence (jeśli AI)
  rawText: string                // pełna treść raportu do edycji
  aiGenerated: boolean
  status: 'draft' | 'approved'
  createdAt: string
  approvedAt?: string
}

type MedicalReport = {
  id: string
  patientId: string
  doctorId: string
  radiologicalReportId?: string
  transcription: string          // surowa transkrypcja Whisper
  anamnesis: string              // wywiad
  diagnosis: string              // rozpoznanie
  recommendations: string        // zalecenia
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

### Analiza obrazu USG (`/api/ai/analyze-image`)

**Input:** base64 zdjęcia (1–5), examinationType, comments, language

**Prompt Claude Vision:**
```
Jesteś radiologiem analizującym badanie USG.
Typ badania: {examinationType}
Komentarze radiologa: {comments}

Przeanalizuj zdjęcie w kontekście typowych struktur anatomicznych
i norm dla tego badania.

Opisz TYLKO to co widzisz z pewnością. Dla każdego znaleziska zwróć:
- text: opis znaleziska
- isDeviation: czy to odchylenie od normy (true/false)
- confidence: "high" (>85%), "medium" (60-85%), "low" (<60%)

Jeśli nie możesz ocenić czegoś z wystarczającą pewnością —
wpisz to jako znalezisko z confidence "low" i opisz co widzisz.
NIE zgaduj. NIE wnioskuj poza tym co widoczne na obrazie.
Odpowiedz w języku: {pl|en}

Zwróć JSON: { findings: Finding[], summary: string }
```

**Output:** `Finding[]` + `summary` — gotowe do wyświetlenia w edytorze z color-coded badge.

### Transkrypcja głosu (`/api/ai/transcribe`)

**Input:** audio blob (WebM z MediaRecorder)  
**Output:** surowy tekst transkrypcji (Whisper)  
Brak dalszego przetwarzania — tekst trafia do generate-report.

### Generowanie raportu z transkrypcji (`/api/ai/generate-report`)

**Input:** transkrypcja, rola (`radiologist` | `doctor`), examinationType (opcjonalne), language

**Prompt dla radiologa:**
```
Transkrypcja zawiera wypowiedź radiologa podczas badania {examinationType}.
Wyodrębnij znaleziska medyczne. Jeśli coś jest niejasne — wpisz [WYMAGA UZUPEŁNIENIA].
NIE dodawaj informacji których nie ma w transkrypcji.
Odpowiedz w języku: {pl|en}
Zwróć JSON: { findings: Finding[], summary: string }
```

**Prompt dla lekarza:**
```
Transkrypcja zawiera rozmowę lekarza z pacjentem podczas wizyty.
Wyodrębnij: wywiad (anamnesis), rozpoznanie (diagnosis), zalecenia (recommendations).
Jeśli coś jest niejasne — wpisz [WYMAGA UZUPEŁNIENIA].
NIE dodawaj informacji których nie ma w transkrypcji.
Odpowiedz w języku: {pl|en}
Zwróć JSON: { anamnesis: string, diagnosis: string, recommendations: string }
```

### Confidence — UI

| Poziom | Kolor badge | Znaczenie |
|--------|-------------|-----------|
| high | Zielony | >85% pewności — można ufać |
| medium | Żółty | 60–85% — wymaga weryfikacji |
| low | Czerwony | <60% — AI niepewne, radiolog musi ocenić |

---

## Flow radiologa — szczegółowy

1. **Login** → przekierowanie do Dashboard
2. **Dashboard** → lista jego badań (data, pacjent, typ, status), przycisk "Nowe badanie"
3. **Nowe badanie:**
   - Wybierz pacjenta: `patient-selector` (combobox, wyszukiwanie po imieniu/nazwisku/PESEL) + link "Dodaj nowego pacjenta"
   - Typ badania: `examination-type-select` (searchable combobox z predefiniowaną listą + własny wpis)
   - Upload zdjęć: drag & drop, max 5 plików, max 5 MB każdy, walidacja client-side, podgląd miniatur
   - Komentarze: textarea (opcjonalne)
4. **Generowanie draftu** (do wyboru):
   - Przycisk **"Generuj ze zdjęcia"** → spinner → findings z confidence w edytorze
   - Przycisk **"Nagraj głos"** → REC (czerwona pulsująca ikona) → STOP → spinner Whisper → spinner Claude → draft w edytorze
5. **Edytor raportu:** pełna swoboda edycji. Znaleziska AI pokazane z badge confidence. Można edytować tekst bezpośrednio.
6. **Przycisk "Zatwierdź raport"** → `status: approved` → raport widoczny dla lekarzy

---

## Flow lekarza — szczegółowy

1. **Login** → Dashboard
2. **Dashboard** → lista jego wizyt (data, pacjent, status), przycisk "Nowa wizyta"
3. **Nowa wizyta:**
   - Wybierz pacjenta: `patient-selector` (combobox)
   - Wybierz raport radiologiczny: `report-selector` (dropdown z listą zatwierdzonych raportów pacjenta — data, typ badania, radiolog)
4. **Podgląd raportu radiologicznego** (tylko czytanie, z confidence badge)
5. **"Nagraj wizytę"** → REC → rozmowa z pacjentem → STOP → Whisper → Claude → draft w trzech sekcjach
6. **Edytor raportu lekarskiego:** trzy sekcje: Wywiad / Rozpoznanie / Zalecenia — każda edytowalna osobno
7. **"Zatwierdź i zapisz"** → `status: approved`

---

## Lista typów badań USG (combobox)

USG jamy brzusznej, tarczycy, nerek, wątroby, pęcherzyka żółciowego, trzustki, śledziony, prostaty, ginekologiczne transwaginalne (TV), ginekologiczne przezbrzuszne (TA), piersi, tkanek miękkich, naczyniowe (Doppler), echokardiografia — oraz możliwość wpisania własnego.

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

## Middleware i bezpieczeństwo

- `middleware.ts` chroni wszystkie trasy `/(app)/*` — redirect do `/login` jeśli brak sesji
- Sesja jako signed HTTP-only cookie (AUTH_SECRET)
- Brak wrażliwych danych w lokalnym storage przeglądarki
- API keys tylko po stronie serwera (nigdy w kliencie)
- Walidacja rozmiaru i typu pliku po stronie klienta I serwera

---

## Deployment

```bash
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY
vercel env add AUTH_SECRET
vercel deploy
```

Jedna komenda deploy, zero dodatkowej infrastruktury.
