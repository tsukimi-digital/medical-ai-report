/**
 * Sonara — Mock API Client
 * Typed functions matching all endpoints in docs/api-contract.md.
 * Returns data from 4 Golden Cases; simulates network delay.
 */

import type {
  User,
  Patient,
  PatientInput,
  RadiologicalReport,
  RadiologyReportInput,
  RadiologyReportDraft,
  MedicalReport,
  MedicalReportInput,
  MedicalReportDraft,
  ImageAnalysisResult,
  ExaminationContext,
  FusionResult,
  PatientExplanation,
  Finding,
  AISuggestion,
} from './types'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

// ---------------------------------------------------------------------------
// seed data (Golden Cases)
// ---------------------------------------------------------------------------

const USERS: User[] = [
  { id: 'u-rad1', name: 'dr Anna Lewandowska', email: 'rad1@demo.pl', role: 'radiologist', initials: 'AL' },
  { id: 'u-rad2', name: 'dr Piotr Zieliński',  email: 'rad2@demo.pl', role: 'radiologist', initials: 'PZ' },
  { id: 'u-rad3', name: 'dr Katarzyna Wiśniewska', email: 'rad3@demo.pl', role: 'radiologist', initials: 'KW' },
  { id: 'u-doc1', name: 'lek. Marta Sawicka',  email: 'doc1@demo.pl', role: 'doctor', initials: 'MS' },
  { id: 'u-doc2', name: 'lek. Jan Kowalczyk',  email: 'doc2@demo.pl', role: 'doctor', initials: 'JK' },
  { id: 'u-doc3', name: 'lek. Tomasz Nowak',   email: 'doc3@demo.pl', role: 'doctor', initials: 'TN' },
  { id: 'u-doc4', name: 'lek. Ewa Kamińska',   email: 'doc4@demo.pl', role: 'doctor', initials: 'EK' },
]

const PATIENTS: Patient[] = [
  { id: 'p-anna',   firstName: 'Anna',   lastName: 'Kowalska',   pesel: '74050512388', gender: 'F', dateOfBirth: '1974-05-05', age: 52 },
  { id: 'p-marek',  firstName: 'Marek',  lastName: 'Nowak',      pesel: '65021034177', gender: 'M', dateOfBirth: '1965-02-10', age: 61 },
  { id: 'p-tomasz', firstName: 'Tomasz', lastName: 'Wiśniewski', pesel: '81071245699', gender: 'M', dateOfBirth: '1981-07-12', age: 45 },
  { id: 'p-ewa',    firstName: 'Ewa',    lastName: 'Mazur',      pesel: '90031567422', gender: 'F', dateOfBirth: '1990-03-15', age: 36 },
]

