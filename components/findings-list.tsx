'use client'

import { useState, type ReactNode } from 'react'
import type { Finding, ConfidenceLevel } from '@/lib/types'
import { ConfBadge } from './ui/badge'
import { Icon } from './ui/icon'

type FindingsListProps = {
  findings: Finding[]
  lang?: 'pl' | 'en'
  readonly?: boolean
  onUpdate?: (id: string, patch: Partial<Finding>) => void
  onRemove?: (id: string) => void
  onEvidence?: (f: Finding) => void
  label?: 'low' | 'formal'
}

const CONF_CYCLE: Record<ConfidenceLevel, ConfidenceLevel> = {
  high: 'medium',
  medium: 'low',
  low: 'high',
}

function FindingRow({
  f,
  lang,
  readonly,
  onUpdate,
  onRemove,
  onEvidence,
  isLow,
}: {
  f: Finding
  lang?: 'pl' | 'en'
  readonly?: boolean
  onUpdate?: (id: string, patch: Partial<Finding>) => void
  onRemove?: (id: string) => void
  onEvidence?: (f: Finding) => void
  isLow?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(f.text)
  const [editLoc, setEditLoc] = useState(false)
  const [loc, setLoc] = useState(f.anatomicalLocation)
  const [isModified, setIsModified] = useState(false)

  const hasEvidence =
    f.evidence &&
    ((f.evidence.imageIndexes?.length ?? 0) > 0 ||
      (f.evidence.transcriptFragments?.length ?? 0) > 0)

  const borderColor = isLow
    ? 'var(--low-bd)'
    : f.isDeviation
    ? 'var(--warn-bd)'
    : 'var(--border-strong)'

  return (
    <div
      className="panel"
      style={{ padding: '12px 14px', borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="row between g10" style={{ marginBottom: 7 }}>
        <div className="row g8 wrap">
          {readonly ? (
            <ConfBadge level={f.confidence} lang={lang} />
          ) : (
            <button
              type="button"
              className="badge-btn"
              title={lang === 'en' ? 'Click to change confidence' : 'Kliknij, aby zmienić pewność'}
              onClick={() => onUpdate?.(f.id!, { confidence: CONF_CYCLE[f.confidence] })}
            >
              <ConfBadge level={f.confidence} lang={lang} />
              <Icon name="chevD" size={11} style={{ opacity: 0.5 }} aria-hidden />
            </button>
          )}
          {isModified && (
            <span
              className="chip chip-edited"
              style={{
                backgroundColor: 'var(--warn-bg)',
                color: 'var(--warn-fg)',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              {lang === 'en' ? 'edited ✎' : 'zmodyfikowane ✎'}
            </span>
          )}
          {readonly ? (
            <span className={`chip ${f.isDeviation ? 'chip-dev' : 'chip-norm'}`}>
              {f.isDeviation ? (lang === 'en' ? 'deviation' : 'odchylenie') : (lang === 'en' ? 'normal' : 'norma')}
            </span>
          ) : (
            <button
              type="button"
              className="chip-btn"
              onClick={() => onUpdate?.(f.id!, { isDeviation: !f.isDeviation })}
            >
              <span className={`chip ${f.isDeviation ? 'chip-dev' : 'chip-norm'}`}>
                {f.isDeviation ? (lang === 'en' ? 'deviation' : 'odchylenie') : (lang === 'en' ? 'normal' : 'norma')}
              </span>
            </button>
          )}
          {editLoc && !readonly ? (
            <input
              className="input"
              autoFocus
              value={loc}
              style={{ fontSize: 11.5, padding: '2px 7px', width: 200, height: 24 }}
              onChange={(e) => setLoc(e.target.value)}
              onBlur={() => {
                setEditLoc(false)
                if (loc !== f.anatomicalLocation) onUpdate?.(f.id!, { anatomicalLocation: loc })
              }}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              aria-label={lang === 'en' ? 'Edit location' : 'Edytuj lokalizację'}
            />
          ) : (
            <button
              type="button"
              className="loc-btn faint"
              disabled={readonly}
              title={readonly ? '' : lang === 'en' ? 'Click to edit location' : 'Kliknij, aby edytować lokalizację'}
              onClick={() => !readonly && setEditLoc(true)}
              style={{ fontSize: 11.5 }}
            >
              {f.anatomicalLocation}
              {!readonly && <Icon name="edit" size={10} style={{ opacity: 0.45, marginLeft: 4 }} aria-hidden />}
            </button>
          )}
        </div>
        {!readonly && (
          <div className="row g4">
            {hasEvidence && onEvidence && (
              <button
                type="button"
                className="iconbtn"
                title={lang === 'en' ? 'Source evidence' : 'Dowód źródłowy'}
                onClick={() => onEvidence(f)}
                aria-label={lang === 'en' ? 'Show source evidence' : 'Pokaż dowód źródłowy'}
              >
                <Icon name="eye" size={14} aria-hidden />
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                className="iconbtn"
                title={lang === 'en' ? 'Remove' : 'Usuń'}
                onClick={() => onRemove(f.id!)}
                aria-label={lang === 'en' ? 'Remove finding' : 'Usuń znalezisko'}
              >
                <Icon name="trash" size={14} aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>

      {editing && !readonly ? (
        <textarea
          className="textarea"
          autoFocus
          value={text}
          style={{ fontSize: 13.5, minHeight: 60 }}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (text !== f.text) {
              setIsModified(true)
              onUpdate?.(f.id!, { text })
            }
          }}
          aria-label={lang === 'en' ? 'Edit finding text' : 'Edytuj treść znaleziska'}
        />
      ) : (
        <p
          style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, cursor: readonly ? 'default' : 'text' }}
          onClick={() => !readonly && setEditing(true)}
          title={readonly ? '' : lang === 'en' ? 'Click to edit' : 'Kliknij, aby edytować'}
        >
          {f.text}
        </p>
      )}

      {hasEvidence && onEvidence && readonly && (
        <button
          type="button"
          className="link row g4 faint"
          style={{ fontSize: 11.5, marginTop: 6, fontWeight: 400 }}
          onClick={() => onEvidence(f)}
        >
          <Icon name="eye" size={12} aria-hidden />
          {lang === 'en' ? 'Source evidence' : 'Dowód źródłowy'}
        </button>
      )}
    </div>
  )
}

export function FindingsList({
  findings,
  lang,
  readonly,
  onUpdate,
  onRemove,
  onEvidence,
  label,
}: FindingsListProps) {
  if (!findings.length) {
    return (
      <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>
        {lang === 'en' ? 'No findings.' : 'Brak znalezisk.'}
      </div>
    )
  }

  return (
    <div className="col g8">
      {findings.map((f) => (
        <FindingRow
          key={f.id ?? f.text}
          f={f}
          lang={lang}
          readonly={readonly}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onEvidence={onEvidence}
          isLow={label === 'low'}
        />
      ))}
    </div>
  )
}
