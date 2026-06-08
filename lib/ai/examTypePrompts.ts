import type { ExaminationTypePrompt, ExamType } from '../types'

// ============================================================================
// Exam Type Prompts Library — THE ONLY FILE containing medical domain knowledge
// Covers all 19 types from EXAM_TYPE_LIST + default fallback
// ============================================================================

const EXAM_TYPE_CONFIGS: Record<string, ExaminationTypePrompt> = {

  // --------------------------------------------------------------------------
  'USG tarczycy': {
    examinationType: 'USG tarczycy',
    examFocus: 'Ocena miąższu tarczycy, guzków i węzłów chłonnych szyjnych. Klasyfikacja ACR TI-RADS.',
    mandatoryStructures: ['lewy płat', 'prawy płat', 'cieśń', 'węzły chłonne szyjne'],
    systematicChecklist: [
      'Wymiary każdego płata (długość × szerokość × głębokość)',
      'Echogeniczność miąższu (prawidłowa / hipo / hiper)',
      'Jednorodność miąższu',
      'Obecność guzków — lokalizacja, wymiary, skład, echogeniczność, kształt, marginesy, ogniska echogeniczne',
      'Klasyfikacja ACR TI-RADS dla każdego guzka',
      'Grubość cieśni',
      'Węzły chłonne szyjne (widoczność, cechy)',
    ],
    referenceNorms: {
      'płat długość': '< 6 cm',
      'cieśń grubość': '< 5 mm',
      'echogeniczność': 'izo do tarczycy',
    },
    classifications: [
      {
        name: 'ACR TI-RADS',
        description: 'System punktowy ACR TI-RADS 2017. Skład (torbielowaty 0 / mieszany 1 / lity 2), echogeniczność (anecho 0 / hiper/izo 1 / hipo 2 / bardzo hipo 3), kształt (szerszy niż wyższy 0 / wyższy niż szerszy 3), marginesy (gładkie/nieokreślone 0 / nieregularne/ekstratoroidalne 2 / szpikujące/mikropłatowanie 3), ogniska echogeniczne (brak/ogon komety 0 / makrozwapnienia 1 / obrzeżne 2 / mikrozwapnienia 3). Kategorie: TR1 (0 pkt), TR2 (2), TR3 (3), TR4 (4–6), TR5 (≥7).',
        applicableWhen: 'każdy guzek tarczycy',
      },
    ],
    warningThresholds: [
      { field: 'guzek TI-RADS', condition: 'TR3 lub wyższy', message: 'Guzek TR3+ — rozważyć obserwację lub BAC wg rozmiaru i kategorii' },
      { field: 'guzek wymiar', condition: '> 4 cm', message: 'Guzek > 4 cm — BAC niezależnie od kategorii TI-RADS' },
    ],
    imagingLimitations: [
      'Ocena węzłów chłonnych szyjnych ograniczona gdy kadr niekompletny',
      'Brak oceny unaczynienia bez opcji Doppler',
      'Tylna część tarczycy trudna do uwidocznienia przy dużej wolu',
    ],
    impressionTemplate: 'Opisz dominujące guzki z klasyfikacją TI-RADS. Podaj sumę punktów. Wskaż zalecenia wg protokołu ACR.',
    contextFields: { relevantLabValues: true },
  },

  // --------------------------------------------------------------------------
  'USG piersi': {
    examinationType: 'USG piersi',
    examFocus: 'Ocena miąższu piersi, zmian ogniskowych, węzłów chłonnych pachowych. Klasyfikacja ACR BI-RADS.',
    mandatoryStructures: ['pierś lewa', 'pierś prawa', 'węzły chłonne pachowe obustronne'],
    systematicChecklist: [
      'Typ budowy piersi (tłuszczowa / gruczołowa / mieszana)',
      'Każda zmiana ogniskowa: kształt (owalny/okrągły/nieregularny), orientacja (równoległa/nieparalelna)',
      'Marginesy zmiany (gładkie/niepełne/nieregularne/szpikujące)',
      'Echogeniczność zmiany (anecho/hipo/izo/hiper)',
      'Cechy tylne (bez zmian/wzmocnienie/cień/połączone)',
      'Wymiary zmiany w trzech płaszczyznach',
      'Węzły chłonne pachowe (wymiary, kształt, hilus)',
    ],
    referenceNorms: {
      'węzeł chłonny szerokość': '< 1 cm (z widocznym hilusem)',
    },
    classifications: [
      {
        name: 'ACR BI-RADS',
        description: 'Klasyfikacja ACR BI-RADS: BI-RADS 0 (ocena niekompletna), 1 (prawidłowe), 2 (łagodne), 3 (prawdopodobnie łagodne, kontrola 6M), 4 (podejrzane — biopsja), 4A/4B/4C (podkategorie), 5 (wysoce podejrzane — biopsja), 6 (potwierdzone histologicznie złośliwe).',
        applicableWhen: 'każda zmiana ogniskowa w piersi',
      },
    ],
    warningThresholds: [
      { field: 'BI-RADS', condition: '>= 4', message: 'BI-RADS 4 lub wyższy — wskazana biopsja' },
      { field: 'węzeł chłonny', condition: 'brak hilusa lub > 2 cm', message: 'Nieprawidłowy węzeł chłonny pachowy — wymaga korelacji klinicznej' },
    ],
    imagingLimitations: [
      'Gęsty gruczoł może maskować małe zmiany — mammografia jako uzupełnienie',
      'Zmiany < 5 mm mogą nie być uwidocznione',
    ],
    impressionTemplate: 'Oceń każdą zmianę ogniskową z klasyfikacją BI-RADS. Podaj zalecenie (obserwacja/biopsja/skierowanie).',
    genderRestriction: 'F',
  },

  // --------------------------------------------------------------------------
  'USG nerek': {
    examinationType: 'USG nerek',
    examFocus: 'Ocena nerek i pęcherza moczowego. Klasyfikacja torbieli wg Bosniak 2019, wodonercza wg SFU.',
    mandatoryStructures: ['nerka prawa', 'nerka lewa', 'pęcherz moczowy'],
    systematicChecklist: [
      'Wymiary każdej nerki (długość × szerokość × głębokość)',
      'Echogeniczność kory nerkowej',
      'Grubość miąższu nerkowego',
      'Układ kielichowo-miedniczkowy (UKM) — rozszerzenie?',
      'Torbiele — lokalizacja, wymiary, klasyfikacja Bosniak',
      'Kamica — lokalizacja, wymiary, cień akustyczny',
      'Pęcherz moczowy — ściana, zaleganie po mikcji (jeśli dostępne)',
      'Wodonercze — stopień SFU',
    ],
    referenceNorms: {
      'nerka długość': '9–12 cm',
      'miąższ grubość': '> 1.5 cm',
      'UKM': 'nierozszerzony',
      'Doppler RI': '0.58–0.70',
    },
    classifications: [
      {
        name: 'Bosniak 2019',
        description: 'Klasyfikacja torbieli nerkowych Bosniak 2019: I (torbiel prosta, łagodna), II (minimalne cechy złożone, łagodna), IIF (wymagająca obserwacji — follow-up), III (nieokreślona — biopsja/operacja), IV (złośliwa — operacja). Torbiele I i II możliwe do klasyfikacji z USG. IIF, III, IV wymagają CT/MRI.',
        applicableWhen: 'torbiele nerkowe',
      },
      {
        name: 'SFU',
        description: 'Klasyfikacja wodonercza Society for Fetal Urology (SFU): grade 0 (brak), I (drobne rozszerzenie miedniczki), II (rozszerzenie miedniczki + kielichów), III (rozszerzenie + cienki miąższ), IV (grube rozszerzenie + zanik miąższu).',
        applicableWhen: 'wodonercze',
      },
    ],
    warningThresholds: [
      { field: 'torbiel Bosniak', condition: 'IIF lub wyższy', message: 'Torbiel Bosniak IIF+ — wymagane CT/MRI do dalszej klasyfikacji' },
      { field: 'wodonercze SFU', condition: 'III lub IV', message: 'Wodonercze SFU grade III/IV — wymaga konsultacji urologicznej' },
      { field: 'nerka wymiar', condition: '< 8 cm', message: 'Mała nerka — podejrzenie przewlekłej choroby nerek' },
    ],
    imagingLimitations: [
      'Gazy jelitowe mogą utrudniać ocenę nerek, szczególnie prawej',
      'Kamica moczowodowa poniżej przejścia moczowodowo-pęcherzowego trudna do uwidocznienia',
      'Ocena przepływu wymaga opcji Doppler',
    ],
    impressionTemplate: 'Opisz każdą nerkę osobno. Torbiele: klasyfikacja Bosniak. Wodonercze: stopień SFU. Kamica: lokalizacja i wymiary.',
    contextFields: { relevantLabValues: true },
  },

  // --------------------------------------------------------------------------
  'USG Doppler tętnic szyjnych': {
    examinationType: 'USG Doppler tętnic szyjnych',
    examFocus: 'Ocena IMT, blaszek miażdżycowych i stopnia zwężenia tętnic szyjnych. Klasyfikacja NASCET.',
    mandatoryStructures: ['CCA prawa', 'CCA lewa', 'ICA prawa', 'ICA lewa', 'ECA prawa', 'ECA lewa', 'rozwidlenie szyjne obustronne'],
    systematicChecklist: [
      'IMT (grubość intima-media) — norma < 1 mm',
      'Blaszki miażdżycowe — lokalizacja, echogeniczność (hipo/hiper/mieszana), powierzchnia (gładka/nieregularna), wymiary',
      'PSV i EDV dla ICA i CCA obustronnie',
      'Stosunek PSV ICA/PSV CCA',
      'Stopień zwężenia wg NASCET',
      'Przepływ wewnątrzczaszkowy (pośredni)',
    ],
    referenceNorms: {
      'IMT norma': '< 1.0 mm',
      'PSV CCA': '< 125 cm/s',
      'PSV ICA norma': '< 125 cm/s',
      'stosunek ICA/CCA PSV zwężenie': '> 2.0 → podejrzenie > 50%',
    },
    classifications: [
      {
        name: 'NASCET',
        description: 'Kryterium NASCET (North American Symptomatic Carotid Endarterectomy Trial): stopień zwężenia = (1 − PSV_ICA_minimalne / PSV_ICA_powyżej_zwężenia) × 100%. Progi: < 50% (łagodne), 50–69% (umiarkowane), 70–99% (ciężkie), okluzia.',
        applicableWhen: 'każde zwężenie ICA',
      },
    ],
    warningThresholds: [
      { field: 'zwężenie NASCET', condition: '>= 70%', message: 'Zwężenie ICA ≥ 70% wg NASCET — wskazana pilna konsultacja neurologiczna/naczyniowa' },
      { field: 'IMT', condition: '> 1.5 mm', message: 'IMT > 1.5 mm lub blaszka — podwyższone ryzyko sercowo-naczyniowe' },
      { field: 'blaszka', condition: 'hipoechogeniczna lub nieregularna powierzchnia', message: 'Blaszka niestabilna — ryzyko embolizacji' },
    ],
    imagingLimitations: [
      'Parametry przepływu (PSV, EDV, RI) pochodzą wyłącznie z dyktowania — AI nie odczyta ich z obrazu statycznego',
      'Ocena segmentu intrakranialnego niemożliwa z okna szyjnego',
      'Bardzo wysokie zwężenie może fałszywie zaniżać PSV (post-stenotyczny spadek)',
    ],
    impressionTemplate: 'Opisz IMT i blaszki obustronnie. Podaj stopień zwężenia wg NASCET jeśli obecne. Wskaż stronę dominującego zwężenia.',
  },

  // --------------------------------------------------------------------------
  'USG jamy brzusznej': {
    examinationType: 'USG jamy brzusznej',
    examFocus: 'Kompleksowa ocena narządów jamy brzusznej. Kolejność: wątroba → CBD → pęcherzyk żółciowy → trzustka → śledziona → nerki → aorta → wolny płyn.',
    mandatoryStructures: ['wątroba', 'drogi żółciowe', 'pęcherzyk żółciowy', 'trzustka', 'śledziona', 'nerka prawa', 'nerka lewa', 'aorta brzuszna'],
    systematicChecklist: [
      'Wątroba — wymiary (PŚR), echogeniczność, zmiany ogniskowe',
      'Drogi żółciowe wewnątrzwątrobowe — nieposzerzone?',
      'CBD — wymiar (norma < 6 mm, po cholecystektomii < 8 mm)',
      'Pęcherzyk żółciowy — wymiary, ściana (norma < 3 mm), złogi, polipy',
      'Trzustka — głowa/trzon/ogon, echogeniczność, przewód Wirsunga',
      'Śledziona — wymiar (długość norma < 12 cm)',
      'Obie nerki — wymiary, miąższ, UKM',
      'Aorta brzuszna — wymiar (norma < 3 cm)',
      'Wolny płyn w jamie otrzewnej',
    ],
    referenceNorms: {
      'wątroba PŚR': '< 15 cm',
      'CBD': '< 6 mm (< 8 mm po cholecystektomii)',
      'pęcherzyk ściana': '< 3 mm (na czczo)',
      'śledziona długość': '< 12 cm',
      'przewód Wirsunga': '< 2 mm',
      'aorta': '< 3 cm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'aorta', condition: '> 3 cm', message: 'Poszerzenie aorty — tętniak? Wymiar do monitorowania.' },
      { field: 'CBD', condition: '> 6 mm (bez cholecystektomii)', message: 'Poszerzone CBD — obstrukcja dróg żółciowych?' },
      { field: 'wolny płyn', condition: 'obecny', message: 'Wolny płyn — przyczyna do ustalenia (ascites, krew, zapalenie)' },
    ],
    imagingLimitations: [
      'Gazy jelitowe mogą uniemożliwić ocenę trzustki i aorty',
      'Ocena wymaga badania na czczo (min. 6h) dla pęcherzyka',
      'Tłusta wątroba obniża penetrację ultradźwięków',
    ],
    impressionTemplate: 'Opisz kolejno każdy narząd. Oddziel znaleziska od normy. Odchylenia podkreśl w impression.',
    contextFields: { fastingStatus: true, priorSurgery: true },
  },

  // --------------------------------------------------------------------------
  'USG wątroby': {
    examinationType: 'USG wątroby',
    examFocus: 'Szczegółowa ocena miąższu wątroby, naczyń i zmian ogniskowych.',
    mandatoryStructures: ['płat prawy', 'płat lewy', 'segment IV', 'żyła wrotna', 'żyły wątrobowe', 'CBD'],
    systematicChecklist: [
      'Wymiar płata prawego (PŚR w linii środkowoobojczykowej)',
      'Echogeniczność miąższu (norma / hiperechogeniczna — stłuszczenie / hipoechogeniczna)',
      'Jednorodność miąższu',
      'Zmiany ogniskowe — lokalizacja wg segmentów Couinauda, wymiary, echogeniczność',
      'Żyła wrotna — wymiar (norma < 13 mm), przepływ',
      'Żyły wątrobowe — drożność',
      'CBD — wymiar',
      'Pęcherzyk żółciowy — podstawowa ocena',
    ],
    referenceNorms: {
      'wątroba PŚR': '< 15 cm',
      'żyła wrotna': '< 13 mm',
      'CBD': '< 6 mm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'zmiana ogniskowa', condition: 'hipoechogeniczna lub szpikująca', message: 'Zmiana ogniskowa wymagająca dalszej diagnostyki (CT/MRI z kontrastem)' },
      { field: 'żyła wrotna', condition: '> 13 mm', message: 'Poszerzona żyła wrotna — nadciśnienie wrotne?' },
    ],
    imagingLimitations: ['Duże naczyniaki mogą wymagać weryfikacji CT/MRI', 'Ocena segmentów tylnych ograniczona przez akno akustyczne'],
    impressionTemplate: 'Opisz miąższ globalnie. Zmiany ogniskowe z lokalizacją segmentową. Naczynia wątrobowe.',
    contextFields: { fastingStatus: true, priorSurgery: true, relevantLabValues: true },
  },

  // --------------------------------------------------------------------------
  'USG pęcherzyka żółciowego': {
    examinationType: 'USG pęcherzyka żółciowego',
    examFocus: 'Ocena pęcherzyka żółciowego i dróg żółciowych. Wykrywanie kamicy, polipów, zapalenia.',
    mandatoryStructures: ['pęcherzyk żółciowy', 'CBD', 'drogi żółciowe wewnątrzwątrobowe'],
    systematicChecklist: [
      'Wymiary pęcherzyka żółciowego',
      'Grubość ściany (norma < 3 mm na czczo)',
      'Złogi — liczba, wymiary, cień akustyczny',
      'Polipy — wymiary (> 1 cm → obserwacja)',
      'Osad żółciowy (błoto)',
      'CBD — wymiar',
      'Drogi wewnątrzwątrobowe — nieposzerzone?',
    ],
    referenceNorms: {
      'ściana pęcherzyka': '< 3 mm (na czczo)',
      'CBD': '< 6 mm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'ściana pęcherzyka', condition: '> 3 mm', message: 'Pogrubiona ściana — zapalenie pęcherzyka?' },
      { field: 'polip', condition: '> 1 cm', message: 'Polip > 1 cm — ryzyko złośliwości, konsultacja chirurgiczna' },
    ],
    imagingLimitations: ['Ocena wymaga badania na czczo — pełny pęcherzyk', 'Złogi w szyjce mogą być niewidoczne'],
    impressionTemplate: 'Kamica: liczba i wymiary. Polipy: wymiary. Stan ściany i drogi żółciowe.',
    contextFields: { fastingStatus: true },
  },

  // --------------------------------------------------------------------------
  'USG trzustki': {
    examinationType: 'USG trzustki',
    examFocus: 'Ocena miąższu trzustki i przewodu Wirsunga.',
    mandatoryStructures: ['głowa trzustki', 'trzon trzustki', 'ogon trzustki', 'przewód Wirsunga'],
    systematicChecklist: [
      'Widoczność poszczególnych części (głowa/trzon/ogon)',
      'Echogeniczność miąższu',
      'Wymiary (głowa norma < 3 cm, trzon < 2 cm, ogon < 2 cm)',
      'Przewód Wirsunga — wymiar (norma < 2 mm)',
      'Zmiany ogniskowe — wymiary, echogeniczność',
      'Poszerzenie przewodu głównego',
    ],
    referenceNorms: {
      'głowa': '< 3 cm',
      'trzon': '< 2 cm',
      'ogon': '< 2 cm',
      'przewód Wirsunga': '< 2 mm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'przewód Wirsunga', condition: '> 3 mm', message: 'Poszerzony przewód Wirsunga — obstrukcja lub zapalenie trzustki?' },
      { field: 'zmiana ogniskowa głowa', condition: 'obecna', message: 'Zmiana ogniskowa głowy trzustki — wymaga CT/MRI' },
    ],
    imagingLimitations: [
      'Ocena trzustki często ograniczona przez gazy jelitowe',
      'Ogon trzustki najtrudniejszy do uwidocznienia',
    ],
    impressionTemplate: 'Podaj widoczność każdej części. Miąższ i przewód Wirsunga. Zmiany ogniskowe.',
    contextFields: { fastingStatus: true },
  },

  // --------------------------------------------------------------------------
  'USG śledziony': {
    examinationType: 'USG śledziony',
    examFocus: 'Ocena wymiarów i miąższu śledziony.',
    mandatoryStructures: ['śledziona', 'wnęka śledziony'],
    systematicChecklist: [
      'Wymiar długości (norma < 12 cm)',
      'Echogeniczność miąższu',
      'Jednorodność',
      'Zmiany ogniskowe',
      'Naczynia we wnęce',
    ],
    referenceNorms: { 'długość': '< 12 cm', 'indeks śledzionowy': '< 480 cm³' },
    classifications: [],
    warningThresholds: [
      { field: 'śledziona długość', condition: '> 12 cm', message: 'Splenomegalia — przyczyna do ustalenia' },
    ],
    imagingLimitations: ['Dolny biegun może być zasłonięty przez gazy jelitowe lub żebra'],
    impressionTemplate: 'Wymiary śledziony. Ewentualne zmiany ogniskowe. Ocena naczyń.',
  },

  // --------------------------------------------------------------------------
  'USG prostaty': {
    examinationType: 'USG prostaty',
    examFocus: 'Ocena objętości i echogeniczności gruczołu krokowego.',
    mandatoryStructures: ['gruczoł krokowy', 'pęcherzyki nasienne', 'pęcherz moczowy'],
    systematicChecklist: [
      'Wymiary stercza w trzech płaszczyznach (DŚR × LL × AP)',
      'Obliczenie objętości (D×Ś×A × 0.52)',
      'Echogeniczność (norma jednorodna / ogniskowe hipo)',
      'Strefa przejściowa i obwodowa',
      'Pęcherzyki nasienne',
      'Zaleganie moczu po mikcji (jeśli dostępne)',
    ],
    referenceNorms: {
      'objętość < 40 lat': '< 20 ml',
      'objętość 40–60 lat': '< 30 ml',
      'objętość > 60 lat': '< 50 ml (BPH)',
      'PSA korelacja': 'ocena kliniczna',
    },
    classifications: [],
    warningThresholds: [
      { field: 'ognisko hipoechogeniczne strefa obwodowa', condition: 'obecne', message: 'Ognisko hipoechogeniczne w strefie obwodowej — podejrzenie raka? Korelacja z PSA i badaniem per rectum.' },
    ],
    imagingLimitations: ['USG przezbrzuszne: ograniczona rozdzielczość w porównaniu do przezodbytniczego (TRUS)'],
    impressionTemplate: 'Objętość stercza i wyliczenie. Strefa obwodowa. Ogniskowe zmiany.',
    contextFields: { relevantLabValues: true },
    genderRestriction: 'M',
  },

  // --------------------------------------------------------------------------
  'USG ginekologiczne transwaginalne (TV)': {
    examinationType: 'USG ginekologiczne transwaginalne (TV)',
    examFocus: 'Ocena macicy, jajników i przydatków. Klasyfikacja zmian przydatków O-RADS US 2022.',
    mandatoryStructures: ['macica', 'jajnik prawy', 'jajnik lewy', 'przydatki prawe', 'przydatki lewe', 'przestrzeń zaotrzewnowa Douglas'],
    systematicChecklist: [
      'Macica — wymiary (DŚR × LL × AP), kształt, echogeniczność miąższu',
      'Endometrium — grubość (interpretacja zależna od fazy cyklu)',
      'Jajniki — wymiary (norma < 3 cm w osi długiej), objętość',
      'Pęcherzyki jajnikowe — morfologia antryalnych',
      'Zmiany przydatków — wymiary, skład (torbielowaty/lity/mieszany), przegrody, papille',
      'Klasyfikacja O-RADS US 2022 dla każdej zmiany przydatkowej',
      'Przestrzeń Douglasa — wolny płyn?',
    ],
    referenceNorms: {
      'endometrium faza folikularna': '< 8 mm',
      'endometrium faza lutealna': '8–14 mm',
      'endometrium postmenopauza': '< 4 mm',
      'jajnik objętość': '< 10 ml (premenopauzalnie)',
      'jajnik objętość postmenopauza': '< 6 ml',
    },
    classifications: [
      {
        name: 'O-RADS US 2022',
        description: 'ACR O-RADS US 2022 dla zmian przydatków. Kategorie: O-RADS 1 (prawidłowy jajnik), O-RADS 2 (prawie pewnie łagodne < 1% ryzyka), O-RADS 3 (niskie ryzyko 1–10%), O-RADS 4 (umiarkowane ryzyko 10–50%), O-RADS 5 (wysokie ryzyko > 50%). Cechy: skład (torbielowaty/lity/mieszany), echogeniczność, papille, przegrody, Doppler.',
        applicableWhen: 'zmiany jajnikowe i przydatkowe',
      },
    ],
    warningThresholds: [
      { field: 'O-RADS', condition: '>= 4', message: 'O-RADS 4+ — konsultacja ginekologiczna/onkologiczna' },
      { field: 'endometrium postmenopauza', condition: '> 4 mm', message: 'Pogrubione endometrium w postmenopauzie — diagnostyka wykluczająca raka endometrium' },
      { field: 'endometrium', condition: '> 16 mm', message: 'Grube endometrium — wymaga dalszej diagnostyki (histeroskopia?)' },
    ],
    imagingLimitations: [
      'Wynik zależy od fazy cyklu menstruacyjnego — podaj fazę w kontekście',
      'Pętle jelit mogą zasłaniać przydatki',
    ],
    impressionTemplate: 'Macica i endometrium (grubość z fazą cyklu). Jajniki. Zmiany przydatków z O-RADS.',
    contextFields: { menstrualCyclePhase: true, priorSurgery: true },
    genderRestriction: 'F',
  },

  // --------------------------------------------------------------------------
  'USG ginekologiczne przezbrzuszne (TA)': {
    examinationType: 'USG ginekologiczne przezbrzuszne (TA)',
    examFocus: 'Przesiewowa ocena narządu rodnego przez powłoki brzuszne.',
    mandatoryStructures: ['macica', 'jajniki', 'przydatki', 'pęcherz moczowy'],
    systematicChecklist: [
      'Macica — wymiary, położenie, endometrium',
      'Jajniki — widoczność, wymiary, zmiany',
      'Pęcherz moczowy — wypełnienie (wymagane do badania)',
    ],
    referenceNorms: {
      'endometrium postmenopauza': '< 4 mm',
      'jajnik': '< 3 cm osi długiej',
    },
    classifications: [],
    warningThresholds: [
      { field: 'jajnik', condition: '> 5 cm', message: 'Powiększony jajnik — weryfikacja TV zalecana' },
    ],
    imagingLimitations: ['Badanie TA ma niższą rozdzielczość niż TV — szczegółowa ocena wymaga badania TV'],
    impressionTemplate: 'Macica i endometrium. Jajniki. W razie nieprawidłowości — zalecenie TV.',
    contextFields: { menstrualCyclePhase: true },
    genderRestriction: 'F',
  },

  // --------------------------------------------------------------------------
  'USG tkanek miękkich': {
    examinationType: 'USG tkanek miękkich',
    examFocus: 'Ocena zmian ogniskowych w tkankach miękkich (torbiele, włókniaki, tłuszczaki, chłoniaki).',
    mandatoryStructures: ['zmiana ogniskowa', 'otaczające tkanki miękkie'],
    systematicChecklist: [
      'Lokalizacja dokładna (anatomiczna)',
      'Wymiary w trzech płaszczyznach',
      'Skład (torbielowaty/lity/mieszany)',
      'Echogeniczność',
      'Marginesy (gładkie/nieregularne)',
      'Unaczynienie w Doppler',
      'Głębokość — powierzchowna/głęboka względem powięzi',
    ],
    referenceNorms: {},
    classifications: [],
    warningThresholds: [
      { field: 'zmiana', condition: 'głęboka względem powięzi i > 5 cm i lita', message: 'Zmiana litą głębiej niż powięź > 5 cm — wymaga MRI, podejrzenie mięsaka' },
    ],
    imagingLimitations: ['Ocena głębokości zmian ograniczona przez słabą penetrację — MRI dla zmian głębokich'],
    impressionTemplate: 'Lokalizacja, wymiary, charakter zmiany. Unaczynienie. Cechy łagodności lub podejrzane.',
  },

  // --------------------------------------------------------------------------
  'USG Doppler tętnic kończyn dolnych': {
    examinationType: 'USG Doppler tętnic kończyn dolnych',
    examFocus: 'Ocena drożności i hemodynamiki tętnic kończyn dolnych.',
    mandatoryStructures: ['tętnica udowa wspólna', 'tętnica udowa powierzchowna', 'tętnica podkolanowa', 'tętnice piszczelowe'],
    systematicChecklist: [
      'Drożność tętnic obu kończyn',
      'Obecność i wymiary blaszek miażdżycowych',
      'Stopień zwężenia (% lub PSV)',
      'Charakter przepływu (trójfazowy/dwufazowy/jednofazowy)',
      'PSV w miejscach zwężeń',
    ],
    referenceNorms: {
      'PSV tętnica udowa wspólna': '< 150 cm/s',
      'przepływ prawidłowy': 'trójfazowy',
    },
    classifications: [],
    warningThresholds: [
      { field: 'przepływ', condition: 'jednofazowy lub brak', message: 'Ciężkie niedokrwienie — pilna konsultacja naczyniowa' },
    ],
    imagingLimitations: ['Parametry przepływu z aparatu — AI nie odczyta z obrazu statycznego', 'Zaawansowane wapnienie utrudnia pomiary PSV'],
    impressionTemplate: 'Drożność tętnic. Blaszki i zwężenia. Ocena przepływu obustronnie.',
  },

  // --------------------------------------------------------------------------
  'USG Doppler żylny kończyn dolnych (DVT)': {
    examinationType: 'USG Doppler żylny kończyn dolnych (DVT)',
    examFocus: 'Wykluczenie zakrzepicy żył głębokich (DVT). Test ściśliwości żył.',
    mandatoryStructures: ['żyła udowa wspólna', 'żyła udowa', 'żyła podkolanowa', 'żyły piszczelowe', 'żyła piszczelowa tylna'],
    systematicChecklist: [
      'Test ściśliwości każdego segmentu (compression test)',
      'Obecność materiału zakrzepowego (hiperechogeniczny/anechogeniczny)',
      'Drożność w badaniu Doppler',
      'Faza oddechowa przepływu',
    ],
    referenceNorms: { 'żyła': 'pełna ściśliwość, brak zakrzepu' },
    classifications: [],
    warningThresholds: [
      { field: 'ściśliwość', condition: 'brak lub niepełna', message: 'Brak ściśliwości żyły — zakrzepica DVT! Pilna konsultacja.' },
    ],
    imagingLimitations: ['Żyły łydkowe (mięśniowe) trudne do kompletnej oceny', 'Otyłość utrudnia ocenę żył udowych'],
    impressionTemplate: 'Wynik testu ściśliwości dla każdego segmentu. DVT potwierdzona/wykluczona.',
  },

  // --------------------------------------------------------------------------
  'USG węzłów chłonnych': {
    examinationType: 'USG węzłów chłonnych',
    examFocus: 'Ocena węzłów chłonnych pod kątem zmian reaktywnych, zapalnych lub nowotworowych.',
    mandatoryStructures: ['węzły chłonne w badanym regionie'],
    systematicChecklist: [
      'Lokalizacja węzłów (szyja/pachy/pachwiny/inne)',
      'Wymiary (oś krótka i długa)',
      'Kształt (owalny/okrągły)',
      'Widoczność hilusa',
      'Echogeniczność kory',
      'Unaczynienie (hilusowe/korowe/mieszane)',
    ],
    referenceNorms: {
      'oś krótka szyja': '< 1 cm (z widocznym hilusem)',
      'oś krótka pachwina': '< 1.5 cm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'węzeł', condition: 'okrągły lub brak hilusa', message: 'Podejrzenie złośliwości — korelacja kliniczna i histopatologia' },
      { field: 'węzeł oś krótka', condition: '> 2 cm', message: 'Masywna limfadenopatia — wymaga dalszej diagnostyki' },
    ],
    imagingLimitations: ['Małe węzły < 5 mm trudne do oceny pod kątem unaczynienia'],
    impressionTemplate: 'Liczba widocznych węzłów, wymiary, cechy łagodności lub podejrzane. Lokalizacja.',
  },

  // --------------------------------------------------------------------------
  'USG moszny i jąder': {
    examinationType: 'USG moszny i jąder',
    examFocus: 'Ocena jąder, najądrzy i naczyń mosznowych. Wykrywanie guzów, zapalenia, żylaków.',
    mandatoryStructures: ['jądro prawe', 'jądro lewe', 'najądrze prawe', 'najądrze lewe'],
    systematicChecklist: [
      'Wymiary każdego jądra',
      'Echogeniczność jądra (jednorodna)',
      'Zmiany ogniskowe — lokalizacja, wymiary, echogeniczność',
      'Najądrze — wymiary głowy, trzon, ogon',
      'Żylaki powrózka nasiennego (żylakowatość) — obustronne',
      'Hydrocoele — objętość',
      'Unaczynienie w Doppler (skręt jądra — nagłe przypadki)',
    ],
    referenceNorms: {
      'jądro wymiary': '4 × 3 × 2 cm',
      'głowa najądrza': '< 1 cm',
    },
    classifications: [],
    warningThresholds: [
      { field: 'zmiana ogniskowa jądra', condition: 'hipoechogeniczna lita', message: 'Podejrzenie nowotworu jądra — pilna konsultacja urologiczna i badanie AFP/HCG/LDH' },
      { field: 'unaczynienie', condition: 'brak przepływu', message: 'Brak unaczynienia jądra — skręt jądra? Nagłe wskazanie chirurgiczne.' },
    ],
    imagingLimitations: ['Unaczynienie (Doppler) nieocenione na obrazach statycznych — wymaga badania w czasie rzeczywistym'],
    impressionTemplate: 'Jądra: wymiary i echogeniczność. Najądrza. Żylaki. Hydrocoele. Zmiany ogniskowe.',
    genderRestriction: 'M',
  },

  // --------------------------------------------------------------------------
  'USG układu mięśniowo-szkieletowego (MSK)': {
    examinationType: 'USG układu mięśniowo-szkieletowego (MSK)',
    examFocus: 'Ocena ścięgien, mięśni, więzadeł i stawów — dynamicznie i statycznie.',
    mandatoryStructures: ['badana struktura', 'struktury sąsiadujące'],
    systematicChecklist: [
      'Lokalizacja anatomiczna dokładna',
      'Ścięgna/więzadła — ciągłość, grubość, echogeniczność',
      'Mięśnie — ciągłość, cechy stłuszczenia, krwiaki',
      'Stawy — wysięk, błona maziowa, kostki',
      'Nerwy — wymiar, echogeniczność (neuropatia?)',
      'Dynamiczna ocena (jeśli wykonana)',
    ],
    referenceNorms: {},
    classifications: [],
    warningThresholds: [
      { field: 'przerwanie ścięgna', condition: 'całkowite', message: 'Całkowite przerwanie ścięgna — wskazanie do konsultacji ortopedycznej' },
    ],
    imagingLimitations: ['Głębokie ścięgna (np. rotator cuff) wymagają odpowiedniej głowicy', 'Artefakty anizotropii przy obrazowaniu ścięgien (kąt padania)'],
    impressionTemplate: 'Opisz strukturę będącą przedmiotem badania. Ciągłość. Zmiany patologiczne. Wysięk stawowy.',
    contextFields: { bodyPart: true, side: true } as ExaminationTypePrompt['contextFields'],
  },

  // --------------------------------------------------------------------------
  'Echokardiografia': {
    examinationType: 'Echokardiografia',
    examFocus: 'Ocena struktury i funkcji serca — EF, zastawki, komory, osierdzie.',
    mandatoryStructures: ['lewa komora', 'prawa komora', 'lewy przedsionek', 'prawy przedsionek', 'zastawka mitralna', 'zastawka aortalna', 'zastawka trójdzielna', 'osierdzie'],
    systematicChecklist: [
      'EF lewej komory (wartość %)',
      'Wymiary lewej komory (LVIDd, LVIDs, IVST, PWT)',
      'Ocena odcinkowa kurczliwości ścian',
      'Lewy przedsionek — wymiar lub objętość',
      'Zastawka mitralna — morfologia, niedomykalność (stopień), stenoza (MVA, gradient)',
      'Zastawka aortalna — otwieranie, niedomykalność, gradient',
      'Prawe jamy — wymiary, ciśnienie skurczowe w PA (RVSP)',
      'Osierdzie — wysięk (ml)',
    ],
    referenceNorms: {
      'EF': '≥ 55%',
      'LVIDd': '< 5.6 cm (M), < 5.2 cm (F)',
      'IVST + PWT': '< 1.1 cm',
      'LA wymiar': '< 4.0 cm',
      'RVSP': '< 35 mmHg',
    },
    classifications: [],
    warningThresholds: [
      { field: 'EF', condition: '< 40%', message: 'Obniżona EF < 40% — niewydolność serca ze zmniejszoną EF (HFrEF)' },
      { field: 'EF', condition: '40–49%', message: 'EF w zakresie HFmrEF — monitorowanie' },
      { field: 'wysięk osierdziowy', condition: 'duży (> 500 ml lub kompresja)', message: 'Duży wysięk — tamponada? Pilna konsultacja kardiologiczna.' },
    ],
    imagingLimitations: [
      'Okno akustyczne ograniczone u pacjentów z otyłością lub POChP',
      'Parametry Doppler z zapisu w czasie rzeczywistym — AI nie odczyta z obrazu statycznego',
    ],
    impressionTemplate: 'EF i kurczliwość globalna. Wymiary jam serca. Zastawki. Osierdzie. Ciśnienie w tętnicy płucnej.',
    contextFields: { relevantLabValues: true },
  },

  // --------------------------------------------------------------------------
  // Default fallback
  // --------------------------------------------------------------------------
  'default': {
    examinationType: 'unknown',
    examFocus: 'Ogólna ocena ultrasonograficzna.',
    mandatoryStructures: [],
    systematicChecklist: [
      'Opisz wszystkie widoczne struktury systematycznie',
      'Podaj lokalizację, wymiary, echogeniczność zmian',
      'Wskaż struktury niewidoczne lub poza kadrem',
    ],
    referenceNorms: {},
    classifications: [],
    warningThresholds: [],
    imagingLimitations: ['Brak specyficznych ograniczeń dla niezidentyfikowanego typu badania'],
    impressionTemplate: 'Opisz główne znaleziska. Wskaż odchylenia od normy. Podaj struktury nieocenione.',
  },
}