const CASE_A: RadiologicalReport = {
  id: 'rad-A', caseKey: 'A', patientId: 'p-anna', radiologistId: 'u-rad1',
  examinationType: 'USG tarczycy',
  clinicalIndication: 'Wyczuwalny guzek tarczycy do oceny. Bez objawów uciskowych.',
  examinationContext: { relevantLabValues: [{ label: 'TSH', value: '2.1', unit: 'mIU/L' }] },
  analysisMode: 'image',
  imageQuality: 'diagnostic',
  imageCount: 3,
  imageLabel: 'USG_tarczyca',
  pipeline: 'advanced',
  images: [],
  rawObservations: [
    'hypoechoic solid nodule', 'left thyroid lobe, mid-third', '~8 mm (longest axis)',
    'irregular / lobulated margins', 'punctate echogenic foci (microcalcifications)',
    'taller-than-wide: no', 'right lobe homogeneous', 'isthmus normal thickness',
  ],
  findings: [
    { id: 'f-a1', text: 'Zmiana ogniskowa lita, hipoechogeniczna w środkowej części lewego płata, wymiar ok. 8 mm.', isDeviation: true, confidence: 'high', anatomicalLocation: 'tarczyca — lewy płat', evidence: { imageIndexes: [1, 2] } },
    { id: 'f-a2', text: 'Marginesy zmiany nieregularne, miejscami zatarte.', isDeviation: true, confidence: 'medium', anatomicalLocation: 'tarczyca — lewy płat', evidence: { imageIndexes: [1, 2] } },
    { id: 'f-a3', text: 'Liczne drobne ogniska hiperechogeniczne w obrębie zmiany — obraz mikrozwapnień.', isDeviation: true, confidence: 'medium', anatomicalLocation: 'tarczyca — lewy płat', evidence: { imageIndexes: [2] } },
    { id: 'f-a4', text: 'Prawy płat tarczycy jednorodny, prawidłowej echogeniczności, bez zmian ogniskowych.', isDeviation: false, confidence: 'high', anatomicalLocation: 'tarczyca — prawy płat', evidence: { imageIndexes: [0] } },
    { id: 'f-a5', text: 'Cieśń tarczycy niepogrubiała (3 mm).', isDeviation: false, confidence: 'high', anatomicalLocation: 'tarczyca — cieśń', evidence: { imageIndexes: [0] } },
  ],
  lowConfidenceFindings: [
    { id: 'f-aL1', text: 'Możliwy drobny węzeł chłonny grupy III po stronie lewej — częściowo poza kadrem.', isDeviation: true, confidence: 'low', anatomicalLocation: 'szyja — grupa III lewa', evidence: { imageIndexes: [2] } },
  ],
  impression: 'Pojedyncza zmiana ogniskowa lewego płata tarczycy o cechach podwyższonego ryzyka. Klasyfikacja ACR TI-RADS 4 (lita: 2 pkt; hipoechogeniczna: 2 pkt; marginesy nieregularne: 2 pkt; mikrozwapnienia: 3 pkt; kształt „szerszy niż wyższy": 0 pkt — razem 9 pkt). Wymiar < 15 mm. Zalecana weryfikacja cytologiczna.',
  imagingLimitations: 'Ocena węzłów chłonnych szyjnych ograniczona — kadr nie obejmuje pełnych grup. Badanie bez opcji Doppler — brak oceny unaczynienia zmiany.',
  radiologistRecommendations: 'Biopsja aspiracyjna cienkoigłowa (BAC) zmiany lewego płata pod kontrolą USG. W razie wyniku łagodnego — kontrola USG za 6 miesięcy.',
  classification: { name: 'ACR TI-RADS', value: 'TR4', label: 'Średnie ryzyko', points: 9 },
  aiSuggestions: [
    { id: 's-a1', type: 'differential_diagnosis', title: 'Rak brodawkowaty tarczycy', confidence: 'medium', rationale: 'Współwystępowanie mikrozwapnień, hipoechogeniczności i nieregularnych marginesów to klasyczna konstelacja cech podwyższonego ryzyka.', canInsertIntoReport: true },
    { id: 's-a2', type: 'differential_diagnosis', title: 'Guzek koloidowy z wtórnymi zmianami', confidence: 'low', rationale: 'Mniej prawdopodobny przy obecności mikrozwapnień; nie można jednak wykluczyć bez cytologii.', canInsertIntoReport: true },
    { id: 's-a3', type: 'additional_observation', title: 'Asymetria echogeniczności płatów', confidence: 'low', rationale: 'Lewy płat nieco bardziej heterogenny — w korelacji klinicznej warto rozważyć ocenę przeciwciał anty-TPO.', canInsertIntoReport: true },
  ],
  aiQualityCheck: {
    status: 'needs_attention',
    summary: 'Draft gotowy do weryfikacji. Klasyfikacja TI-RADS wymaga potwierdzenia cech punktowanych; 1 element o niskiej pewności przeniesiono do sekcji „Wymaga weryfikacji".',
    checks: [
      { category: 'image_quality', status: 'pass', message: 'Jakość obrazu: diagnostyczna (3/3 obrazy).' },
      { category: 'completeness', status: 'pass', message: 'Wszystkie obowiązkowe struktury tarczycy ocenione.' },
      { category: 'consistency', status: 'pass', message: 'Wnioski spójne ze znaleziskami.' },
      { category: 'classification', status: 'warning', message: 'Klasyfikacja ACR TI-RADS 4 — potwierdź ręcznie cechy punktowane (marginesy, mikrozwapnienia).' },
      { category: 'source_evidence', status: 'pass', message: 'Wszystkie znaleziska mają wskazane źródło obrazowe.' },
      { category: 'consistency', status: 'warning', message: '1 element o niskiej pewności (węzeł chłonny) → sekcja „Wymaga weryfikacji".' },
    ],
    autoCorrections: ['Ujednolicono zapis wymiaru zmiany: „osiem mm" → „8 mm".'],
    unresolvedItems: ['Pełna ocena węzłów chłonnych szyjnych — kadr niekompletny.'],
  },
  aiGenerated: true,
  status: 'draft',
  createdAt: '2026-06-04T08:00:00',
}

