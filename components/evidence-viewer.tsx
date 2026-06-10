'use client'

import type { Finding } from '@/lib/types'
import { Icon } from './ui/icon'

type EvidenceViewerProps = {
  finding: Finding | null
  imageLabel?: string
  imageCount?: number
  lang?: 'pl' | 'en'
}

function UsgThumb({
  idx,
  label,
  lit,
  lang,
}: {
  idx: number
  label: string
  lit?: boolean
  lang: 'pl' | 'en'
}) {
  const ariaLabel =
    lang === 'en'
      ? `Image ${idx + 1}${lit ? ' (finding source)' : ''}`
      : `Obraz ${idx + 1}${lit ? ' (źródło znaleziska)' : ''}`
  return (
    <div
      className={`usg-thumb${lit ? ' lit' : ''}`}
      style={{ width: 78, height: 60 }}
      aria-label={ariaLabel}
    >
      <span className="usg-idx">{String(idx + 1).padStart(2, '0')}</span>
      <span className="usg-label">
        {label}_{String(idx + 1).padStart(2, '0')}
      </span>
    </div>
  )
}

export function EvidenceViewer({ finding, imageLabel, imageCount = 0, lang: langProp = 'pl' }: EvidenceViewerProps) {
  if (!finding) return null

  const ev = finding.evidence ?? {}
  const imgs = ev.imageIndexes ?? []
  const frags = ev.transcriptFragments ?? []
  const total = imageLabel
    ? Math.max(imageCount, ...imgs.map((x) => x + 1))
    : 0

  if (!imgs.length && !frags.length) {
    return (
      <div className="faint" style={{ fontSize: 13 }}>
        {langProp === 'en' ? 'No source evidence available.' : 'Brak dowodów źródłowych.'}
      </div>
    )
  }

  return (
    <div className="col g16">
      <div className="panel" style={{ padding: 12, background: 'var(--surface-2)' }}>
        <div className="faint" style={{ fontSize: 11.5, marginBottom: 4 }}>{finding.anatomicalLocation}</div>
        <div style={{ fontSize: 13.5 }}>{finding.text}</div>
      </div>

      {imgs.length > 0 && imageLabel && total > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {langProp === 'en' ? 'Related images' : 'Powiązane obrazy'}
          </div>
          <div className="row g8 wrap" role="list" aria-label={langProp === 'en' ? 'Ultrasound images' : 'Obrazy USG'}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} role="listitem">
                <UsgThumb idx={i} label={imageLabel} lit={imgs.includes(i)} lang={langProp} />
              </div>
            ))}
          </div>
          <div className="faint" style={{ fontSize: 11.5, marginTop: 8 }}>
            {langProp === 'pl'
              ? `Podświetlone: źródło znaleziska (${imgs.map((i) => String(i + 1).padStart(2, '0')).join(', ')})`
              : `Highlighted: finding source (${imgs.map((i) => String(i + 1).padStart(2, '0')).join(', ')})`}
          </div>
        </div>
      )}

      {frags.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {langProp === 'en' ? 'Transcript fragment' : 'Fragment transkrypcji'}
          </div>
          {frags.map((f, i) => (
            <div
              key={i}
              className="panel mono"
              style={{
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-muted)',
                borderLeft: '3px solid var(--accent-600)',
              }}
            >
              „{f}"
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