// ============================================================================
// Public API
// ============================================================================

export function getExamTypeConfig(examinationType: string): ExaminationTypePrompt {
  return EXAM_TYPE_CONFIGS[examinationType] ?? EXAM_TYPE_CONFIGS['default']
}

/**
 * Builds Warstwa 2 system prompt for analyze-image.
 */
export function buildAnalyzeImageSystemPrompt(examinationType: string, patientGender?: 'M' | 'F'): string {
  const cfg = getExamTypeConfig(examinationType)
  const lines: string[] = [
    `## KONTEKST DOMENOWY: ${examinationType}`,
    `Cel badania: ${cfg.examFocus}`,
    '',
    `### Struktury obowiązkowe do oceny:`,
    cfg.mandatoryStructures.map(s => `- ${s}`).join('\n'),
    '',
    `### Checklist systematyczny:`,
    cfg.systematicChecklist.map((c, i) => `${i + 1}. ${c}`).join('\n'),
    '',
    `### Normy referencyjne:`,
    Object.entries(cfg.referenceNorms).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- brak specyficznych norm dla tego badania',
    '',
  ]

  if (cfg.classifications.length > 0) {
    lines.push('### Klasyfikacje formalne (stosuj OBOWIĄZKOWO gdy dotyczy):')
    for (const cls of cfg.classifications) {
      lines.push(`**${cls.name}**: ${cls.description}`)
      if (cls.applicableWhen) lines.push(`Zastosowanie: ${cls.applicableWhen}`)
    }
    lines.push('')
  }

  if (cfg.imagingLimitations.length > 0) {
    lines.push('### Typowe ograniczenia tego badania:')
    lines.push(cfg.imagingLimitations.map(l => `- ${l}`).join('\n'))
    lines.push('')
  }

  lines.push(`### Struktura sekcji impression:`)
  lines.push(cfg.impressionTemplate)

  if (patientGender && cfg.genderRestriction && patientGender !== cfg.genderRestriction) {
    lines.push('\n⚠️ Uwaga: typ badania ma ograniczenie płci — zweryfikuj kontekst kliniczny.')
  }

  return lines.join('\n')
}

/**
 * Builds Warstwa 2 system prompt for generate-report (radiologist voice flow).
 */
export function buildGenerateReportSystemPrompt(examinationType: string): string {
  const cfg = getExamTypeConfig(examinationType)
  const lines: string[] = [
    `## KONTEKST DOMENOWY: ${examinationType}`,
    `Cel badania: ${cfg.examFocus}`,
    '',
    `### Struktury obowiązkowe — upewnij się że zostały wspomniane w dyktowaniu:`,
    cfg.mandatoryStructures.map(s => `- ${s}`).join('\n'),
    '',
  ]

  if (cfg.classifications.length > 0) {
    lines.push('### Klasyfikacje formalne — zachowaj dosłownie z dyktowania:')
    for (const cls of cfg.classifications) {
      lines.push(`- ${cls.name}: ${cls.description.substring(0, 200)}...`)
    }
    lines.push('')
  }

  lines.push(`### Normy referencyjne (dla walidacji finding vs norma):`)
  lines.push(Object.entries(cfg.referenceNorms).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- brak')

  return lines.join('\n')
}