const CASE_A_APPROVED: RadiologicalReport = {
  ...CASE_A,
  id: 'rad-A-appr',
  status: 'approved',
  approvedAt: '2026-05-28T10:24:00',
  approvedByName: 'dr Anna Lewandowska',
}

const CASE_B: RadiologicalReport = {
  id: 'rad-B', caseKey: 'B', patientId: 'p-marek', radiologistId: 'u-rad1',
  examinationType: 'USG jamy brzusznej',
  clinicalIndication: 'Nawracające bóle brzucha, kontrola.',
  examinationContext: { fastingStatus: 'fasting' },
  analysisMode: 'voice',
  pipeline: 'two-step',
  images: [],
  findings: [
    { id: 'f-b1', text: 'Wątroba niepowiększona, echogeniczność prawidłowa, bez zmian ogniskowych.', isDeviation: false, confidence: 'high', anatomicalLocation: 'wątroba', evidence: { transcriptFragments: ['wątroba niepowiększona, echogeniczność prawidłowa, bez zmian ogniskowych'] } },
    { id: 'f-b2', text: 'Drogi żółciowe wewnątrz- i zewnątrzwątrobowe nieposzerzone.', isDeviation: false, confidence: 'high', anatomicalLocation: 'drogi żółciowe', evidence: { transcriptFragments: ['drogi żółciowe wewnątrz i zewnątrzwątrobowe nieposzerzone'] } },
    { id: 'f-b3', text: 'Pęcherzyk żółciowy bez złogów, ściana cienka.', isDeviation: false, confidence: 'high', anatomicalLocation: 'pęcherzyk żółciowy', evidence: { transcriptFragments: ['pęcherzyk żółciowy bez złogów ściana cienka'] } },
    { id: 'f-b4', text: 'Torbiel prosta dolnego bieguna nerki prawej, wymiar ok. 5 mm.', isDeviation: true, confidence: 'medium', anatomicalLocation: 'nerka prawa — dolny biegun', evidence: { transcriptFragments: ['nerka lewa, nie, przepraszam, prawa — torbiel prosta dolnego bieguna, około pięć milimetrów'] } },
    { id: 'f-b5', text: 'Nerka lewa bez zmian ogniskowych.', isDeviation: false, confidence: 'high', anatomicalLocation: 'nerka lewa', evidence: { transcriptFragments: ['nerka lewa bez zmian'] } },
    { id: 'f-b6', text: 'Bez wolnego płynu w jamie otrzewnej.', isDeviation: false, confidence: 'high', anatomicalLocation: 'jama otrzewnej', evidence: { transcriptFragments: ['bez wolnego płynu'] } },
  ],
  lowConfidenceFindings: [],
  impression: 'Badanie USG jamy brzusznej w granicach normy z wyjątkiem prostej torbieli (Bosniak I) dolnego bieguna nerki prawej, wymiar 5 mm — zmiana łagodna, bez znaczenia klinicznego. Aorta brzuszna nieoceniona (gazy jelitowe).',
  imagingLimitations: 'Aorta brzuszna oraz trzustka oceniane w ograniczonych przekrojach z powodu gazów jelitowych — pełna ocena niemożliwa.',
  radiologistRecommendations: 'Torbiel nerki prawej (Bosniak I) — bez konieczności kontroli. W razie utrzymywania się dolegliwości — rozważyć ponowną ocenę aorty po przygotowaniu jelit.',
  classification: null,
  aiSuggestions: [
    { id: 's-b1', type: 'additional_observation', title: 'Trzustka nie w pełni oceniona', confidence: 'low', rationale: 'Radiolog zaznaczył „w dostępnych przekrojach" — warto odnotować ograniczenie w sekcji Ograniczenia badania.', canInsertIntoReport: true },
  ],
  aiQualityCheck: {
    status: 'needs_attention',
    summary: 'Raport zbudowany z dyktowania. Wykryto korektę radiologa w locie oraz jeden element wymagający uwagi (nieoceniona aorta).',
    checks: [
      { category: 'transcription_quality', status: 'pass', message: 'Jakość transkrypcji: dobra. Usunięto przerywniki („eee").' },
      { category: 'consistency', status: 'warning', message: 'Korekta w locie: „nerka lewa, nie, prawa" — przyjęto ostatnią wersję (nerka prawa), confidence: niepewne.' },
      { category: 'completeness', status: 'warning', message: 'Aorta brzuszna nieoceniona (gazy jelitowe) — odnotowano w ograniczeniach.' },
      { category: 'consistency', status: 'pass', message: 'Liczebnik przetworzony: „pięć milimetrów" → „5 mm".' },
    ],
    autoCorrections: ['„pięć milimetrów" → „5 mm".', 'Usunięto przerywniki i powtórzenia z dyktowania.', 'Korekta strony: przyjęto „nerka prawa" (ostatnia wersja wypowiedzi).'],
    unresolvedItems: ['Aorta brzuszna — wymaga ponownej oceny po przygotowaniu jelit.'],
  },
  aiGenerated: true,
  status: 'draft',
  createdAt: '2026-06-04T09:00:00',
}

