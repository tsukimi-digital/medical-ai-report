import type { AiQualityCheck, QualityCheckItem } from '@/lib/types'
import { Icon } from './ui/icon'
import { Banner } from './ui/banner'

const STATUS_CONFIG = {
  ready:           { kind: 'ok' as const,   icon: 'checkCircle' as const, pl: 'Gotowe do weryfikacji', en: 'Ready for review' },
  needs_attention: { kind: 'warn' as const,  icon: 'alert' as const,       pl: 'Wymaga uwagi',          en: 'Needs attention' },
  blocked:         { kind: 'crit' as const,  icon: 'alertCircle' as const, pl: 'Zablokowane',           en: 'Blocked' },
}

const CHECK_STATUS_COLOR: Record<QualityCheckItem['status'], string> = {
  pass:    'var(--ok-text)',
  warning: 'var(--warn-text)',
  fail:    'var(--crit-text)',
}

const CHECK_STATUS_ICON = {
  pass:    'checkCircle' as const,
  warning: 'alert' as const,
  fail:    'alertCircle' as const,
}

type QualityCheckPanelProps = {
  qc: AiQualityCheck
  lang?: 'pl' | 'en'
}

export function QualityCheckPanel({ qc, lang = 'pl' }: QualityCheckPanelProps) {
  const cfg = STATUS_CONFIG[qc.status]

  return (
    <div className="col g12">
      <Banner kind={cfg.kind} icon={cfg.icon} title={lang === 'en' ? cfg.en : cfg.pl}>
        {qc.summary}
      </Banner>

      {qc.checks.length > 0 && (
        <div className="col g6">
          {qc.checks.map((c, i) => (
            <div
              key={i}
              className="row g10 panel"
              style={{ padding: '9px 12px' }}
            >
              <Icon
                name={CHECK_STATUS_ICON[c.status]}
                size={15}
                style={{ color: CHECK_STATUS_COLOR[c.status], flex: 'none' }}
                aria-label={c.status}
              />
              <span style={{ fontSize: 12.5 }}>{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {qc.autoCorrections.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {lang === 'en' ? 'AI auto-corrections' : 'Auto-korekty AI'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {qc.autoCorrections.map((c, i) => (
              <li key={i} style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 3 }}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {qc.unresolvedItems.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8, color: 'var(--warn-text)' }}>
            {lang === 'en' ? 'Unresolved' : 'Nierozwiązane'}
          </div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {qc.unresolvedItems.map((item, i) => (
              <li key={i} style={{ fontSize: 12.5, color: 'var(--warn-text)', marginBottom: 3 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
