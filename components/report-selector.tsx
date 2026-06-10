'use client'

import type { RadiologicalReport } from '@/lib/types'
import { Combobox } from './ui/combobox'

type ReportSelectorProps = {
  value: RadiologicalReport | null
  onChange: (r: RadiologicalReport) => void
  reports: RadiologicalReport[]
  placeholder?: string
  emptyText?: string
  lang?: 'pl' | 'en'
  disabled?: boolean
}

export function ReportSelector({
  value,
  onChange,
  reports,
  placeholder,
  emptyText,
  lang = 'pl',
  disabled,
}: ReportSelectorProps) {
  const ph = placeholder ?? (lang === 'en' ? 'Select a radiology report…' : 'Wybierz raport radiologiczny…')
  const empty = emptyText ?? (lang === 'en' ? 'No reports' : 'Brak raportów')
  const getLabel = (r: RadiologicalReport) =>
    `${r.examinationType} — ${new Date(r.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL')}`

  const renderReport = (r: RadiologicalReport) => (
    <div className="col grow" style={{ gap: 2 }}>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.examinationType}</div>
      <div className="faint mono" style={{ fontSize: 11 }}>
        {new Date(r.createdAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pl-PL')}
        {r.impression ? ` · ${r.impression.slice(0, 60)}…` : ''}
      </div>
    </div>
  )

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={reports}
      placeholder={ph}
      getLabel={getLabel}
      render={renderReport}
      emptyText={empty}
      disabled={disabled}
    />
  )
}