const CASE_D: RadiologicalReport = {
  id: 'rad-D', caseKey: 'D', patientId: 'p-tomasz', radiologistId: 'u-rad1',
  examinationType: 'USG tarczycy',
  clinicalIndication: 'Kontrola po wcześniejszym badaniu. Pacjent zgłasza dyskomfort.',
  examinationContext: {},
  analysisMode: 'multimodal',
  pipeline: 'advanced',
  imageQuality: 'suboptimal',
  imageCount: 2,
  imageLabel: 'USG_tarczyca',
  images: [],
  qualityIssues: ['artefakty cienia akustycznego', 'częściowe zacienienie lewego płata'],
  rawObservations: ['limited acoustic window', 'left lobe partially shadowed', 'ill-defined hypoechoic area?', 'right lobe homogeneous'],
  findings: [
    { id: 'f-d1', text: 'Prawy płat tarczycy jednorodny, bez zmian ogniskowych.', isDeviation: false, confidence: 'high', anatomicalLocation: 'tarczyca — prawy płat', evidence: { imageIndexes: [0] } },
  ],
  lowConfidenceFindings: [
    { id: 'f-dL1', text: 'Słabo odgraniczony obszar hipoechogeniczny w lewym płacie — struktura częściowo zasłonięta cieniem akustycznym.', isDeviation: true, confidence: 'low', anatomicalLocation: 'tarczyca — lewy płat', evidence: { imageIndexes: [1], transcriptFragments: ['w lewym płacie widzę zmianę około sześć milimetrów'] } },
  ],
  impression: 'Prawy płat tarczycy bez zmian ogniskowych. Lewy płat — ocena ograniczona z powodu suboptymalnej jakości obrazu (cień akustyczny). Sugerowany obszar hipoechogeniczny wymaga weryfikacji w badaniu o lepszej jakości obrazowania.',
  imagingLimitations: 'Obraz suboptymalny — artefakty cienia akustycznego utrudniają ocenę lewego płata. Zalecane powtórzenie badania z optymalizacją ustawień aparatu.',
  radiologistRecommendations: 'Powtórzenie USG tarczycy z optymalizacją obrazowania lewego płata. Decyzja o dalszym postępowaniu po uzyskaniu obrazu diagnostycznego.',
  classification: null,
  fusionResult: {
    confirmedFindings: [{ id: 'fr-d1', text: 'Prawy płat tarczycy bez zmian ogniskowych.', confidence: 'high', anatomicalLocation: 'tarczyca — prawy płat', isDeviation: false }],
    imageOnlyFindings: [],
    speechOnlyFindings: [{ id: 'fr-d2', text: 'Zmiana ok. 6 mm w lewym płacie (z dyktowania).', confidence: 'low', anatomicalLocation: 'tarczyca — lewy płat', isDeviation: true }],
    conflicts: [{
      speechClaim: 'Radiolog opisuje zmianę ok. 6 mm w lewym płacie.',
      imageEvidence: 'Na dostarczonych obrazach obszar lewego płata jest częściowo zasłonięty cieniem akustycznym — zmiana nie jest jednoznacznie widoczna.',
      note: 'Zmiana opisana w dyktowaniu nie została jednoznacznie potwierdzona na obrazie (jakość suboptymalna). Możliwe: obraz wykonany przed zmianą ułożenia głowicy lub artefakt zasłaniający strukturę. Zalecana ponowna akwizycja.',
    }],
  },
  aiSuggestions: [
    { id: 's-d1', type: 'additional_observation', title: 'Obszar wymaga ponownej akwizycji', confidence: 'low', rationale: 'Sugerowana zmiana lewego płata nie została potwierdzona obrazowo — nie należy przedstawiać jej jako pewnego rozpoznania.', canInsertIntoReport: false },
  ],
  aiQualityCheck: {
    status: 'needs_attention',
    summary: 'Jakość obrazu suboptymalna. Wykryto rozbieżność między dyktowaniem a obrazem — element przeniesiony do weryfikacji, nie do raportu formalnego.',
    checks: [
      { category: 'image_quality', status: 'warning', message: 'Jakość obrazu: suboptymalna — artefakty cienia akustycznego w lewym płacie.' },
      { category: 'source_evidence', status: 'fail', message: 'Konflikt obraz ↔ dyktowanie: zmiana lewego płata opisana głosowo, niepotwierdzona obrazowo.' },
      { category: 'completeness', status: 'warning', message: 'Lewy płat — ocena niepełna z powodu jakości obrazu.' },
      { category: 'consistency', status: 'pass', message: 'Wnioski nie przedstawiają niepewnego elementu jako pewnego rozpoznania.' },
    ],
    autoCorrections: [],
    unresolvedItems: ['Zmiana lewego płata — wymaga ponownej akwizycji obrazu o jakości diagnostycznej.', 'Rozbieżność obraz/dyktowanie — do rozstrzygnięcia przez radiologa.'],
  },
  aiGenerated: true,
  status: 'draft',
  createdAt: '2026-06-04T10:00:00',
}

