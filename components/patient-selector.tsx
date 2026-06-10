'use client'

import type { Patient } from '@/lib/types'
import { Combobox } from './ui/combobox'
import { Icon } from './ui/icon'

type PatientSelectorProps = {
  value: Patient | null
  onChange: (p: Patient) => void
  patients: Patient[]
  placeholder?: string
  emptyText?: string
  lang?: 'pl' | 'en'
  disabled?: boolean
}

export function PatientSelector({
  value,
  onChange,
  patients,
  placeholder,
  emptyText,
  lang = 'pl',
  disabled,
}: PatientSelectorProps) {
  const ph = placeholder ?? (lang === 'en' ? 'Search by last name or PESEL…' : 'Szukaj po nazwisku lub PESEL…')
  const empty = emptyText ?? (lang === 'en' ? 'No results' : 'Brak wyników')
  const getLabel = (p: Patient) => `${p.firstName} ${p.lastName} ${p.pesel}`

  const renderPatient = (p: Patient) => (
    <div className="row g10 grow">
      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>
        {p.firstName[0]}{p.lastName[0]}
      </div>
      <div className="grow">
        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.firstName} {p.lastName}</div>
        <div className="faint mono" style={{ fontSize: 11 }}>
          {p.pesel} · {p.age} {lang === 'en' ? 'y/o' : 'lat'} · {p.gender === 'F' ? (lang === 'en' ? 'female' : 'kobieta') : (lang === 'en' ? 'male' : 'mężczyzna')}
        </div>
      </div>
    </div>
  )

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={patients}
      placeholder={ph}
      getLabel={(p) => `${p.firstName} ${p.lastName}`}
      render={renderPatient}
      emptyText={empty}
      disabled={disabled}
    />
  )
}
