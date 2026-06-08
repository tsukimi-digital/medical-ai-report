/* ============================================================================
   Sonara — Demo data store (4 Golden Cases) + i18n
   Module-level singleton mirror of the spec's in-memory store.
   Exposed on window for other babel scripts.
   ============================================================================ */

/* ---------------------------------------------------------------- users --- */
const USERS = [
  { id: "u-rad1", name: "dr Anna Lewandowska", email: "rad1@demo.pl", role: "radiologist", initials: "AL" },
  { id: "u-rad2", name: "dr Piotr Zieliński",   email: "rad2@demo.pl", role: "radiologist", initials: "PZ" },
  { id: "u-doc1", name: "lek. Marta Sawicka",   email: "doc1@demo.pl", role: "doctor",      initials: "MS" },
  { id: "u-doc2", name: "lek. Jan Kowalczyk",    email: "doc2@demo.pl", role: "doctor",      initials: "JK" },
];

/* ------------------------------------------------------------- patients --- */
const PATIENTS = {
  "p-anna":   { id: "p-anna",   firstName: "Anna",   lastName: "Kowalska",    pesel: "74050512388", gender: "F", dateOfBirth: "1974-05-05", age: 52 },
  "p-marek":  { id: "p-marek",  firstName: "Marek",  lastName: "Nowak",       pesel: "65021034177", gender: "M", dateOfBirth: "1965-02-10", age: 61 },
  "p-tomasz": { id: "p-tomasz", firstName: "Tomasz", lastName: "Wiśniewski",  pesel: "81071245699", gender: "M", dateOfBirth: "1981-07-12", age: 45 },
  "p-ewa":    { id: "p-ewa",    firstName: "Ewa",    lastName: "Mazur",       pesel: "90031567422", gender: "F", dateOfBirth: "1990-03-15", age: 36 },
};

const EXAM_TYPES = [
  "USG tarczycy", "USG jamy brzusznej", "USG nerek", "USG wątroby", "USG pęcherzyka żółciowego",
  "USG trzustki", "USG piersi", "USG ginekologiczne transwaginalne (TV)", "USG Doppler tętnic szyjnych",
  "USG węzłów chłonnych", "USG moszny i jąder", "Echokardiografia",
];

/* helper: confidence meta */
const CONF = {
  high:   { key: "high",   cls: "badge-hi",  pl: "pewne",    en: "high" },
  medium: { key: "medium", cls: "badge-med", pl: "niepewne", en: "medium" },
  low:    { key: "low",    cls: "badge-low", pl: "wątpliwe", en: "low" },
};