const CASE_C: MedicalReport = {
  id: 'med-C', caseKey: 'C', patientId: 'p-anna', doctorId: 'u-doc1',
  radiologicalReportId: 'rad-A-appr',
  transcription: 'Dzień dobry pani Anno, proszę usiąść. Mam tutaj wynik USG tarczycy...',
  transcriptionQuality: 'good',
  anamnesis: 'Pacjentka lat 52, zgłasza okresowe uczucie „guzka" przy przełykaniu. Bez duszności, bez chrypki, bez utraty masy ciała. Nie przyjmuje leków na stałe (jedynie suplementy witaminowe). Badanie palpacyjne szyi: wyczuwalny niewielki guzek lewego płata tarczycy, węzły chłonne szyjne niepowiększone.',
  diagnosis: 'Guzek lewego płata tarczycy w klasie ACR TI-RADS 4 (wg USG z 28.05.2026). Funkcja tarczycy prawidłowa (TSH 2,1 mIU/L).',
  diagnosisConfidence: 'probable',
  recommendations: '1. Biopsja aspiracyjna cienkoigłowa (BAC) guzka lewego płata — skierowanie wydane.\n2. Kontrola w poradni za 6 tygodni z wynikiem biopsji.\n3. Bez modyfikacji dotychczasowego postępowania; suplementacja bez zmian.',
  uncertainItems: [],
  patientExplanation: {
    plainLanguageSummary: 'W badaniu USG szyi znaleziono niewielką zmianę (około 8 mm) w lewej części tarczycy. Taka zmiana jest częsta, ale ma kilka cech, które warto dokładnie sprawdzić, dlatego zaplanowaliśmy pobranie próbki cienką igłą. Hormony tarczycy ma Pani w normie.',
    keyFindings: ['Niewielka zmiana (ok. 8 mm) w lewej części tarczycy.', 'Wynik hormonów tarczycy (TSH) jest prawidłowy.', 'Węzły chłonne na szyi nie są powiększone.'],
    nextSteps: ['Wykonać biopsję cienkoigłową zmiany (krótki zabieg ambulatoryjny) — skierowanie już wydane.', 'Zgłosić się na kontrolę za około 6 tygodni z wynikiem biopsji.', 'Suplementy przyjmować bez zmian.'],
    followUp: 'Wizyta kontrolna za 6 tygodni z wynikiem biopsji.',
    sourceReportId: 'med-C',
    generatedAt: '2026-06-04T09:10:00',
  },
  aiQualityCheck: {
    status: 'ready',
    summary: 'Notatka spójna z raportem radiologicznym. AI poprawnie rozróżniło wypowiedzi lekarza i pacjenta. Wersja dla pacjenta nie dodaje nowych faktów medycznych.',
    checks: [
      { category: 'consistency', status: 'pass', message: 'Rozpoznanie zgodne z raportem USG (TI-RADS 4, guzek lewego płata).' },
      { category: 'completeness', status: 'pass', message: 'Rozróżniono wypowiedzi lekarza i pacjenta.' },
      { category: 'consistency', status: 'pass', message: 'Zalecenia wynikają z rozmowy i raportu radiologicznego.' },
      { category: 'patient_explanation', status: 'pass', message: 'Wersja dla pacjenta bez terminologii łacińskiej; nie dodaje nowych faktów.' },
    ],
    autoCorrections: ['„TSH dwa jeden" → „TSH 2,1 mIU/L".', 'Usunięto powitania i przerywniki niemedyczne.'],
    unresolvedItems: [],
  },
  aiGenerated: true,
  status: 'draft',
  createdAt: '2026-06-04T09:05:00',
}

