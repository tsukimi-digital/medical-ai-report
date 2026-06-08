'use client'

import { EXAM_TYPE_LIST } from '@/lib/types'
import { Combobox } from './ui/combobox'

type ExamTypeSelectorProps = {
  value: string | null
  onChange: (type: string) => void
  placeholder?: string
  emptyText?: string
  lang?: 'pl' | 'en'
  disabled?: boolean
}

const DATA_EN: Record<string, string> = {
  'USG tarczycy': 'Thyroid ultrasound',
  'USG jamy brzusznej': 'Abdominal ultrasound',
  'USG nerek': 'Renal ultrasound',
  'USG wątroby': 'Liver ultrasound',
  'USG pęcherzyka żółciowego': 'Gallbladder ultrasound',
  'USG trzustki': 'Pancreas ultrasound',
  'USG śledziony': 'Spleen ultrasound',
  'USG prostaty': 'Prostate ultrasound',
  'USG ginekologiczne transwaginalne (TV)': 'Transvaginal gynecological ultrasound (TV)',
  'USG ginekologiczne przezbrzuszne (TA)': 'Transabdominal gynecological ultrasound (TA)',
  'USG piersi': 'Breast ultrasound',
  'USG tkanek miękkich': 'Soft tissue ultrasound',
  'USG Doppler tętnic szyjnych': 'Carotid artery Doppler ultrasound',
  'USG Doppler tętnic kończyn dolnych': 'Lower limb arterial Doppler ultrasound',
  'USG Doppler żylny kończyn dolnych (DVT)': 'Lower limb venous Doppler (DVT)',
  'USG węzłów chłonnych': 'Lymph node ultrasound',
  'USG moszny i jąder': 'Scrotal & testicular ultrasound',
  'USG układu mięśniowo-szkieletowego (MSK)': 'Musculoskeletal ultrasound (MSK)',
  Echokardiografia: 'Echocardiography',
}

export function ExaminationTypeSelect({
  value,
  onChange,
  placeholder = 'Wybierz lub wpisz typ badania…',
  emptyText = 'Brak wyników',
  lang = 'pl',
  disabled,
}: ExamTypeSelectorProps) {
  const getLabel = (t: string) => (lang === 'en' ? (DATA_EN[t] ?? t) : t)

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={EXAM_TYPE_LIST}
      placeholder={placeholder}
      getLabel={getLabel}
      render={getLabel}
      emptyText={emptyText}
      disabled={disabled}
    />
  )
}