/* ============================================================== CASE A === */
/* USG tarczycy — image-to-report. TI-RADS 4, evidence, advanced pipeline.   */
const CASE_A = {
  id: "rad-A", caseKey: "A", patientId: "p-anna", radiologistId: "u-rad1",
  examinationType: "USG tarczycy",
  clinicalIndication: "Wyczuwalny guzek tarczycy do oceny. Bez objawów uciskowych.",
  examinationContext: { relevantLabValues: [{ label: "TSH", value: "2.1", unit: "mIU/L" }] },
  analysisMode: "image",
  imageQuality: "diagnostic",
  imageCount: 3,
  imageLabel: "USG_tarczyca",
  pipeline: "advanced",
  rawObservations: [
    "hypoechoic solid nodule", "left thyroid lobe, mid-third", "~8 mm (longest axis)",
    "irregular / lobulated margins", "punctate echogenic foci (microcalcifications)",
    "taller-than-wide: no", "right lobe homogeneous", "isthmus normal thickness",
  ],
  findings: [
    { id: "f-a1", text: "Zmiana ogniskowa lita, hipoechogeniczna w środkowej części lewego płata, wymiar ok. 8 mm.", isDeviation: true, confidence: "high", anatomicalLocation: "tarczyca — lewy płat", evidence: { imageIndexes: [1, 2] } },
    { id: "f-a2", text: "Marginesy zmiany nieregularne, miejscami zatarte.", isDeviation: true, confidence: "medium", anatomicalLocation: "tarczyca — lewy płat", evidence: { imageIndexes: [1, 2] } },
    { id: "f-a3", text: "Liczne drobne ogniska hiperechogeniczne w obrębie zmiany — obraz mikrozwapnień.", isDeviation: true, confidence: "medium", anatomicalLocation: "tarczyca — lewy płat", evidence: { imageIndexes: [2] } },
    { id: "f-a4", text: "Prawy płat tarczycy jednorodny, prawidłowej echogeniczności, bez zmian ogniskowych.", isDeviation: false, confidence: "high", anatomicalLocation: "tarczyca — prawy płat", evidence: { imageIndexes: [0] } },
    { id: "f-a5", text: "Cieśń tarczycy niepogrubiała (3 mm).", isDeviation: false, confidence: "high", anatomicalLocation: "tarczyca — cieśń", evidence: { imageIndexes: [0] } },
  ],
  lowConfidenceFindings: [
    { id: "f-aL1", text: "Możliwy drobny węzeł chłonny grupy III po stronie lewej — częściowo poza kadrem.", isDeviation: true, confidence: "low", anatomicalLocation: "szyja — grupa III lewa", evidence: { imageIndexes: [2] } },
  ],
  impression: "Pojedyncza zmiana ogniskowa lewego płata tarczycy o cechach podwyższonego ryzyka. Klasyfikacja ACR TI-RADS 4 (lita: 2 pkt; hipoechogeniczna: 2 pkt; marginesy nieregularne: 2 pkt; mikrozwapnienia: 3 pkt; kształt „szerszy niż wyższy”: 0 pkt — razem 9 pkt). Wymiar < 15 mm. Zalecana weryfikacja cytologiczna.",
  imagingLimitations: "Ocena węzłów chłonnych szyjnych ograniczona — kadr nie obejmuje pełnych grup. Badanie bez opcji Doppler — brak oceny unaczynienia zmiany.",
  radiologistRecommendations: "Biopsja aspiracyjna cienkoigłowa (BAC) zmiany lewego płata pod kontrolą USG. W razie wyniku łagodnego — kontrola USG za 6 miesięcy.",
  classification: { name: "ACR TI-RADS", value: "TR4", label: "Średnie ryzyko", points: 9 },
  aiSuggestions: [
    { id: "s-a1", type: "differential_diagnosis", title: "Rak brodawkowaty tarczycy", confidence: "medium", rationale: "Współwystępowanie mikrozwapnień, hipoechogeniczności i nieregularnych marginesów to klasyczna konstelacja cech podwyższonego ryzyka.", canInsertIntoReport: true },
    { id: "s-a2", type: "differential_diagnosis", title: "Guzek koloidowy z wtórnymi zmianami", confidence: "low", rationale: "Mniej prawdopodobny przy obecności mikrozwapnień; nie można jednak wykluczyć bez cytologii.", canInsertIntoReport: true },
    { id: "s-a3", type: "additional_observation", title: "Asymetria echogeniczności płatów", confidence: "low", rationale: "Lewy płat nieco bardziej heterogenny — w korelacji klinicznej warto rozważyć ocenę przeciwciał anty-TPO.", canInsertIntoReport: true },
  ],
  aiQualityCheck: {
    status: "needs_attention",
    summary: "Draft gotowy do weryfikacji. Klasyfikacja TI-RADS wymaga potwierdzenia cech punktowanych; 1 element o niskiej pewności przeniesiono do sekcji „Wymaga weryfikacji”.",
    checks: [
      { category: "image_quality", status: "pass", message: "Jakość obrazu: diagnostyczna (3/3 obrazy)." },
      { category: "completeness", status: "pass", message: "Wszystkie obowiązkowe struktury tarczycy ocenione." },
      { category: "consistency", status: "pass", message: "Wnioski spójne ze znaleziskami." },
      { category: "classification", status: "warning", message: "Klasyfikacja ACR TI-RADS 4 — potwierdź ręcznie cechy punktowane (marginesy, mikrozwapnienia)." },
      { category: "source_evidence", status: "pass", message: "Wszystkie znaleziska mają wskazane źródło obrazowe." },
      { category: "consistency", status: "warning", message: "1 element o niskiej pewności (węzeł chłonny) → sekcja „Wymaga weryfikacji”." },
    ],
    autoCorrections: ["Ujednolicono zapis wymiaru zmiany: „osiem mm” → „8 mm”."],
    unresolvedItems: ["Pełna ocena węzłów chłonnych szyjnych — kadr niekompletny."],
  },
};

