/* ============================================================================
   Sonara — i18n (UI chrome only). Report bodies stay in generation language.
   ============================================================================ */
const I18N = {
  pl: {
    brandSub: "Asystent raportów USG",
    disclaimer: "System AI wspomagający — wszystkie raporty wymagają weryfikacji i zatwierdzenia przez uprawnionego specjalistę. Nie stosować jako jedynego narzędzia diagnostycznego.",
    logout: "Wyloguj",
    radiologist: "Radiolog", doctor: "Lekarz",

    // login
    loginTitle: "Zaloguj się", loginSub: "Demo POC — środowisko prezentacyjne",
    email: "E-mail", password: "Hasło", signIn: "Zaloguj się",
    quickAccess: "Szybki dostęp (demo)", demoHint: "Dane syntetyczne. Hasło dla wszystkich kont: demo2024.",
    noResults: "Brak wyników",

    // dashboard
    hello: "Dzień dobry", dashRadSub: "Twoje badania i scenariusze demonstracyjne.",
    dashDocSub: "Twoje wizyty i scenariusze demonstracyjne.",
    newExam: "Nowe badanie", newVisit: "Nowa wizyta",
    demoCases: "Scenariusze demo", demoCasesSub: "Gotowe ścieżki z efektem „wow” — uruchom i prowadź prezentację.",
    yourExams: "Twoje badania", yourVisits: "Twoje wizyty",
    colDate: "Data", colPatient: "Pacjent", colType: "Typ badania", colStatus: "Status", colMode: "Źródło", colSummary: "Podsumowanie",
    statusDraft: "Szkic", statusApproved: "Zatwierdzony",
    launch: "Uruchom", open: "Otwórz",

    // exam form
    newExamTitle: "Nowe badanie", step: "Krok",
    selectPatient: "Pacjent", selectPatientPh: "Szukaj po nazwisku lub PESEL…", addPatient: "Dodaj nowego pacjenta",
    examType: "Typ badania", examTypePh: "Wybierz lub wpisz typ badania…",
    contextFields: "Pola kontekstowe", cyclePhase: "Faza cyklu", fasting: "Pacjent na czczo (>6h)",
    labValues: "Wartości lab. ze skierowania", labValuesPh: "np. TSH 6.2 mIU/L",
    clinicalIndication: "Wskazanie kliniczne", clinicalIndicationPh: "Przepisz ze skierowania (opcjonalne)…",
    uploadImages: "Obrazy USG", uploadHint: "Przeciągnij i upuść — max 5 plików, do 10 MB każdy",
    uploadCta: "Wybierz pliki", comments: "Komentarz radiologa", commentsPh: "Uwagi przed analizą (opcjonalne)…",
    generateMode: "Wygeneruj draft raportu", optional: "opcjonalne",
    genImage: "Generuj ze zdjęcia", genVoice: "Nagraj głos", genMulti: "Analizuj wielomodalnie",
    genImageSub: "Two-Step Vision Pipeline", genVoiceSub: "Whisper → strukturyzacja", genMultiSub: "Obraz + głos → fuzja",
    multiNeedsBoth: "Wymaga obrazów oraz nagrania",

    // generation
    analyzing: "Analiza w toku…", visionExtract: "Ekstrakcja obserwacji (Vision)", reportGen: "Generowanie raportu",
    qualityReview: "AI Quality Review", fusionStep: "Warstwa fuzji",
    rawObs: "Surowe obserwacje AI", rawObsSub: "Co model „widzi” zanim przetworzy to w raport",
    recording: "Nagrywanie…", stopRec: "Zatrzymaj", transcribing: "Transkrypcja (Whisper)…",
    rawTranscript: "Surowa transkrypcja", processingClaude: "Claude strukturyzuje raport…",

    // report editor
    formalReport: "Raport formalny", findings: "Znaleziska", needsVerification: "Wymaga weryfikacji",
    needsVerificationHint: "Te elementy wymagają weryfikacji — AI nie było pewne. Nie są przedstawiane jako pewne rozpoznania.",
    impression: "Wnioski", limitations: "Ograniczenia badania", recommendations: "Zalecenia",
    aiSuggestions: "AI Suggestions", aiSuggestionsHint: "Te elementy nie zostały automatycznie dodane do raportu. Możesz je ręcznie wykorzystać podczas edycji.",
    diffDx: "Rozpoznania różnicowe", addObs: "Dodatkowe obserwacje", addToReport: "Dodaj do raportu", added: "Dodano",
    qualityCheck: "AI Quality Check", source: "Źródło", evidence: "Dowód źródłowy",
    evidenceImages: "Powiązane obrazy", evidenceTranscript: "Fragment transkrypcji",
    moveToFormal: "Przenieś do raportu", remove: "Usuń", edited: "zmodyfikowane",
    editText: "Edytuj treść", editConfHint: "Kliknij, aby zmienić poziom pewności", editDevHint: "Kliknij: odchylenie / norma", editLocHint: "Kliknij, aby edytować lokalizację",
    deviation: "odchylenie", normal: "norma",
    approve: "Zatwierdź raport", approveDisabled: "Uzupełnij znaleziska lub wnioski",
    aiDraftBadge: "Wygenerowane przez AI — wymaga weryfikacji",
    approvedBadge: "Raport zatwierdzony", approvedSource: "Źródło AI",
    srcImage: "zdjęcia USG", srcVoice: "nagranie głosowe", srcMulti: "multimodal",
    genPatientExpl: "Generuj wyjaśnienie dla pacjenta", forPatient: "Dla pacjenta",
    backToDash: "Pulpit", reportReadonly: "Raport zatwierdzony — tylko do odczytu",

    // quality statuses
    qReady: "Gotowe do weryfikacji", qAttention: "Wymaga uwagi", qBlocked: "Zablokowane",
    autoCorrections: "Auto-korekty AI", unresolved: "Nierozwiązane",

    // fusion
    fusionTitle: "Analiza wielomodalna — warstwa fuzji",
    fusionSub: "AI porównało znaleziska z obrazu i z dyktowania.",
    confirmed: "Potwierdzone", confirmedSub: "Widoczne na obrazie i wspomniane w dyktowaniu",
    imageOnly: "Tylko na obrazie", imageOnlySub: "AI sugeruje sprawdzenie — radiolog nie wspomniał",
    speechOnly: "Tylko w dyktowaniu", speechOnlySub: "Powiedziane, nieznalezione na obrazie",
    conflicts: "Konflikty", conflictsSub: "Rozbieżność między obrazem a dyktowaniem",
    speechClaim: "Dyktowanie", imageEvidence: "Obraz", aiNote: "Komentarz AI",
    continueToEditor: "Przejdź do edytora raportu",

    // doctor
    visitTitle: "Nowa wizyta", radContext: "Raport radiologiczny (kontekst)",
    noRadReport: "Bez powiązanego raportu USG", selectRadReport: "Wybierz raport radiologiczny",
    recordVisit: "Nagraj wizytę", medReport: "Raport medyczny", anamnesis: "Wywiad",
    diagnosis: "Rozpoznanie", patientPanel: "Dla pacjenta",
    patientPanelBadge: "AI wygenerowała tę wersję na podstawie raportu i rozmowy. Nie dodaje nowych faktów medycznych.",
    keyFindings: "Kluczowe wyniki", nextSteps: "Co dalej", followUp: "Kontrola",
    saveApprove: "Zatwierdź i zapisz", collapse: "Zwiń", expand: "Rozwiń",

    // confirm modals
    confirmApproveTitle: "Zatwierdzić raport?",
    confirmApproveBody: "Raport zostanie oznaczony jako zatwierdzony i stanie się tylko do odczytu. Proweniencja AI pozostanie widoczna.",
    confirmVisitTitle: "Zatwierdzić i zapisać?",
    confirmVisitBody: "Raport medyczny oraz wersja dla pacjenta zostaną zatwierdzone jednocześnie.",
    cancel: "Anuluj", confirm: "Potwierdź",

    // banners
    bSuboptimal: "Obraz suboptymalny", bNonDiagnostic: "Obraz niediagnostyczny",
    bTranscPartial: "Transkrypcja częściowa", bTranscPoor: "Transkrypcja słabej jakości",
    continueNoAi: "Kontynuuj bez AI",
    langToast: "Wygenerowany raport jest w języku PL. Zmiana języka interfejsu nie wpływa na treść raportu.",
    patientAge: "lat", female: "kobieta", male: "mężczyzna",
  },

  en: {
    brandSub: "Ultrasound report assistant",
    disclaimer: "AI assistant system — all reports require review and approval by a licensed specialist. Not to be used as a sole diagnostic tool.",
    logout: "Sign out",
    radiologist: "Radiologist", doctor: "Doctor",

    loginTitle: "Sign in", loginSub: "POC demo — presentation environment",
    email: "E-mail", password: "Password", signIn: "Sign in",
    quickAccess: "Quick access (demo)", demoHint: "Synthetic data. Password for all accounts: demo2024.",
    noResults: "No results",

    hello: "Hello", dashRadSub: "Your examinations and demo scenarios.",
    dashDocSub: "Your visits and demo scenarios.",
    newExam: "New examination", newVisit: "New visit",
    demoCases: "Demo scenarios", demoCasesSub: "Ready-made flows with a wow moment — launch and present.",
    yourExams: "Your examinations", yourVisits: "Your visits",
    colDate: "Date", colPatient: "Patient", colType: "Examination", colStatus: "Status", colMode: "Source", colSummary: "Summary",
    statusDraft: "Draft", statusApproved: "Approved",
    launch: "Launch", open: "Open",

    newExamTitle: "New examination", step: "Step",
    selectPatient: "Patient", selectPatientPh: "Search by name or national ID…", addPatient: "Add new patient",
    examType: "Examination type", examTypePh: "Choose or type an examination…",
    contextFields: "Contextual fields", cyclePhase: "Cycle phase", fasting: "Fasting patient (>6h)",
    labValues: "Lab values from referral", labValuesPh: "e.g. TSH 6.2 mIU/L",
    clinicalIndication: "Clinical indication", clinicalIndicationPh: "Copy from referral (optional)…",
    uploadImages: "Ultrasound images", uploadHint: "Drag & drop — max 5 files, up to 10 MB each",
    uploadCta: "Choose files", comments: "Radiologist comments", commentsPh: "Notes before analysis (optional)…",
    generateMode: "Generate report draft", optional: "optional",
    genImage: "Generate from image", genVoice: "Record voice", genMulti: "Multimodal analysis",
    genImageSub: "Two-Step Vision Pipeline", genVoiceSub: "Whisper → structuring", genMultiSub: "Image + voice → fusion",
    multiNeedsBoth: "Requires both images and a recording",

    analyzing: "Analysis in progress…", visionExtract: "Observation extraction (Vision)", reportGen: "Report generation",
    qualityReview: "AI Quality Review", fusionStep: "Fusion layer",
    rawObs: "Raw AI observations", rawObsSub: "What the model sees before turning it into a report",
    recording: "Recording…", stopRec: "Stop", transcribing: "Transcription (Whisper)…",
    rawTranscript: "Raw transcription", processingClaude: "Claude is structuring the report…",

    formalReport: "Formal report", findings: "Findings", needsVerification: "Needs verification",
    needsVerificationHint: "These items need verification — the AI was uncertain. They are not presented as confirmed diagnoses.",
    impression: "Impression", limitations: "Imaging limitations", recommendations: "Recommendations",
    aiSuggestions: "AI Suggestions", aiSuggestionsHint: "These items were not automatically added to the report. You may use them manually while editing.",
    diffDx: "Differential diagnoses", addObs: "Additional observations", addToReport: "Add to report", added: "Added",
    qualityCheck: "AI Quality Check", source: "Source", evidence: "Source evidence",
    evidenceImages: "Related images", evidenceTranscript: "Transcript fragment",
    moveToFormal: "Move to report", remove: "Remove", edited: "edited",
    editText: "Edit text", editConfHint: "Click to change confidence level", editDevHint: "Click: deviation / normal", editLocHint: "Click to edit location",
    deviation: "deviation", normal: "normal",
    approve: "Approve report", approveDisabled: "Fill in findings or impression",
    aiDraftBadge: "AI-generated — requires verification",
    approvedBadge: "Report approved", approvedSource: "AI source",
    srcImage: "ultrasound images", srcVoice: "voice recording", srcMulti: "multimodal",
    genPatientExpl: "Generate patient explanation", forPatient: "For the patient",
    backToDash: "Dashboard", reportReadonly: "Report approved — read only",

    qReady: "Ready for review", qAttention: "Needs attention", qBlocked: "Blocked",
    autoCorrections: "AI auto-corrections", unresolved: "Unresolved",

    fusionTitle: "Multimodal analysis — fusion layer",
    fusionSub: "AI compared findings from image and dictation.",
    confirmed: "Confirmed", confirmedSub: "Visible on image and mentioned in dictation",
    imageOnly: "Image only", imageOnlySub: "AI suggests checking — radiologist did not mention",
    speechOnly: "Dictation only", speechOnlySub: "Said, not found on image",
    conflicts: "Conflicts", conflictsSub: "Discrepancy between image and dictation",
    speechClaim: "Dictation", imageEvidence: "Image", aiNote: "AI note",
    continueToEditor: "Continue to report editor",

    visitTitle: "New visit", radContext: "Radiological report (context)",
    noRadReport: "No linked ultrasound report", selectRadReport: "Select radiological report",
    recordVisit: "Record visit", medReport: "Medical report", anamnesis: "Anamnesis",
    diagnosis: "Diagnosis", patientPanel: "For the patient",
    patientPanelBadge: "AI generated this version from the report and conversation. It adds no new medical facts.",
    keyFindings: "Key findings", nextSteps: "Next steps", followUp: "Follow-up",
    saveApprove: "Approve & save", collapse: "Collapse", expand: "Expand",

    confirmApproveTitle: "Approve report?",
    confirmApproveBody: "The report will be marked approved and become read-only. AI provenance remains visible.",
    confirmVisitTitle: "Approve & save?",
    confirmVisitBody: "The medical report and patient version will be approved simultaneously.",
    cancel: "Cancel", confirm: "Confirm",

    bSuboptimal: "Suboptimal image", bNonDiagnostic: "Non-diagnostic image",
    bTranscPartial: "Partial transcription", bTranscPoor: "Poor transcription quality",
    continueNoAi: "Continue without AI",
    langToast: "The generated report is in PL. Changing the interface language does not affect report content.",
    patientAge: "y/o", female: "female", male: "male",
  },
};

