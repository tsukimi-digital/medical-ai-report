'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { pl } from './pl'
import { en } from './en'

export type Lang = 'pl' | 'en'
export type I18nDict = typeof pl

export { pl, en }

/** Data-label translation dictionary (PL → EN) for short UI labels embedded in demo data */
const DATA_EN: Record<string, string> = {
  // exam types
  'USG tarczycy': 'Thyroid ultrasound',
  'USG jamy brzusznej': 'Abdominal ultrasound',
  'USG nerek': 'Renal ultrasound',
  'USG wątroby': 'Liver ultrasound',
  'USG pęcherzyka żółciowego': 'Gallbladder ultrasound',
  'USG trzustki': 'Pancreas ultrasound',
  'USG piersi': 'Breast ultrasound',
  'USG ginekologiczne transwaginalne (TV)': 'Transvaginal gynecological ultrasound (TV)',
  'USG ginekologiczne (TV)': 'Gynecological ultrasound (TV)',
  'USG Doppler tętnic szyjnych': 'Carotid artery Doppler ultrasound',
  'USG węzłów chłonnych': 'Lymph node ultrasound',
  'USG moszny i jąder': 'Scrotal & testicular ultrasound',
  Echokardiografia: 'Echocardiography',
  // classification risk labels
  'Średnie ryzyko': 'Intermediate risk',
  'Niskie ryzyko': 'Low risk',
  'Wysokie ryzyko': 'High risk',
  // dashboard summaries (radiologist)
  'Zmiana 8 mm lewy płat — TI-RADS 4': '8 mm left-lobe nodule — TI-RADS 4',
  'Z dyktowania — kontrola': 'From dictation — follow-up',
  'Jakość suboptymalna — konflikt': 'Suboptimal quality — conflict',
  'TI-RADS 4 — zatwierdzony': 'TI-RADS 4 — approved',
  'Torbiel nerki (Bosniak I)': 'Renal cyst (Bosniak I)',
  'O-RADS 2 — łagodna': 'O-RADS 2 — benign',
  // visit row types (doctor)
  'Wizyta — omówienie USG tarczycy': 'Visit — thyroid ultrasound review',
  'Wizyta kontrolna': 'Follow-up visit',
}

/**
 * Translates a short UI label from PL to EN.
 * Report bodies stay in their generation language (PL) — this is for UI chrome only.
 */
export function L(lang: Lang, s: string | null | undefined): string {
  if (lang !== 'en' || s == null) return s ?? ''
  return DATA_EN[s] ?? s
}

/**
 * Returns the translation dict for the given language.
 */
export function getDict(lang: Lang): I18nDict {
  return lang === 'en' ? (en as unknown as I18nDict) : pl
}

/**
 * Module-level language store shared by every useI18n() consumer.
 * A plain useState inside the hook would give each component its own
 * isolated lang — the navbar toggle would never reach page content.
 */
let currentLang: Lang = 'pl'
const langListeners = new Set<() => void>()

function subscribeLang(listener: () => void): () => void {
  langListeners.add(listener)
  return () => langListeners.delete(listener)
}

function getLangSnapshot(): Lang {
  return currentLang
}

export function setGlobalLang(lang: Lang): void {
  if (lang === currentLang) return
  currentLang = lang
  langListeners.forEach((fn) => fn())
}

/**
 * React hook for language state + translation function.
 * Language is global — changing it anywhere updates every subscribed component.
 * Usage: const { lang, setLang, t, L: translate } = useI18n()
 */
export function useI18n() {
  const lang = useSyncExternalStore(subscribeLang, getLangSnapshot, getLangSnapshot)
  const setLang = useCallback((l: Lang) => setGlobalLang(l), [])
  const dict = getDict(lang)

  const t = useCallback(
    (key: keyof I18nDict): string => {
      return (dict as Record<string, string>)[key] ?? key
    },
    [dict],
  )

  const translate = useCallback((s: string | null | undefined) => L(lang, s), [lang])

  return { lang, setLang, t, L: translate, dict }
}