/* ============================================================== CASE B === */
/* USG jamy brzusznej — voice-to-report. In-flight correction, unit parsing. */
const CASE_B = {
  id: "rad-B", caseKey: "B", patientId: "p-marek", radiologistId: "u-rad1",
  examinationType: "USG jamy brzusznej",
  clinicalIndication: "Nawracające bóle brzucha, kontrola.",
  examinationContext: { fastingStatus: "fasting" },
  analysisMode: "voice",
  pipeline: "two-step",
  transcription: "Tak więc... wątroba niepowiększona, echogeniczność prawidłowa, bez zmian ogniskowych. Drogi żółciowe wewnątrz i zewnątrzwątrobowe nieposzerzone. Pęcherzyk żółciowy bez złogów, ściana cienka. Trzustka... eee... w dostępnych przekrojach prawidłowa. Śledziona niepowiększona. Nerka lewa, nie, przepraszam, prawa — torbiel prosta dolnego bieguna, około pięć milimetrów. Nerka lewa bez zmian. Aorta brzuszna niewidoczna w tym przekroju, pacjent... no, gazy jelitowe. Bez wolnego płynu.",
  rawTranscriptionPreview: "tak więc wątroba niepowiększona echogeniczność prawidłowa bez zmian ogniskowych drogi żółciowe nieposzerzone pęcherzyk żółciowy bez złogów ściana cienka trzustka eee w dostępnych przekrojach prawidłowa śledziona niepowiększona nerka lewa nie przepraszam prawa torbiel prosta dolnego bieguna około pięć milimetrów nerka lewa bez zmian aorta brzuszna niewidoczna gazy jelitowe bez wolnego płynu",
  transcriptionQuality: "good",
  findings: [
    { id: "f-b1", text: "Wątroba niepowiększona, echogeniczność prawidłowa, bez zmian ogniskowych.", isDeviation: false, confidence: "high", anatomicalLocation: "wątroba", evidence: { transcriptFragments: ["wątroba niepowiększona, echogeniczność prawidłowa, bez zmian ogniskowych"] } },
    { id: "f-b2", text: "Drogi żółciowe wewnątrz- i zewnątrzwątrobowe nieposzerzone.", isDeviation: false, confidence: "high", anatomicalLocation: "drogi żółciowe", evidence: { transcriptFragments: ["drogi żółciowe wewnątrz i zewnątrzwątrobowe nieposzerzone"] } },
    { id: "f-b3", text: "Pęcherzyk żółciowy bez złogów, ściana cienka.", isDeviation: false, confidence: "high", anatomicalLocation: "pęcherzyk żółciowy", evidence: { transcriptFragments: ["pęcherzyk żółciowy bez złogów ściana cienka"] } },
    { id: "f-b4", text: "Torbiel prosta dolnego bieguna nerki prawej, wymiar ok. 5 mm.", isDeviation: true, confidence: "medium", anatomicalLocation: "nerka prawa — dolny biegun", evidence: { transcriptFragments: ["nerka lewa, nie, przepraszam, prawa — torbiel prosta dolnego bieguna, około pięć milimetrów"] } },
    { id: "f-b5", text: "Nerka lewa bez zmian ogniskowych.", isDeviation: false, confidence: "high", anatomicalLocation: "nerka lewa", evidence: { transcriptFragments: ["nerka lewa bez zmian"] } },
    { id: "f-b6", text: "Bez wolnego płynu w jamie otrzewnej.", isDeviation: false, confidence: "high", anatomicalLocation: "jama otrzewnej", evidence: { transcriptFragments: ["bez wolnego płynu"] } },
  ],
  lowConfidenceFindings: [],
  impression: "Badanie USG jamy brzusznej w granicach normy z wyjątkiem prostej torbieli (Bosniak I) dolnego bieguna nerki prawej, wymiar 5 mm — zmiana łagodna, bez znaczenia klinicznego. Aorta brzuszna nieoceniona (gazy jelitowe).",
  imagingLimitations: "Aorta brzuszna oraz trzustka oceniane w ograniczonych przekrojach z powodu gazów jelitowych — pełna ocena niemożliwa.",
  radiologistRecommendations: "Torbiel nerki prawej (Bosniak I) — bez konieczności kontroli. W razie utrzymywania się dolegliwości — rozważyć ponowną ocenę aorty po przygotowaniu jelit.",
  classification: null,
  aiSuggestions: [
    { id: "s-b1", type: "additional_observation", title: "Trzustka nie w pełni oceniona", confidence: "low", rationale: "Radiolog zaznaczył „w dostępnych przekrojach” — warto odnotować ograniczenie w sekcji Ograniczenia badania.", canInsertIntoReport: true },
  ],
  aiQualityCheck: {
    status: "needs_attention",
    summary: "Raport zbudowany z dyktowania. Wykryto korektę radiologa w locie oraz jeden element wymagający uwagi (nieoceniona aorta).",
    checks: [
      { category: "transcription_quality", status: "pass", message: "Jakość transkrypcji: dobra. Usunięto przerywniki („eee”)." },
      { category: "consistency", status: "warning", message: "Korekta w locie: „nerka lewa, nie, prawa” — przyjęto ostatnią wersję (nerka prawa), confidence: niepewne." },
      { category: "completeness", status: "warning", message: "Aorta brzuszna nieoceniona (gazy jelitowe) — odnotowano w ograniczeniach." },
      { category: "consistency", status: "pass", message: "Liczebnik przetworzony: „pięć milimetrów” → „5 mm”." },
    ],
    autoCorrections: ["„pięć milimetrów” → „5 mm”.", "Usunięto przerywniki i powtórzenia z dyktowania.", "Korekta strony: przyjęto „nerka prawa” (ostatnia wersja wypowiedzi)."],
    unresolvedItems: ["Aorta brzuszna — wymaga ponownej oceny po przygotowaniu jelit."],
  },
};