/* ----------------------------------------------------------------------------
   Data-label dictionary (PL → EN). Translates short UI labels that live in the
   demo data (exam types, table summaries, risk labels, visit titles). Clinical
   REPORT BODIES intentionally stay in their generation language (PL) — the
   language toast explains this. L(lang, plString) returns EN when lang==='en'.
   ---------------------------------------------------------------------------- */
const DATA_EN = {
  // exam types
  "USG tarczycy": "Thyroid ultrasound",
  "USG jamy brzusznej": "Abdominal ultrasound",
  "USG nerek": "Renal ultrasound",
  "USG wątroby": "Liver ultrasound",
  "USG pęcherzyka żółciowego": "Gallbladder ultrasound",
  "USG trzustki": "Pancreas ultrasound",
  "USG piersi": "Breast ultrasound",
  "USG ginekologiczne transwaginalne (TV)": "Transvaginal gynecological ultrasound (TV)",
  "USG ginekologiczne (TV)": "Gynecological ultrasound (TV)",
  "USG Doppler tętnic szyjnych": "Carotid artery Doppler ultrasound",
  "USG węzłów chłonnych": "Lymph node ultrasound",
  "USG moszny i jąder": "Scrotal & testicular ultrasound",
  "Echokardiografia": "Echocardiography",
  // classification risk labels
  "Średnie ryzyko": "Intermediate risk",
  "Niskie ryzyko": "Low risk",
  "Wysokie ryzyko": "High risk",
  // dashboard summaries (radiologist)
  "Zmiana 8 mm lewy płat — TI-RADS 4": "8 mm left-lobe nodule — TI-RADS 4",
  "Z dyktowania — kontrola": "From dictation — follow-up",
  "Jakość suboptymalna — konflikt": "Suboptimal quality — conflict",
  "TI-RADS 4 — zatwierdzony": "TI-RADS 4 — approved",
  "Torbiel nerki (Bosniak I)": "Renal cyst (Bosniak I)",
  "O-RADS 2 — łagodna": "O-RADS 2 — benign",
  // visit row types (doctor)
  "Wizyta — omówienie USG tarczycy": "Visit — thyroid ultrasound review",
  "Wizyta kontrolna": "Follow-up visit",
};

function L(lang, s) {
  if (lang !== "en" || s == null) return s;
  return DATA_EN[s] || s;
}

window.SonaraI18N = I18N;
window.SonaraL = L;