const SEED_RAD_REPORTS: RadiologicalReport[] = [
  CASE_A,
  CASE_A_APPROVED,
  CASE_B,
  CASE_D,
  {
    id: 'rad-seed-1', caseKey: null, patientId: 'p-marek', radiologistId: 'u-rad1',
    examinationType: 'USG jamy brzusznej', status: 'approved', aiGenerated: true,
    images: [],
    analysisMode: 'voice',
    approvedAt: '2026-05-30T14:05:00',
    approvedByName: 'dr Anna Lewandowska',
    findings: [],
    impression: 'Bez istotnych odchyleń; torbiel nerki prawej (Bosniak I).',
    createdAt: '2026-05-30T13:00:00',
  },
  {
    id: 'rad-seed-2', caseKey: null, patientId: 'p-ewa', radiologistId: 'u-rad1',
    examinationType: 'USG ginekologiczne transwaginalne (TV)', status: 'approved', aiGenerated: true,
    images: [],
    analysisMode: 'image',
    approvedAt: '2026-06-01T11:40:00',
    approvedByName: 'dr Anna Lewandowska',
    findings: [],
    impression: 'Zmiana przydatków O-RADS 2 — prawdopodobnie łagodna.',
    createdAt: '2026-06-01T10:00:00',
  },
]

const SEED_MED_REPORTS: MedicalReport[] = [
  CASE_C,
  {
    id: 'med-seed-1', caseKey: null, patientId: 'p-marek', doctorId: 'u-doc1',
    radiologicalReportId: 'rad-seed-1',
    transcription: '',
    anamnesis: 'Wizyta kontrolna.',
    diagnosis: 'Stan po badaniu USG.',
    diagnosisConfidence: 'definitive',
    recommendations: 'Obserwacja.',
    uncertainItems: [],
    aiGenerated: true,
    status: 'approved',
    createdAt: '2026-05-31T14:00:00',
    approvedAt: '2026-05-31T14:30:00',
  },
]

// In-memory mutable store
let patientsStore: Patient[] = [...PATIENTS]
let radReportsStore: RadiologicalReport[] = [...SEED_RAD_REPORTS]
let medReportsStore: MedicalReport[] = [...SEED_MED_REPORTS]

