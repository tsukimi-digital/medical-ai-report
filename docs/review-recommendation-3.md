# Medical AI POC — Review Recommendations 3

## Cel dokumentu

Ten dokument doprecyzowuje zaakceptowane rekomendacje po review koncepcji demo.
Ma służyć jako materiał wejściowy dla agenta, który aktualizuje główny design plan.

Najważniejsza decyzja:

* bazowe flow aplikacji pozostaje narzucone przez klienta i nie powinno być usuwane ani zastępowane
* można dodać dodatkowy flow jakościowy, o ile nie zwiększa liczby obowiązkowych czynności radiologa ani lekarza
* priorytet demo: efekt "wow", minimalna obsługa po stronie użytkownika, wysoka jakość raportów
* kwestie etyki medycznej, security, prawne i produkcyjne pozostają poza zakresem demo

---

# 1. Nazewnictwo i zakres bazowych case'ów

## Problem

W opisie produktu występują dwa "Case 2", a część rekomendacji mogłaby zostać błędnie zinterpretowana jako zmiana narzuconego flow.

## Decyzja

W design planie należy nazwać i uporządkować flow w następujący sposób:

## Case A — Radiologist Image-to-Report

Radiolog ma zdjęcia USG i wgrywa je na platformę.

AI:

* analizuje obrazy
* wyszukuje patologie, odchylenia i ograniczenia jakości obrazu
* generuje draft raportu radiologicznego

Radiolog:

* weryfikuje raport
* edytuje albo zatwierdza

## Case B — Radiologist Voice-to-Report

Radiolog ma zdjęcia USG, sam analizuje badanie i nagrywa własne dyktowanie.

AI:

* transkrybuje nagranie
* ekstraktuje informacje medyczne z wypowiedzi radiologa
* generuje draft raportu radiologicznego

Radiolog:

* weryfikuje raport
* edytuje albo zatwierdza

Uwaga: w tym case'u źródłem raportu jest przede wszystkim analiza radiologa utrwalona w dyktowaniu. Jeśli obrazy są dostępne w aplikacji, mogą zostać użyte przez dodatkowy quality flow do walidacji, ale nie wolno zmieniać sensu case'u na obowiązkowy tryb multimodalny.

## Case C — Doctor Visit-to-Patient-Report

Lekarz ma zatwierdzony raport radiologiczny i odbywa wizytę z pacjentem.

AI:

* transkrybuje rozmowę lekarz-pacjent
* rozróżnia informacje z raportu radiologa, wypowiedzi lekarza i wypowiedzi pacjenta
* generuje draft raportu/notatki medycznej dla lekarza
* generuje wersję zrozumiałą dla pacjenta

Lekarz:

* weryfikuje raport
* edytuje albo zatwierdza

## Wpływ na design plan

Należy zaktualizować nazwy case'ów w specyfikacji, UI copy, danych demo i scenariuszach testowych.

---

# 2. Dodatkowy flow jakościowy bez zmiany bazowych case'ów

## Problem

Sama szybkość generowania raportu nie wystarczy do efektu "wow". Stakeholder ma zobaczyć, że system realnie poprawia jakość pracy: analizuje źródła, wyłapuje niepewność, kontroluje spójność i oddaje lepszy draft.

## Propozycja

Dodać wewnętrzny flow:

## Case D — AI Quality Review Flow

Nie jest to osobny podstawowy workflow kliniczny. To dodatkowa warstwa jakości uruchamiana automatycznie po wygenerowaniu draftu w Case A, B i C.

Użytkownik nie wykonuje nowych obowiązkowych czynności.

Pipeline:

```text
Input sources
↓
Extraction / SIR
↓
Draft report
↓
AI Quality Reviewer
↓
Auto-correction
↓
Quality summary
↓
User review
```

## Co sprawdza AI Quality Reviewer

Dla Case A:

* jakość obrazu: diagnostic / suboptimal / non_diagnostic
* kompletność obowiązkowych struktur dla danego typu USG
* zgodność findings z impression
* poprawność klasyfikacji formalnych, np. TI-RADS, BI-RADS, Bosniak, O-RADS
* czy w raporcie nie pojawiły się struktury niewidoczne na obrazie
* czy low-confidence findings nie są przedstawione jako pewne rozpoznania

Dla Case B:

* jakość transkrypcji
* niejasne fragmenty dyktowania
* korekty radiologa w locie, np. "lewa, nie, prawa"
* liczby bez jednostek
* braki względem checklisty danego badania
* opcjonalna walidacja z obrazami, jeśli zostały dołączone

Dla Case C:

* rozróżnienie wypowiedzi lekarza i pacjenta
* zgodność notatki z raportem radiologicznym
* czy zalecenia wynikają z rozmowy albo raportu
* niejasne elementy wizyty
* czy wersja dla pacjenta nie dodaje nowych faktów medycznych

## Model danych

Dodać wspólny typ:

```typescript
type QualityCheckStatus = 'ready' | 'needs_attention' | 'blocked'

type QualityCheckCategory =
  | 'image_quality'
  | 'transcription_quality'
  | 'completeness'
  | 'consistency'
  | 'classification'
  | 'source_evidence'
  | 'patient_explanation'

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
  autoCorrections: string[]
  unresolvedItems: string[]
}
```

Rozszerzyć raporty:

```typescript
type RadiologicalReport = {
  ...
  aiQualityCheck?: AiQualityCheck
}

type MedicalReport = {
  ...
  aiQualityCheck?: AiQualityCheck
}
```

## UI

Dodać kompaktową sekcję:

```text
AI Quality Check

Status: Gotowe do weryfikacji / Wymaga uwagi / Zablokowane

✓ Kompletność struktur
✓ Spójność opisu i wniosków
⚠ Niska pewność: 2 elementy
⚠ Niejasny fragment transkrypcji
```

Sekcja ma wspierać szybkie skanowanie, a nie tworzyć dodatkową pracę. Radiolog/lekarz ma widzieć, co wymaga uwagi, bez ręcznego szukania problemów w całym raporcie.

---

# 3. Confidence jako mechanizm sterujący workflow

## Problem

Confidence jako sam badge jest za słaby. Żeby platforma była użyteczna nawet przy low confidence, confidence musi sterować tym, co dzieje się z informacją w UI i raporcie.

## Decyzja

Wprowadzić następujące zachowanie:

## High confidence

* trafia do draftu raportu normalnie
* widoczne jako standardowy finding
* nie wymaga dodatkowego oznaczenia poza subtelnym badge'em

## Medium confidence

* trafia do draftu raportu
* jest oznaczone jako element do szybkiej weryfikacji
* powinno pojawić się w AI Quality Check jako warning, jeśli dotyczy istotnego odchylenia

## Low confidence

* nie może być przedstawione jako pewne rozpoznanie
* powinno trafić do sekcji "Wymaga weryfikacji"
* może być widoczne jako użyteczna sugestia, ale nie jako definitywny wniosek
* jeśli low-confidence finding zostaje użyty w raporcie, musi być oznaczony językiem niepewności

## Blocked

Stan `blocked` powinien wystąpić tylko gdy:

* obraz jest non_diagnostic
* transkrypcja jest zbyt krótka albo niezrozumiała
* brakuje minimalnych danych do wygenerowania sensownego draftu

W takim przypadku UI odblokowuje ręczny edytor i pokazuje jasny komunikat.

---

# 4. Uproszczony i mocniejszy flow lekarza

## Problem

Case C może łatwo stać się zbyt ciężki, jeśli lekarz musi ręcznie wybierać wiele opcji albo porządkować transkrypcję.

## Propozycja

Flow lekarza powinien być maksymalnie prosty:

```text
Wybierz pacjenta
↓
Wybierz zatwierdzony raport radiologiczny
↓
Nagraj wizytę
↓
AI generuje raport lekarski + wersję dla pacjenta
↓
Lekarz weryfikuje i zatwierdza
```

## AI w Case C

AI powinna automatycznie:

* odróżniać wywiad pacjenta od wyjaśnień lekarza
* wyłapywać rozpoznanie, zalecenia i plan dalszego postępowania
* powiązać rozmowę z raportem radiologicznym
* oznaczyć niejasne elementy w `uncertainItems`
* stworzyć wersję dla pacjenta prostym językiem

## UI

Widok lekarza powinien mieć dwa główne obszary:

* Raport medyczny dla lekarza
* Wersja dla pacjenta

Obie sekcje powinny być edytowalne przed zatwierdzeniem.

---

# 5. Patient Explanation Generator

## Problem