/* ============================================================== CASE D === */
/* USG tarczycy — suboptimal image + low-confidence + conflict (quality).     */
const CASE_D = {
  id: "rad-D", caseKey: "D", patientId: "p-tomasz", radiologistId: "u-rad1",
  examinationType: "USG tarczycy",
  clinicalIndication: "Kontrola po wcześniejszym badaniu. Pacjent zgłasza dyskomfort.",
  examinationContext: {},
  analysisMode: "multimodal",
  pipeline: "advanced",
  imageQuality: "suboptimal",
  imageCount: 2,
  imageLabel: "USG_tarczyca",
  qualityIssues: ["artefakty cienia akustycznego", "częściowe zacienienie lewego płata"],
  rawObservations: ["limited acoustic window", "left lobe partially shadowed", "ill-defined hypoechoic area?", "right lobe homogeneous"],
  findings: [
    { id: "f-d1", text: "Prawy płat tarczycy jednorodny, bez zmian ogniskowych.", isDeviation: false, confidence: "high", anatomicalLocation: "tarczyca — prawy płat", evidence: { imageIndexes: [0] } },
  ],
  lowConfidenceFindings: [
    { id: "f-dL1", text: "Słabo odgraniczony obszar hipoechogeniczny w lewym płacie — struktura częściowo zasłonięta cieniem akustycznym.", isDeviation: true, confidence: "low", anatomicalLocation: "tarczyca — lewy płat", evidence: { imageIndexes: [1], transcriptFragments: ["w lewym płacie widzę zmianę około sześć milimetrów"] } },
  ],
  impression: "Prawy płat tarczycy bez zmian ogniskowych. Lewy płat — ocena ograniczona z powodu suboptymalnej jakości obrazu (cień akustyczny). Sugerowany obszar hipoechogeniczny wymaga weryfikacji w badaniu o lepszej jakości obrazowania.",
  imagingLimitations: "Obraz suboptymalny — artefakty cienia akustycznego utrudniają ocenę lewego płata. Zalecane powtórzenie badania z optymalizacją ustawień aparatu.",
  radiologistRecommendations: "Powtórzenie USG tarczycy z optymalizacją obrazowania lewego płata. Decyzja o dalszym postępowaniu po uzyskaniu obrazu diagnostycznego.",
  classification: null,
  fusionResult: {
    confirmedFindings: [{ id: "fr-d1", text: "Prawy płat tarczycy bez zmian ogniskowych.", confidence: "high", anatomicalLocation: "tarczyca — prawy płat" }],
    imageOnlyFindings: [],
    speechOnlyFindings: [{ id: "fr-d2", text: "Zmiana ok. 6 mm w lewym płacie (z dyktowania).", confidence: "low", anatomicalLocation: "tarczyca — lewy płat" }],
    conflicts: [{
      speechClaim: "Radiolog opisuje zmianę ok. 6 mm w lewym płacie.",
      imageEvidence: "Na dostarczonych obrazach obszar lewego płata jest częściowo zasłonięty cieniem akustycznym — zmiana nie jest jednoznacznie widoczna.",
      note: "Zmiana opisana w dyktowaniu nie została jednoznacznie potwierdzona na obrazie (jakość suboptymalna). Możliwe: obraz wykonany przed zmianą ułożenia głowicy lub artefakt zasłaniający strukturę. Zalecana ponowna akwizycja.",
    }],
  },
  aiSuggestions: [
    { id: "s-d1", type: "additional_observation", title: "Obszar wymaga ponownej akwizycji", confidence: "low", rationale: "Sugerowana zmiana lewego płata nie została potwierdzona obrazowo — nie należy przedstawiać jej jako pewnego rozpoznania.", canInsertIntoReport: false },
  ],
  aiQualityCheck: {
    status: "needs_attention",
    summary: "Jakość obrazu suboptymalna. Wykryto rozbieżność między dyktowaniem a obrazem — element przeniesiony do weryfikacji, nie do raportu formalnego.",
    checks: [
      { category: "image_quality", status: "warning", message: "Jakość obrazu: suboptymalna — artefakty cienia akustycznego w lewym płacie." },
      { category: "source_evidence", status: "fail", message: "Konflikt obraz ↔ dyktowanie: zmiana lewego płata opisana głosowo, niepotwierdzona obrazowo." },
      { category: "completeness", status: "warning", message: "Lewy płat — ocena niepełna z powodu jakości obrazu." },
      { category: "consistency", status: "pass", message: "Wnioski nie przedstawiają niepewnego elementu jako pewnego rozpoznania." },
    ],
    autoCorrections: [],
    unresolvedItems: ["Zmiana lewego płata — wymaga ponownej akwizycji obrazu o jakości diagnostycznej.", "Rozbieżność obraz/dyktowanie — do rozstrzygnięcia przez radiologa."],
  },
};