// Current session user (set by login)
let sessionUser: User | null = USERS[0]

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authClient = {
  async login(email: string, password: string): Promise<{ user: User }> {
    await delay(400)
    if (password !== 'demo2024') throw new Error('401')
    const user = USERS.find((u) => u.email === email)
    if (!user) throw new Error('401')
    sessionUser = user
    return { user }
  },

  async logout(): Promise<void> {
    await delay(200)
    sessionUser = null
  },

  async me(): Promise<{ user: User }> {
    await delay(150)
    if (!sessionUser) throw new Error('401')
    return { user: sessionUser }
  },
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patientsClient = {
  async getPatients(): Promise<{ patients: Patient[] }> {
    await delay(300)
    return { patients: [...patientsStore] }
  },

  async getPatient(id: string): Promise<{ patient: Patient }> {
    await delay(200)
    const patient = patientsStore.find((p) => p.id === id)
    if (!patient) throw new Error('404')
    return { patient }
  },

  async createPatient(data: PatientInput): Promise<{ patient: Patient }> {
    await delay(500)
    if (!data.pesel || data.pesel.length !== 11) throw new Error('400: invalid PESEL')
    const existing = patientsStore.find((p) => p.pesel === data.pesel)
    if (existing) throw new Error('409: PESEL already exists')
    const born = new Date(data.dateOfBirth)
    const age = Math.floor((Date.now() - born.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    const patient: Patient = { id: `p-${uuid().slice(0, 8)}`, age, ...data, createdAt: new Date().toISOString() }
    patientsStore = [...patientsStore, patient]
    return { patient }
  },
}

// ---------------------------------------------------------------------------
// Radiological Reports
// ---------------------------------------------------------------------------

export const radReportsClient = {
  async getReports(patientId?: string): Promise<{ reports: RadiologicalReport[] }> {
    await delay(400)
    const reports = patientId
      ? radReportsStore.filter((r) => r.patientId === patientId)
      : [...radReportsStore]
    return { reports }
  },

  async getReport(id: string): Promise<{ report: RadiologicalReport }> {
    await delay(250)
    const report = radReportsStore.find((r) => r.id === id)
    if (!report) throw new Error('404')
    return { report }
  },

  async createReport(data: RadiologyReportInput): Promise<{ report: RadiologicalReport }> {
    await delay(500)
    const report: RadiologicalReport = {
      id: `rad-${uuid().slice(0, 8)}`,
      patientId: data.patientId,
      radiologistId: sessionUser?.id ?? 'u-rad1',
      examinationType: data.examinationType,
      clinicalIndication: data.clinicalIndication,
      examinationContext: data.examinationContext,
      comments: data.comments,
      analysisMode: data.analysisMode,
      images: [],
      findings: [],
      aiGenerated: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    radReportsStore = [...radReportsStore, report]
    return { report }
  },

  async updateReport(id: string, data: Partial<RadiologicalReport>): Promise<{ report: RadiologicalReport }> {
    await delay(300)
    const idx = radReportsStore.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('404')
    if (radReportsStore[idx].status === 'approved') throw new Error('403')
    const updated = { ...radReportsStore[idx], ...data }
    radReportsStore = [...radReportsStore.slice(0, idx), updated, ...radReportsStore.slice(idx + 1)]
    return { report: updated }
  },

  async approveReport(id: string): Promise<{ report: RadiologicalReport }> {
    await delay(400)
    const idx = radReportsStore.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('404')
    const r = radReportsStore[idx]
    if (r.status === 'approved') throw new Error('403')
    if ((!r.findings || r.findings.length === 0) && !r.impression) throw new Error('400')
    const updated = {
      ...r,
      status: 'approved' as const,
      approvedAt: new Date().toISOString(),
      approvedByName: sessionUser?.name ?? '',
    }
    radReportsStore = [...radReportsStore.slice(0, idx), updated, ...radReportsStore.slice(idx + 1)]
    return { report: updated }
  },
}

// ---------------------------------------------------------------------------
// Medical Reports
// ---------------------------------------------------------------------------

export const medReportsClient = {
  async getReports(patientId?: string): Promise<{ reports: MedicalReport[] }> {
    await delay(400)
    const reports = patientId
      ? medReportsStore.filter((r) => r.patientId === patientId)
      : [...medReportsStore]
    return { reports }
  },

  async getReport(id: string): Promise<{ report: MedicalReport }> {
    await delay(250)
    const report = medReportsStore.find((r) => r.id === id)
    if (!report) throw new Error('404')
    return { report }
  },

  async createReport(data: MedicalReportInput): Promise<{ report: MedicalReport }> {
    await delay(500)
    const report: MedicalReport = {
      id: `med-${uuid().slice(0, 8)}`,
      patientId: data.patientId,
      doctorId: sessionUser?.id ?? 'u-doc1',
      radiologicalReportId: data.radiologicalReportId,
      transcription: data.transcription ?? '',
      anamnesis: '',
      diagnosis: '',
      diagnosisConfidence: 'probable',
      recommendations: '',
      uncertainItems: [],
      aiGenerated: false,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    medReportsStore = [...medReportsStore, report]
    return { report }
  },

  async updateReport(id: string, data: Partial<MedicalReport>): Promise<{ report: MedicalReport }> {
    await delay(300)
    const idx = medReportsStore.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('404')
    if (medReportsStore[idx].status === 'approved') throw new Error('403')
    const updated = { ...medReportsStore[idx], ...data }
    medReportsStore = [...medReportsStore.slice(0, idx), updated, ...medReportsStore.slice(idx + 1)]
    return { report: updated }
  },

  async approveReport(id: string): Promise<{ report: MedicalReport }> {
    await delay(400)
    const idx = medReportsStore.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error('404')
    const r = medReportsStore[idx]
    if (r.status === 'approved') throw new Error('403')
    if (!r.anamnesis || !r.diagnosis || !r.recommendations) throw new Error('400')
    const updated = {
      ...r,
      status: 'approved' as const,
      approvedAt: new Date().toISOString(),
    }
    medReportsStore = [...medReportsStore.slice(0, idx), updated, ...medReportsStore.slice(idx + 1)]
    return { report: updated }
  },
}

// ---------------------------------------------------------------------------
// AI (mock — returns demo results without calling real APIs)
// ---------------------------------------------------------------------------

export const aiClient = {
  async analyzeImage(
    _formData: FormData,
  ): Promise<ImageAnalysisResult> {
    await delay(2000)
    return {
      imageQuality: 'diagnostic',
      findings: CASE_A.findings,
      lowConfidenceFindings: CASE_A.lowConfidenceFindings,
      aiSuggestions: CASE_A.aiSuggestions,
      aiQualityCheck: CASE_A.aiQualityCheck,
      impression: CASE_A.impression,
      imagingLimitations: CASE_A.imagingLimitations,
      rawObservations: CASE_A.rawObservations,
    }
  },

  async transcribe(
    _audio: Blob,
    _language: 'pl' | 'en',
  ): Promise<{ transcription: string; transcriptionWarning?: string }> {
    await delay(1500)
    return { transcription: CASE_B.findings?.map((f) => f.text).join(' ') ?? '' }
  },

  async generateReport(params: {
    transcription: string
    role: 'radiologist' | 'doctor'
    examinationType?: string
    examinationContext?: ExaminationContext
    patientAge: number
    patientGender: 'M' | 'F'
    language: 'pl' | 'en'
    radiologicalReportId?: string
  }): Promise<RadiologyReportDraft | MedicalReportDraft> {
    await delay(2000)
    if (params.role === 'radiologist') {
      const draft: RadiologyReportDraft = {
        findings: CASE_B.findings,
        impression: CASE_B.impression,
        aiQualityCheck: CASE_B.aiQualityCheck,
      }
      return draft
    }
    const draft: MedicalReportDraft = {
      anamnesis: CASE_C.anamnesis,
      diagnosis: CASE_C.diagnosis,
      diagnosisConfidence: CASE_C.diagnosisConfidence,
      recommendations: CASE_C.recommendations,
      uncertainItems: CASE_C.uncertainItems,
      patientExplanation: CASE_C.patientExplanation,
      aiQualityCheck: CASE_C.aiQualityCheck,
    }
    return draft
  },

  async fuseFindings(
    findingsFromImages: Finding[],
    findingsFromSpeech: Finding[],
  ): Promise<FusionResult> {
    await delay(1500)
    return CASE_D.fusionResult!
  },

  async generatePatientExplanation(params: {
    reportId: string
    reportType: 'radiological' | 'medical'
    transcription?: string
  }): Promise<PatientExplanation> {
    await delay(1500)
    return CASE_C.patientExplanation!
  },
}

// ---------------------------------------------------------------------------
// Convenience export (combined apiClient)
// ---------------------------------------------------------------------------

export const apiClient = {
  // auth
  login: authClient.login,
  logout: authClient.logout,
  me: authClient.me,

  // patients
  getPatients: patientsClient.getPatients,
  getPatient: patientsClient.getPatient,
  createPatient: patientsClient.createPatient,

  // radiological reports
  getRadReports: radReportsClient.getReports,
  getRadReport: radReportsClient.getReport,
  createRadReport: radReportsClient.createReport,
  updateRadReport: radReportsClient.updateReport,
  approveRadReport: radReportsClient.approveReport,

  // medical reports
  getMedReports: medReportsClient.getReports,
  getMedReport: medReportsClient.getReport,
  createMedReport: medReportsClient.createReport,
  updateMedReport: medReportsClient.updateReport,
  approveMedReport: medReportsClient.approveReport,

  // ai
  analyzeImage: aiClient.analyzeImage,
  transcribe: aiClient.transcribe,
  generateReport: aiClient.generateReport,
  fuseFindings: aiClient.fuseFindings,
  generatePatientExplanation: aiClient.generatePatientExplanation,

  // helpers
  getUsers: () => Promise.resolve(USERS),
  getSessionUser: () => sessionUser,
  setSessionUser: (u: User | null) => { sessionUser = u },
}

export default apiClient
