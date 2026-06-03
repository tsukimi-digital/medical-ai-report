# Medical AI POC — Quality Improvement Architecture

## Cel

Celem zmian jest zwiększenie jakości raportów generowanych przez AI bez zwiększania liczby czynności wykonywanych przez radiologa lub lekarza.

Założenie:

* użytkownik wykonuje dokładnie te same czynności co obecnie
* AI wykonuje więcej pracy wewnętrznie
* poprawa jakości raportów ma wynikać z lepszej architektury pipeline AI, a nie z dodatkowego inputu od użytkownika

---

# Zmiana 1 — Structured Intermediate Representation (SIR)

## Problem

Obecnie model analizuje obrazy i od razu generuje raport.

Pipeline:

```text
Images
↓
LLM
↓
Report
```

Takie podejście powoduje:

* większe ryzyko niespójności
* pomijanie części struktur
* mieszanie obserwacji z interpretacją

---

## Proponowana architektura

Pipeline:

```text
Images
↓
Medical Structured Representation
↓
Report Generation
```

### Etap 1

AI nie tworzy raportu.

Tworzy wyłącznie ustrukturyzowany opis badania.

Przykład dla tarczycy:

```json
{
  "thyroid": {
    "rightLobe": {
      "visible": true,
      "normal": true
    },
    "leftLobe": {
      "visible": true,
      "normal": false
    },
    "nodule": {
      "size": "8 mm",
      "echogenicity": "hypoechoic",
      "margin": "irregular",
      "microcalcifications": true
    }
  }
}
```

---

### Etap 2

Raport jest generowany wyłącznie z powyższej struktury.

```text
Structured Findings
↓
Report Generator
↓
Radiological Report
```

---

## Wymagane zmiany w projekcie

Nowy endpoint logiczny:

```typescript
/analyze-image
```

powinien zwracać:

```typescript
{
  structuredFindings,
  reportDraft
}
```

Nowy typ:

```typescript
type StructuredFindings = Record<string, unknown>
```

Nie musi być widoczny dla użytkownika.

Może istnieć wyłącznie wewnętrznie.

---

## Wpływ na radiologa

Brak dodatkowych działań.

Radiolog:

* nadal wrzuca obrazy
* nadal klika "Generuj raport"

AI wykonuje dodatkową analizę wewnętrznie.

---

## Wpływ na lekarza

Brak zmian w workflow.

Lekarz otrzymuje bardziej spójne raporty radiologiczne.

---

## Oczekiwany efekt

* mniej pominiętych struktur
* bardziej kompletne raporty
* lepsza spójność findings ↔ impression
* mniejsza liczba halucynacji

---

# Zmiana 2 — AI Reviewer (Self-Critique Layer)

## Problem

Obecnie pierwszy wygenerowany raport trafia bezpośrednio do użytkownika.

Pipeline:

```text
Images
↓
Report
↓
User
```

Nie istnieje etap kontroli jakości.

---

## Proponowana architektura

Pipeline:

```text
Images
↓
Draft Report
↓
AI Reviewer
↓
Final Report
↓
User
```

---

## Etap Reviewer

Drugi prompt analizuje raport.

Sprawdza:

### Completeness

Czy wszystkie obowiązkowe struktury zostały ocenione.

### Consistency

Czy wnioski wynikają ze znalezisk.

### Missing Structures

Czy raport nie pominął ważnych elementów.

### Classification Validation

Czy klasyfikacje są uzasadnione.

Przykład:

```json
{
  "issues": [
    "Brak opisu śledziony",
    "TI-RADS 4 bez wskazania cech punktowanych"
  ]
}
```

---

## Auto-correction

Jeżeli reviewer wykryje problem:

```text
Draft
↓
Reviewer
↓
Correction
↓
Final Report
```

Użytkownik widzi wyłącznie wersję końcową.

---

## Wymagane zmiany w projekcie

Nowy etap wewnątrz:

```typescript
generateReport()
```

```typescript
generateDraft()
→ reviewDraft()
→ generateFinalVersion()
```

Brak zmian w UI.

---

## Wpływ na radiologa

Brak dodatkowych działań.

Radiolog nie wykonuje żadnych nowych kroków.

Otrzymuje lepszy pierwszy draft.

---

## Wpływ na lekarza

Brak zmian.

Mniej błędów i niespójności w raportach źródłowych.

---

## Oczekiwany efekt

* wyższa jakość pierwszego draftu
* mniej ręcznych poprawek
* większe zaufanie do AI

---

# Zmiana 3 — Multi-Step Clinical Reasoning Pipeline

## Problem

Obecnie model wykonuje kilka zadań jednocześnie:

* wykrywa struktury
* wykrywa patologie
* interpretuje patologie
* przypisuje klasyfikacje
* tworzy raport

Wszystko w jednym promptcie.

---

## Proponowana architektura

Podzielić proces na niezależne etapy.

```text
Images
↓
Anatomy Detection
↓
Observation Extraction
↓
Abnormality Detection
↓
Classification
↓
Report Generation
```

---

## Anatomy Detection

AI odpowiada:

```json
{
  "identifiedStructures": [
    "right thyroid lobe",
    "left thyroid lobe",
    "isthmus"
  ]
}
```

---

## Observation Extraction

AI odpowiada:

```json
{
  "observations": [
    "8 mm lesion",
    "hypoechoic",
    "irregular margins"
  ]
}
```

---

## Classification

AI odpowiada:

```json
{
  "classification": {
    "system": "TI-RADS",
    "value": "TR4"
  }
}
```

---

## Report Generation

Dopiero ostatni etap tworzy raport.

---

## Wymagane zmiany w projekcie

Nowa architektura promptów:

```text
Prompt A
→ anatomy

Prompt B
→ observations

Prompt C
→ classification

Prompt D
→ report
```

Możliwe do zaimplementowania w obecnym module:

```typescript
/lib/ai
```

bez zmian w UI.

---

## Wpływ na radiologa

Brak dodatkowych działań.

Workflow pozostaje identyczny.

Radiolog nadal:

1. wrzuca obrazy
2. klika generowanie
3. weryfikuje raport

---

## Wpływ na lekarza

Brak zmian.

Lekarz korzysta z lepszej jakości raportów.

---

## Oczekiwany efekt

* dokładniejsze wykrywanie patologii
* mniej błędów klasyfikacyjnych
* lepsze wykorzystanie wiedzy domenowej
* większa zgodność z checklistami badania

---

# Podsumowanie

Najważniejsze założenie:

Radiolog i lekarz nie wykonują żadnych nowych czynności.

Zmiany zachodzą wyłącznie wewnątrz pipeline AI.

Nowy workflow użytkownika pozostaje:

```text
Upload obrazów
↓
Generuj raport
↓
Zweryfikuj
↓
Zatwierdź
```

Natomiast workflow AI staje się:

```text
Images
↓
Structured Intermediate Representation
↓
Clinical Reasoning Pipeline
↓
Draft Report
↓
AI Reviewer
↓
Final Report
↓
User
```

Oczekiwanym rezultatem jest maksymalizacja jakości pierwszego draftu raportu przy zachowaniu minimalnego obciążenia radiologa i lekarza.