/* ============================================================== CASE C === */
/* Doctor visit referencing approved Case A. Note + patient explanation.       */
const CASE_A_APPROVED = {
  ...CASE_A,
  id: "rad-A-appr", status: "approved",
  approvedAt: "2026-05-28T10:24:00", aiGenerated: true,
  approvedByName: "dr Anna Lewandowska",
};

const CASE_C = {
  id: "med-C", caseKey: "C", patientId: "p-anna", doctorId: "u-doc1",
  radiologicalReportId: "rad-A-appr",
  transcriptionQuality: "good",
  transcription: "Dzień dobry pani Anno, proszę usiąść. Mam tutaj wynik USG tarczycy. Jak się pani czuje? — Dzień dobry, no w sumie dobrze, czasem czuję taki guzek przy przełykaniu. — Rozumiem. Więc w badaniu USG opisano guzek lewego płata tarczycy, około osiem milimetrów, z klasyfikacją TI-RADS cztery, to znaczy że ma cechy które wymagają sprawdzenia. Bierze pani jakieś leki? — Nie, tylko witaminy. — Dobrze. W badaniu palpacyjnym szyi wyczuwam niewielki guzek lewego płata, węzły chłonne niepowiększone. Zaproponuję biopsję cienkoigłową tego guzka, to ambulatoryjny zabieg. Wyniki hormonów tarczycy ma pani prawidłowe, TSH dwa jeden. Skieruję panią na biopsję i kontrolę za, powiedzmy, sześć tygodni z wynikiem.",
  rawTranscriptionPreview: "dzień dobry pani anno proszę usiąść mam tutaj wynik usg tarczycy jak się pani czuje dzień dobry dobrze czasem czuję guzek przy przełykaniu rozumiem w badaniu usg opisano guzek lewego płata tarczycy około osiem milimetrów ti-rads cztery bierze pani leki nie tylko witaminy w badaniu palpacyjnym wyczuwam guzek lewego płata węzły niepowiększone zaproponuję biopsję cienkoigłową tsh dwa jeden skieruję na biopsję kontrola za sześć tygodni",
  anamnesis: "Pacjentka lat 52, zgłasza okresowe uczucie „guzka” przy przełykaniu. Bez duszności, bez chrypki, bez utraty masy ciała. Nie przyjmuje leków na stałe (jedynie suplementy witaminowe). Badanie palpacyjne szyi: wyczuwalny niewielki guzek lewego płata tarczycy, węzły chłonne szyjne niepowiększone.",
  diagnosis: "Guzek lewego płata tarczycy w klasie ACR TI-RADS 4 (wg USG z 28.05.2026). Funkcja tarczycy prawidłowa (TSH 2,1 mIU/L).",
  diagnosisConfidence: "probable",
  recommendations: "1. Biopsja aspiracyjna cienkoigłowa (BAC) guzka lewego płata — skierowanie wydane.\n2. Kontrola w poradni za 6 tygodni z wynikiem biopsji.\n3. Bez modyfikacji dotychczasowego postępowania; suplementacja bez zmian.",
  uncertainItems: [],
  patientExplanation: {
    plainLanguageSummary: "W badaniu USG szyi znaleziono niewielką zmianę (około 8 mm) w lewej części tarczycy. Taka zmiana jest częsta, ale ma kilka cech, które warto dokładnie sprawdzić, dlatego zaplanowaliśmy pobranie próbki cienką igłą. Hormony tarczycy ma Pani w normie.",
    keyFindings: [
      "Niewielka zmiana (ok. 8 mm) w lewej części tarczycy.",
      "Wynik hormonów tarczycy (TSH) jest prawidłowy.",
      "Węzły chłonne na szyi nie są powiększone.",
    ],
    nextSteps: [
      "Wykonać biopsję cienkoigłową zmiany (krótki zabieg ambulatoryjny) — skierowanie już wydane.",
      "Zgłosić się na kontrolę za około 6 tygodni z wynikiem biopsji.",
      "Suplementy przyjmować bez zmian.",
    ],
    followUp: "Wizyta kontrolna za 6 tygodni z wynikiem biopsji.",
    sourceReportId: "med-C",
    generatedAt: "2026-06-04T09:10:00",
  },
  aiQualityCheck: {
    status: "ready",
    summary: "Notatka spójna z raportem radiologicznym. AI poprawnie rozróżniło wypowiedzi lekarza i pacjenta. Wersja dla pacjenta nie dodaje nowych faktów medycznych.",
    checks: [
      { category: "consistency", status: "pass", message: "Rozpoznanie zgodne z raportem USG (TI-RADS 4, guzek lewego płata)." },
      { category: "completeness", status: "pass", message: "Rozróżniono wypowiedzi lekarza i pacjenta." },
      { category: "consistency", status: "pass", message: "Zalecenia wynikają z rozmowy i raportu radiologicznego." },
      { category: "patient_explanation", status: "pass", message: "Wersja dla pacjenta bez terminologii łacińskiej; nie dodaje nowych faktów." },
    ],
    autoCorrections: ["„TSH dwa jeden” → „TSH 2,1 mIU/L”.", "Usunięto powitania i przerywniki niemedyczne."],
    unresolvedItems: [],
  },
};

