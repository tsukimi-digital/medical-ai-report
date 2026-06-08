'use client'

import { useState } from 'react'
import type { AISuggestion } from '@/lib/types'
import { ConfBadge } from './ui/badge'
import { Btn } from './ui/button'
import { Icon } from './ui/icon'

const TYPE_LABELS: Record<string, { pl: string; en: string }> = {
  differential_diagnosis: { pl: 'Rozpoznanie różnicowe', en: 'Differential diagnosis' },
  additional_observation: { pl: 'Dodatkowa obserwacja', en: 'Additional observation' },
  follow_up_question:     { pl: 'Pytanie kontrolne', en: 'Follow-up question' },
  missing_structure:      { pl: 'Brak struktury', en: 'Missing structure' },
  risk_factor:            { pl: 'Czynnik ryzyka', en: 'Risk factor' },
}

type AiSuggestionsProps = {
  suggestions: AISuggestion[]
  lang?: 'pl' | 'en'
  onInsert?: (s: AISuggestion) => void
}

export function AiSuggestions({ suggestions, lang = 'pl', onInsert }: AiSuggestionsProps) {
  const [added, setAdded] = useState<Set<string>>(new Set())

  if (!suggestions.length) return null

  const handleAdd = (s: AISuggestion) => {
    setAdded((prev) => { const next = new Set(Array.from(prev)); next.add(s.id); return next })
    onInsert?.(s)
  }

  return (
    <div className="col g8">
      {suggestions.map((s) => {
        const typeLabel = TYPE_LABELS[s.type]?.[lang] ?? s.type
        const isAdded = added.has(s.id)

        return (
          <div key={s.id} className="panel" style={{ padding: '12px 14px' }}>
            <div className="row between g8" style={{ marginBottom: 6 }}>
              <div className="row g8 wrap">
                <span className="badge badge-ai">{typeLabel}</span>
                <ConfBadge level={s.confidence} lang={lang} />
              </div>
              {s.canInsertIntoReport && onInsert && (
                <Btn
                  variant={isAdded ? 'ghost' : 'secondary'}
                  size="xs"
                  icon={isAdded ? 'check' : 'plus'}
                  onClick={() => !isAdded && handleAdd(s)}
                  disabled={isAdded}
                  aria-label={
                    isAdded
                      ? (lang === 'en' ? 'Added' : 'Dodano')
                      : (lang === 'en' ? 'Add to report' : 'Dodaj do raportu')
                  }
                  type="button"
                >
                  {isAdded ? (lang === 'en' ? 'Added' : 'Dodano') : (lang === 'en' ? 'Add to report' : 'Dodaj do raportu')}
                </Btn>
              )}
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{s.title}</div>
            {s.description && (
              <div className="muted" style={{ fontSize: 12.5, marginBottom: 4 }}>{s.description}</div>
            )}
            <div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>
              <Icon name="info" size={12} style={{ display: 'inline', marginRight: 4 }} aria-hidden />
              {s.rationale}
            </div>
          </div>
        )
      })}
    </div>
  )
}
