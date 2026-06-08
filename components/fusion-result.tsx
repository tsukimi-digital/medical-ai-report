import type { FusionResult } from '@/lib/types'
import { ConfBadge } from './ui/badge'
import { Icon } from './ui/icon'

type FusionResultProps = {
  result: FusionResult
  lang?: 'pl' | 'en'
}

export function FusionResultPanel({ result, lang = 'pl' }: FusionResultProps) {
  const t = (pl: string, en: string) => (lang === 'en' ? en : pl)

  return (
    <div className="col g16">
      {result.confirmedFindings.length > 0 && (
        <section aria-labelledby="fusion-confirmed">
          <div id="fusion-confirmed" className="h-sec row g8" style={{ marginBottom: 10 }}>
            <Icon name="checkCircle" size={16} style={{ color: 'var(--ok-text)' }} aria-hidden />
            {t('Potwierdzone', 'Confirmed')}
            <span className="badge badge-neutral">{result.confirmedFindings.length}</span>
          </div>
          <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
            {t('Widoczne na obrazie i wspomniane w dyktowaniu', 'Visible on image and mentioned in dictation')}
          </div>
          <div className="col g6">
            {result.confirmedFindings.map((f) => (
              <div key={f.id ?? f.text} className="panel row g10" style={{ padding: '10px 12px' }}>
                <ConfBadge level={f.confidence} lang={lang} />
                <span style={{ fontSize: 13.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.imageOnlyFindings.length > 0 && (
        <section aria-labelledby="fusion-image-only">
          <div id="fusion-image-only" className="h-sec row g8" style={{ marginBottom: 10 }}>
            <Icon name="image" size={16} style={{ color: 'var(--accent-700)' }} aria-hidden />
            {t('Tylko na obrazie', 'Image only')}
            <span className="badge badge-neutral">{result.imageOnlyFindings.length}</span>
          </div>
          <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
            {t('AI sugeruje sprawdzenie — radiolog nie wspomniał', 'AI suggests checking — radiologist did not mention')}
          </div>
          <div className="col g6">
            {result.imageOnlyFindings.map((f) => (
              <div key={f.id ?? f.text} className="panel row g10" style={{ padding: '10px 12px' }}>
                <ConfBadge level={f.confidence} lang={lang} />
                <span style={{ fontSize: 13.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.speechOnlyFindings.length > 0 && (
        <section aria-labelledby="fusion-speech-only">
          <div id="fusion-speech-only" className="h-sec row g8" style={{ marginBottom: 10 }}>
            <Icon name="mic" size={16} style={{ color: 'var(--text-muted)' }} aria-hidden />
            {t('Tylko w dyktowaniu', 'Dictation only')}
            <span className="badge badge-neutral">{result.speechOnlyFindings.length}</span>
          </div>
          <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
            {t('Powiedziane, nieznalezione na obrazie', 'Said, not found on image')}
          </div>
          <div className="col g6">
            {result.speechOnlyFindings.map((f) => (
              <div key={f.id ?? f.text} className="panel row g10" style={{ padding: '10px 12px' }}>
                <ConfBadge level={f.confidence} lang={lang} />
                <span style={{ fontSize: 13.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {result.conflicts.length > 0 && (
        <section aria-labelledby="fusion-conflicts">
          <div id="fusion-conflicts" className="h-sec row g8" style={{ marginBottom: 10 }}>
            <Icon name="alert" size={16} style={{ color: 'var(--crit-text)' }} aria-hidden />
            {t('Konflikty', 'Conflicts')}
            <span className="badge badge-low">{result.conflicts.length}</span>
          </div>
          <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
            {t('Rozbieżność między obrazem a dyktowaniem', 'Discrepancy between image and dictation')}
          </div>
          <div className="col g10">
            {result.conflicts.map((c, i) => (
              <div key={i} className="panel" style={{ padding: '12px 14px', borderLeft: '3px solid var(--crit-bd)' }}>
                <div className="col g8">
                  <div>
                    <span className="eyebrow" style={{ marginRight: 8 }}>{t('Dyktowanie', 'Dictation')}</span>
                    <span style={{ fontSize: 13 }}>{c.speechClaim}</span>
                  </div>
                  <div>
                    <span className="eyebrow" style={{ marginRight: 8 }}>{t('Obraz', 'Image')}</span>
                    <span style={{ fontSize: 13 }}>{c.imageEvidence}</span>
                  </div>
                  <div className="faint" style={{ fontSize: 12, fontStyle: 'italic' }}>
                    <Icon name="info" size={12} aria-hidden style={{ display: 'inline', marginRight: 4 }} />
                    {c.note}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