/* ----------------------------------------------------- approved seed list -- */
const SEED_RAD_REPORTS = [
  { ...CASE_A_APPROVED },
  {
    id: "rad-seed-1", caseKey: null, patientId: "p-marek", radiologistId: "u-rad1",
    examinationType: "USG jamy brzusznej", status: "approved", aiGenerated: true,
    analysisMode: "voice", approvedAt: "2026-05-30T14:05:00", approvedByName: "dr Anna Lewandowska",
    impressionShort: "Bez istotnych odchyleń; torbiel nerki prawej (Bosniak I).",
  },
  {
    id: "rad-seed-2", caseKey: null, patientId: "p-ewa", radiologistId: "u-rad1",
    examinationType: "USG ginekologiczne transwaginalne (TV)", status: "approved", aiGenerated: true,
    analysisMode: "image", approvedAt: "2026-06-01T11:40:00", approvedByName: "dr Anna Lewandowska",
    impressionShort: "Zmiana przydatków O-RADS 2 — prawdopodobnie łagodna.",
  },
];

/* dashboard rows for radiologist (drafts + approved) */
const RAD_EXAM_ROWS = [
  { id: "rad-A", caseKey: "A", patientId: "p-anna",   type: "USG tarczycy",       date: "2026-06-04", status: "draft",    mode: "image",      summary: "Zmiana 8 mm lewy płat — TI-RADS 4" },
  { id: "rad-B", caseKey: "B", patientId: "p-marek",  type: "USG jamy brzusznej", date: "2026-06-04", status: "draft",    mode: "voice",      summary: "Z dyktowania — kontrola" },
  { id: "rad-D", caseKey: "D", patientId: "p-tomasz", type: "USG tarczycy",       date: "2026-06-04", status: "draft",    mode: "multimodal", summary: "Jakość suboptymalna — konflikt" },
  { id: "rad-A-appr", caseKey: null, patientId: "p-anna",  type: "USG tarczycy",       date: "2026-05-28", status: "approved", mode: "image", summary: "TI-RADS 4 — zatwierdzony" },
  { id: "rad-seed-1", caseKey: null, patientId: "p-marek", type: "USG jamy brzusznej", date: "2026-05-30", status: "approved", mode: "voice", summary: "Torbiel nerki (Bosniak I)" },
  { id: "rad-seed-2", caseKey: null, patientId: "p-ewa",   type: "USG ginekologiczne (TV)", date: "2026-06-01", status: "approved", mode: "image", summary: "O-RADS 2 — łagodna" },
];

/* dashboard rows for doctor */
const DOC_VISIT_ROWS = [
  { id: "med-C", caseKey: "C", patientId: "p-anna",  type: "Wizyta — omówienie USG tarczycy", date: "2026-06-04", status: "draft",    linkedReport: "rad-A-appr" },
  { id: "med-seed-1", caseKey: null, patientId: "p-marek", type: "Wizyta kontrolna", date: "2026-05-31", status: "approved", linkedReport: "rad-seed-1" },
];

const GOLDEN = { A: CASE_A, B: CASE_B, C: CASE_C, D: CASE_D };

window.SonaraData = {
  USERS, PATIENTS, EXAM_TYPES, CONF, GOLDEN,
  CASE_A, CASE_B, CASE_C, CASE_D, CASE_A_APPROVED,
  SEED_RAD_REPORTS, RAD_EXAM_ROWS, DOC_VISIT_ROWS,
};
