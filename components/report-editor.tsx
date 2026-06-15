'use client'

import { useState } from 'react'
import type { RadiologicalReport, MedicalReport, Finding } from '@/lib/types'
import { FindingsList } from './findings-list'
import { Icon } from './ui/icon'
import { getDict } from '@/lib/i18n/index'

type ReportEditorProps = {
  report: RadiologicalReport | MedicalReport
  onChange: (updated: RadiologicalReport | MedicalReport) => void
  readonly?: boolean
  lang?: 'pl' | 'en'
  onEvidence?: (f: Finding) => void
}

function isRadReport(r: RadiologicalReport | MedicalReport): r is RadiologicalReport {
  return 'radiologistId' in r
}

export function ReportEditor({ report, onChange, readonly, lang = 'pl', onEvidence }: ReportEditorProps) {
  const t = (pl: string, en: string) => (lang === 'en' ? en : pl)
  const dict = getDict(lang)

  const handleFindingUpdate = (id: string, patch: Partial<Finding>) => {
    if (!isRadReport(report)) return
    const updated: RadiologicalReport = {
      ...report,
      findings: report.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }
    onChange(updated)
  }

  const handleFindingRemove = (id: string) => {
    if (!isRadReport(report)) return
    onChange({ ...report, findings: report.findings.filter((f) => f.id !== id) })
  }

  const handleLowConfidenceRemove = (id: string) => {
    if (!isRadReport(report)) return
    onChange({ ...report, lowConfidenceFindings: report.lowConfidenceFindings!.filter((f) => f.id !== id) })
  }

  if (isRadReport(report)) {
    return (
      <div className="col g20">
        {/* Findings */}
        <div>
          <div className="h-sec" style={{ marginBottom: 12 }}>
            {t('Znaleziska', 'Findings')}
          </div>
          <FindingsList
            findings={report.findings}
            lang={lang}
            readonly={readonly}
            onUpdate={readonly ? undefined : handleFindingUpdate}
            onRemove={readonly ? undefined : handleFindingRemove}
            onEvidence={onEvidence}
          />
        </div>

        {/* Low confidence — red card, prototype "needs verification" panel */}
        {(report.lowConfidenceFindings?.length ?? 0) > 0 && (
          <div
            className="panel"
            style={{ padding: 14, background: 'var(--low-bg)', borderColor: 'var(--low-bd)' }}
          >
            <div className="row g8" style={{ marginBottom: 6 }}>
              <Icon name="alertCircle" size={16} style={{ color: 'var(--low-text)' }} aria-hidden />
              <span className="h-card" style={{ color: 'var(--low-text)' }}>
                {dict.needsVerification} · {report.lowConfidenceFindings!.length}
              </span>
            </div>
            <div
              className="faint"
              style={{ fontSize: 12, marginBottom: 12, color: 'var(--low-text)', opacity: 0.85 }}
            >
              {dict.needsVerificationHint}
            </div>
            <FindingsList
              findings={report.lowConfidenceFindings!}
              lang={lang}
              readonly={readonly}
              label="low"
              onRemove={readonly ? undefined : handleLowConfidenceRemove}
              onEvidence={onEvidence}
            />
          </div>
        )}

        {/* Impression */}
        <div>
          <label className="field-label" htmlFor="impression">
            {t('Wnioski', 'Impression')}
          </label>
          <textarea
            id="impression"
            className="textarea"
            value={report.impression ?? ''}
            readOnly={readonly}
            rows={4}
            onChange={(e) => !readonly && onChange({ ...report, impression: e.target.value })}
            style={{ cursor: readonly ? 'default' : 'text' }}
          />
        </div>

        {/* Imaging limitations */}
        <div>
          <label className="field-label" htmlFor="limitations">
            {t('Ograniczenia badania', 'Imaging limitations')}
            <span className="opt"> · {t('opcjonalne', 'optional')}</span>
          </label>
          <textarea
            id="limitations"
            className="textarea"
            value={report.imagingLimitations ?? ''}
            readOnly={readonly}
            rows={2}
            onChange={(e) => !readonly && onChange({ ...report, imagingLimitations: e.target.value })}
            style={{ cursor: readonly ? 'default' : 'text' }}
          />
        </div>

        {/* Recommendations */}
        <div>
          <label className="field-label" htmlFor="recommendations">
            {t('Zalecenia', 'Recommendations')}
            <span className="opt"> · {t('opcjonalne', 'optional')}</span>
          </label>
          <textarea
            id="recommendations"
            className="textarea"
            value={report.radiologistRecommendations ?? ''}
            readOnly={readonly}
            rows={2}
            onChange={(e) =>
              !readonly && onChange({ ...report, radiologistRecommendations: e.target.value })
            }
            style={{ cursor: readonly ? 'default' : 'text' }}
          />
        </div>
      </div>
    )
  }

  // Medical report
  const med = report as MedicalReport
  return (
    <div className="col g20">
      <div>
        <label className="field-label" htmlFor="anamnesis">{t('Wywiad', 'Anamnesis')}</label>
        <textarea
          id="anamnesis"
          className="textarea"
          value={med.anamnesis}
          readOnly={readonly}
          rows={4}
          onChange={(e) => !readonly && onChange({ ...med, anamnesis: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="diagnosis">{t('Rozpoznanie', 'Diagnosis')}</label>
        <textarea
          id="diagnosis"
          className="textarea"
          value={med.diagnosis}
          readOnly={readonly}
          rows={3}
          onChange={(e) => !readonly && onChange({ ...med, diagnosis: e.target.value })}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="recommendations">{t('Zalecenia', 'Recommendations')}</label>
        <textarea
          id="recommendations"
          className="textarea"
          value={med.recommendations}
          readOnly={readonly}
          rows={3}
          onChange={(e) => !readonly && onChange({ ...med, recommendations: e.target.value })}
        />
      </div>
    </div>
  )
}