Demo jest mocniejsze, gdy pokazuje wartość dla całej ścieżki opieki, nie tylko dla radiologa.

## Propozycja

Dodać generator wersji pacjenckiej:

* dla raportu radiologicznego: po zatwierdzeniu raportu przez radiologa
* dla Case C: jako draft generowany razem z raportem lekarskim, edytowalny przed zatwierdzeniem przez lekarza

## Model danych

```typescript
type PatientExplanation = {
  plainLanguageSummary: string
  keyFindings: string[]
  nextSteps: string[]
  followUp: string | null
  sourceReportId: UUID
  generatedAt: string
}
```

Jeśli istnieją już pola `patientExplanation?: string`, należy je rozszerzyć albo zastąpić strukturą powyżej, aby UI mogło pokazać treść w czytelnych sekcjach.

## Reguły generowania

AI:

* nie dodaje nowych faktów medycznych
* opiera się wyłącznie na zatwierdzonym raporcie i rozmowie z wizyty
* tłumaczy terminy medyczne prostym językiem
* rozdziela "co znaleziono", "co to oznacza" i "co dalej"
* nie ukrywa niepewności, jeśli raport źródłowy ją zawiera

## UI

Dodać zakładkę albo panel:

```text
Dla pacjenta
```

Panel powinien być dostępny po zatwierdzeniu raportu radiologicznego oraz w Case C po wygenerowaniu notatki z wizyty. W Case C treść pacjencka pozostaje draftem do momentu zatwierdzenia przez lekarza.

---

# 6. Differential Diagnosis tylko jako AI Suggestions

## Problem

Różnicowanie diagnostyczne ma dużą wartość demonstracyjną, ale nie powinno automatycznie trafiać do formalnego raportu jako pewna diagnoza.

## Decyzja

Differential diagnosis należy pokazywać poza formalnym raportem, w sekcji:

```text
AI Suggestions
```

Nie należy automatycznie wstawiać tych elementów do `rawText` raportu.

## Model danych

Można zachować istniejący typ:

```typescript
type DifferentialDiagnosis = {
  diagnosis: string
  confidence: Confidence
  rationale: string
}
```

Ale w design planie trzeba doprecyzować:

* `differentialDiagnoses` są sugestiami AI
* domyślnie nie są częścią formalnego raportu
* radiolog może je ręcznie wykorzystać podczas edycji raportu
* każdy element musi mieć rationale i confidence

Alternatywnie można dodać ogólny model:

```typescript
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
  canInsertIntoReport: boolean
}
```

## UI

Sekcja powinna być wizualnie oddzielona od formalnego raportu.

Przykład:

```text
AI Suggestions

Możliwe rozpoznania różnicowe:
- Torbiel prosta — high
- Gruczolak — medium
- Zmiana wymagająca dalszej diagnostyki — low

Te elementy nie zostały automatycznie dodane do raportu.
```

---

# 7. Golden demo cases

## Problem

Demo dla stakeholderów nie powinno opierać się na losowych danych ani przypadkowych obrazach. Potrzebne są kontrolowane scenariusze, które pokazują najmocniejsze możliwości platformy.

## Propozycja

Dodać zestaw pre-seedowanych przypadków demo.

Każdy przypadek powinien mieć:

* syntetycznego pacjenta
* typ badania
* dane wejściowe: obrazy, transkrypcja albo raport radiologiczny
* oczekiwane zachowanie AI
* element "wow", który prezenter może pokazać stakeholderom

## Demo Case 1 — Case A: USG tarczycy image-to-report

Cel:

* pokazać analizę obrazu
* pokazać klasyfikację TI-RADS
* pokazać evidence i confidence

Element "wow":

* AI wykrywa zmianę
* przypisuje klasyfikację
* pokazuje, z których obrazów wynikają findings
* generuje kompletny draft raportu

## Demo Case 2 — Case B: USG jamy brzusznej voice-to-report

Cel:

* pokazać, że radiolog może po prostu dyktować
* AI porządkuje chaotyczną wypowiedź w profesjonalny raport
* AI obsługuje korekty w locie i liczby z jednostkami

Element "wow":

* z naturalnego dyktowania powstaje strukturalny raport
* niejasne fragmenty trafiają do AI Quality Check

## Demo Case 3 — Case C: Wizyta lekarza z pacjentem

