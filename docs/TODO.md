# TODO — Medical AI POC → Production

Rzeczy świadomie pominięte w wersji demo. Do wdrożenia gdy klient zdecyduje się na dalszy rozwój.

---

## Krytyczne przed produkcją (RODO / dane medyczne)

### Umowy powierzenia danych (DPA) z dostawcami AI
Aplikacja wysyła dane do zewnętrznych serwisów:
- **Anthropic (Claude Vision)** — obrazy USG, dane kliniczne pacjenta
- **OpenAI (Whisper)** — nagrania głosowe rozmów lekarz-pacjent (art. 9 RODO — szczególna kategoria)

Przed wdrożeniem z prawdziwymi danymi pacjentów: zawrzeć Data Processing Agreement z oboma dostawcami. Anthropic i OpenAI oferują DPA dla klientów API. Transfer do USA wymaga gwarancji art. 46 RODO (SCC lub adequacy decision).

### Anonimizacja obrazów USG na poziomie pikseli
`sharp` strip EXIF usuwa metadane pliku — **nie usuwa** danych nadrukowanych przez aparat USG bezpośrednio na warstwie pikselowej obrazu (imię, nazwisko, PESEL, data badania, nazwa szpitala). Te dane trafiają do Claude Vision.

Rozwiązania do wyboru:
- Anonimizacja warstwy pikselowej (zaczernowanie regionu nagłówka aparatu)
- Konwersja DICOM z pełnym pipeline anonimizacji
- Wymóg dostarczenia przez klienta obrazów bez danych pacjenta (anonimizacja po stronie aparatu)

### Podstawa prawna przetwarzania danych (art. 9 RODO)
Dane zdrowotne (obrazy USG, nagrania głosowe, raporty) wymagają podstawy prawnej z art. 9 ust. 2 RODO (np. zgoda pacjenta lub przetwarzanie do celów opieki zdrowotnej). W wersji demo: używać wyłącznie syntetycznych danych bez prawdziwych pacjentów.

---

## Wysoki priorytet po decyzji klienta

### Podpis elektroniczny radiologa/lekarza
Pełna dokumentacja medyczna wymaga kwalifikowanego podpisu elektronicznego lub certyfikatu tożsamości. Aktualne `radiologistId` + `approvedAt` symuluje zatwierdzenie — wystarczające dla demo, niewystarczające prawnie dla produkcji.

### Pełny ślad audytowy
Dodać: `modifiedAt` (czas edycji), changelog zmian (kto co zmienił i kiedy), `approvedBy` jako osobny UUID jeśli inna osoba może edytować cudzy raport.

### In-memory store → baza danych
Na Vercel serverless różne route handlers (`/api/patients`, `/api/reports`) mogą działać na osobnych instancjach — shared in-memory state nie jest gwarantowany. Dane dodane przez jeden handler mogą być niewidoczne w innym po cold start. Dla demo z jednym użytkownikiem działa w praktyce, ale nie jest gwarantowane architektonicznie. Przed produkcją: zastąpić trwałą bazą danych (np. PostgreSQL/Neon).

### Timeout sesji — hardening
Aktualne 15 min to minimum. Dla produkcji: refresh token, invalidacja sesji po stronie serwera przy wylogowaniu, audit log logowań.

---

## Niski priorytet

### Dedykowane pole allergies
`ExaminationContext` nie ma pola `allergies` — alergie trafiają do komentarzy jako wolny tekst. Przy generowaniu zaleceń AI nie ma formalnego mechanizmu sprawdzenia wykluczeń lekowych.

### Bosniak IIF+ z CT/MRI
AI klasyfikuje torbiele nerek tylko jako Bosniak I lub II z obrazu USG. Wyższe kategorie opisuje jako "wymaga badania kontrastowego". Pełna klasyfikacja wymaga integracji z danymi CT/MRI.

---

*Dokument aktualizowany przy każdym etapie rozwoju projektu.*
