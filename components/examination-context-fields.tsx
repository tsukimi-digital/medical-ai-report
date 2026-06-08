'use client'

import type { ExaminationContext } from '@/lib/types'
import { Icon } from './ui/icon'

const CYCLE_OPTIONS = [
  { value: 'follicular', pl: 'Folikularna', en: 'Follicular' },
  { value: 'ovulatory',  pl: 'Owulacyjna',  en: 'Ovulatory' },
  { value: 'luteal',     pl: 'Lutealna',    en: 'Luteal' },
  { value: 'postmenopause', pl: 'Po menopauzie', en: 'Postmenopause' },
  { value: 'pregnancy',  pl: 'Ciąża',       en: 'Pregnancy' },
  { value: 'on_contraceptives', pl: 'Antykoncepcja', en: 'On contraceptives' },
]

function contextFor(type: string | null): Array<'fasting' | 'cycle' | 'labValues'> {
  if (!type) return []
  if (type.includes('ginekolog')) return ['cycle']
  if (/jamy brzusznej|wątroby|pęcherzyka|trzustki|śledziony|nerek/.test(type)) return ['fasting']
  if (type.includes('tarczycy')) return ['labValues']
  return []
}

type ExaminationContextFieldsProps = {
  examType: string | null
  context: ExaminationContext
  onChange: (ctx: ExaminationContext) => void
  lang?: 'pl' | 'en'
}

export function ExaminationContextFields({
  examType,
  context,
  onChange,
  lang = 'pl',
}: ExaminationContextFieldsProps) {
  const fields = contextFor(examType)
  if (!fields.length) return null

  const t = (pl: string, en: string) => (lang === 'en' ? en : pl)

  return (
    <div className="panel card-pad fade-in" style={{ background: 'var(--surface-2)', padding: 16 }}>
      <div className="eyebrow row g6" style={{ marginBottom: 12 }}>
        <Icon name="flask" size={13} aria-hidden />
        {t('Pola kontekstowe', 'Contextual fields')}
      </div>
      <div className="col g14">
        {fields.includes('fasting') && (
          <label className="row g10" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="checkbox"
              checked={context.fastingStatus === 'fasting'}
              onChange={(e) =>
                onChange({ ...context, fastingStatus: e.target.checked ? 'fasting' : 'non_fasting' })
              }
              aria-label={t('Pacjent na czczo (>6h)', 'Fasting patient (>6h)')}
            />
            <span style={{ fontSize: 13.5 }}>{t('Pacjent na czczo (>6h)', 'Fasting patient (>6h)')}</span>
          </label>
        )}

        {fields.includes('cycle') && (
          <div>
            <label className="field-label" htmlFor="cycle-phase">
              {t('Faza cyklu', 'Cycle phase')}
            </label>
            <select
              id="cycle-phase"
              className="select"
              value={context.menstrualCyclePhase ?? ''}
              onChange={(e) =>
                onChange({
                  ...context,
                  menstrualCyclePhase: e.target.value as ExaminationContext['menstrualCyclePhase'],
                })
              }
            >
              <option value="">{t('— wybierz —', '— select —')}</option>
              {CYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === 'en' ? o.en : o.pl}
                </option>
              ))}
            </select>
          </div>
        )}

        {fields.includes('labValues') && (
          <div>
            <label className="field-label" htmlFor="lab-values">
              {t('Wartości lab. ze skierowania', 'Lab values from referral')}
              <span className="opt"> ({t('opcjonalne', 'optional')})</span>
            </label>
            <input
              id="lab-values"
              className="input"
              placeholder={t('np. TSH 6.2 mIU/L', 'e.g. TSH 6.2 mIU/L')}
              value={
                context.relevantLabValues?.map((l) => `${l.label} ${l.value} ${l.unit}`).join(', ') ?? ''
              }
              onChange={(e) => {
                const raw = e.target.value
                if (!raw.trim()) {
                  onChange({ ...context, relevantLabValues: [] })
                  return
                }
                // Simple parse: "TSH 6.2 mIU/L, FT4 12 pmol/L"
                const vals = raw.split(',').map((s) => {
                  const parts = s.trim().split(/\s+/)
                  return { label: parts[0] ?? '', value: parts[1] ?? '', unit: parts.slice(2).join(' ') }
                })
                onChange({ ...context, relevantLabValues: vals })
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