Cel:

* pokazać pełną ścieżkę od raportu radiologa do dokumentu dla pacjenta
* pokazać, że lekarz nie musi ręcznie przepisywać rozmowy

Element "wow":

* AI tworzy notatkę lekarską
* AI tworzy wersję dla pacjenta
* AI wskazuje niejasne elementy rozmowy

## Demo Case 4 — Case D: AI Quality Review / Conflict

Cel:

* pokazać dodatkową warstwę jakościową
* pokazać, że platforma nie udaje pewności

Element "wow":

* AI oznacza konflikt między dyktowaniem a materiałem źródłowym albo wskazuje element niepotwierdzony
* low-confidence element nie trafia jako pewny wniosek
* użytkownik widzi dokładnie, co wymaga weryfikacji

## Wpływ na design plan

Należy dodać sekcję danych demo i scenariuszy prezentacyjnych. Dane powinny być deterministyczne i pre-seedowane w in-memory store.

---

# 8. Zmiany do wprowadzenia w design planie

Agent aktualizujący design plan powinien dopisać następujące elementy:

## Dokumentacja produktu

* zmienić nazewnictwo case'ów na Case A, Case B, Case C
* dodać Case D jako automatyczny quality review flow
* doprecyzować, że Case D nie zmienia bazowych flow i nie dokłada obowiązkowych czynności użytkownikowi

## Modele danych

* dodać `AiQualityCheck`
* dodać albo rozszerzyć `PatientExplanation`
* doprecyzować status i rolę `DifferentialDiagnosis`
* opcjonalnie dodać `AiSuggestion`

## API / AI pipeline

* `analyze-image` powinien zwracać draft + quality check
* `generate-report` powinien zwracać draft + quality check
* `fuse-findings` może zasilać Case D, ale nie może zastąpić Case B
* `generate-patient-explanation` powinien działać dla raportów radiologicznych i lekarskich
* pipeline powinien mieć etap AI Reviewer przed pokazaniem finalnego draftu użytkownikowi

## UI

* dodać kompaktowy panel `AI Quality Check`
* dodać sekcję `Wymaga weryfikacji`
* dodać panel albo zakładkę `Dla pacjenta`
* oddzielić `AI Suggestions` od formalnego edytora raportu
* dodać pre-seedowane demo cases dostępne z dashboardu albo jako część danych startowych

## Prompty

* dopisać reguły confidence routing
* dopisać reviewer prompt per case
* dopisać regułę: low-confidence finding nie może być definitywnym wnioskiem
* dopisać regułę: patient explanation nie dodaje nowych faktów
* dopisać regułę: differential diagnosis pozostaje sugestią poza formalnym raportem

---

# 9. Kryteria akceptacji

Po aktualizacji design plan powinien spełniać poniższe warunki:

* Case A, B i C pozostają zgodne z narzuconym flow klienta
* dodatkowy Case D poprawia jakość bez dokładania obowiązkowych działań użytkownikowi
* każdy wygenerowany raport ma `aiQualityCheck`
* low-confidence elementy są widoczne i użyteczne, ale nie są przedstawiane jako pewne rozpoznania
* differential diagnosis jest widoczne jako `AI Suggestions`, nie jako automatyczna część formalnego raportu
* lekarz w Case C dostaje raport medyczny i wersję dla pacjenta
* wersja dla pacjenta bazuje wyłącznie na raporcie/rozmowie i nie dodaje nowych faktów
* demo ma minimum cztery pre-seedowane golden cases
* UI pozostaje prosty: upload / nagraj / wygeneruj / zweryfikuj / zatwierdź

---

# Podsumowanie

Ta rekomendacja nie zmienia kierunku produktu.

Jej celem jest wzmocnienie demo przez:

* uporządkowanie case'ów
* dodanie automatycznej warstwy jakości
* użycie confidence jako realnego mechanizmu workflow
* dodanie wersji dla pacjenta
* oddzielenie AI suggestions od formalnego raportu
* przygotowanie kontrolowanych golden cases pod prezentację

Efekt docelowy: stakeholder widzi platformę, która nie tylko szybko generuje tekst, ale samodzielnie analizuje materiał źródłowy, kontroluje jakość, jasno pokazuje niepewność i oddaje lekarzowi/radiologowi draft gotowy do szybkiej weryfikacji.
