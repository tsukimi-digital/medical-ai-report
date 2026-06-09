'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { Modal } from '@/components/ui/modal'
import { Collapse } from '@/components/ui/collapse'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import { ReportEditor } from '@/components/report-editor'
import { FindingsList } from '@/components/findings-list'
import { AiSuggestions } from '@/components/ai-suggestions'
import { QualityCheckPanel } from '@/components/quality-check-panel'
import { FusionResultPanel } from '@/components/fusion-result'
import { EvidenceViewer } from '@/components/evidence-viewer'
import type { RadiologicalReport, Finding, Patient } from '@/lib/types'

export default function ExaminationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { lang, t } = useI18n()

  const [report, setReport] = useState<RadiologicalReport | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [evidenceFinding, setEvidenceFinding] = useState<Finding | null>(null)
  const [showEvidenceModal, setShowEvidenceModal] = useState(false)
  const [manualMode, setManualMode] = useState(false)
  const [savingField, setSavingField] = useState<string | null>(null)

  useEffect(() => {
    apiClient.getRadReport(params.id)
      .then(({ report }) => {
        setReport(report)
        return apiClient.getPatient(report.patientId)
      })
      .then(({ patient }) => setPatient(patient))
      .catch(() => setError(lang === 'en' ? 'Report not found.' : 'Nie znaleziono raportu.'))
      .finally(() => setLoading(false))
  }, [params.id, lang])

  const saveField = async (field: 'clinicalIndication' | 'comments', value: string) => {
    if (!report || report.status === 'approved') return
    setSavingField(field)
    try {
      const { report: updated } = await apiClient.updateRadReport(report.id, { [field]: value })
      setReport(updated)
    } finally {
      setSavingField(null)
    }
  }

  const handleApprove = async () => {
    if (!report) return
    setApproving(true)
    try {
      const { report: updated } = await apiClient.approveRadReport(report.id)
      setReport(updated)
      setShowApproveModal(false)
    } catch {
      setError(lang === 'en' ? 'Failed to approve report.' : 'Nie udało się zatwierdzić raportu.')
    } finally {
      setApproving(false)
    }
  }

  const canApprove = report && ((report.findings?.length ?? 0) > 0 || !!report.impression)
  const isApproved = report?.status === 'approved'

  if (loading) {
    return (
      <div className="page">
        <div className="page-wide col g12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ height: 80, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="page">
        <div className="page-narrow">
          <Banner kind="crit">{error}</Banner>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-wide">
        {/* Header */}
        <Link href="/dashboard" className="link row g6" style={{ marginBottom: 14, fontSize: 13, textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={15} aria-hidden />
          {t('backToDash')}
        </Link>

        <div className="row between wrap g16" style={{ marginBottom: 20 }}>
          <div>
            <div className="row g10" style={{ marginBottom: 6 }}>
              <h1 className="h-page">{report.examinationType}</h1>
              {report.caseKey && (
                <span className="badge badge-accent badge-sq mono" style={{ fontWeight: 700 }}>
                  CASE {report.caseKey}
                </span>
              )}
              {isApproved && (
                <span className="badge badge-approved">
                  <span className="dot" aria-hidden />
                  {t('statusApproved')}
                </span>
              )}
              {!isApproved && report.aiGenerated && (
                <span className="badge badge-ai">
                  <Icon name="sparkle" size={11} aria-hidden />
                  {t('aiDraftBadge')}
                </span>
              )}
            </div>

            {/* Patient info row */}
            {patient && (
              <div className="row g10 wrap" style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  {patient.firstName} {patient.lastName}
                </span>
                <span className="faint">·</span>
                <span className="faint mono" style={{ fontSize: 12 }}>{patient.pesel}</span>
                <span className="faint">·</span>
                <span className="faint">{patient.age} {lang === 'pl' ? 'lat' : 'yo'}, {patient.gender === 'F' ? (lang === 'pl' ? 'K' : 'F') : 'M'}</span>
              </div>
            )}

            <div className="faint row g8" style={{ fontSize: 12.5 }}>
              {report.analysisMode && (
                <span className="row g4">
                  <Icon name={report.analysisMode === 'image' ? 'image' : report.analysisMode === 'voice' ? 'mic' : 'layers'} size={13} aria-hidden />
                  {lang === 'pl'
                    ? { image: 'zdjęcie', voice: 'głos', multimodal: 'multimodal' }[report.analysisMode]
                    : { image: 'image', voice: 'voice', multimodal: 'multimodal' }[report.analysisMode]}
                </span>
              )}
              <span>{new Date(report.createdAt).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')}</span>
              {isApproved && report.approvedByName && (
                <span>{lang === 'pl' ? `zatwierdził(a): ${report.approvedByName}` : `approved by: ${report.approvedByName}`}</span>
              )}
              {isApproved && report.analysisMode && (
                <span className="row g4">
                  <Icon name="sparkle" size={12} aria-hidden />
                  {t('approvedSource')}: {
                    report.analysisMode === 'image' ? t('srcImage') :
                    report.analysisMode === 'voice' ? t('srcVoice') :
                    t('srcMulti')
                  }
                </span>
              )}
            </div>
          </div>

          {!isApproved && (
            <Btn
              variant="primary"
              size="lg"
              icon="check"
              disabled={!canApprove}
              title={!canApprove ? t('approveDisabled') : ''}
              onClick={() => setShowApproveModal(true)}
              type="button"
            >
              {t('approve')}
            </Btn>
          )}
        </div>

        {/* AI provenance banner */}
        {!isApproved && report.aiGenerated && (
          <div style={{ marginBottom: 12 }}>
            <Banner kind="info">
              <span className="row g6">
                <Icon name="sparkle" size={13} aria-hidden />
                {lang === 'pl' ? 'Wygenerowane przez AI — wymaga weryfikacji przed zatwierdzeniem.' : 'AI-generated — requires verification before approval.'}
              </span>
            </Banner>
          </div>
        )}
        {isApproved && report.aiGenerated && (
          <div style={{ marginBottom: 12 }}>
            <Banner kind="info">
              <span className="row g6">
                <Icon name="sparkle" size={13} aria-hidden />
                {lang === 'pl'
                  ? `Raport zatwierdzony${report.approvedByName ? ` — ${report.approvedByName}` : ''}${report.approvedAt ? ` · ${new Date(report.approvedAt).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-GB', { dateStyle: 'short', timeStyle: 'short' })}` : ''} · Źródło AI: ${report.analysisMode === 'image' ? 'zdjęcie' : report.analysisMode === 'voice' ? 'głos' : 'multimodal'}`
                  : `Approved${report.approvedByName ? ` — ${report.approvedByName}` : ''}${report.approvedAt ? ` · ${new Date(report.approvedAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}` : ''} · AI source: ${report.analysisMode}`}
              </span>
            </Banner>
          </div>
        )}

        {/* Banners */}
        {report.imageQuality === 'suboptimal' && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="warn" title={t('bSuboptimal')}>
              {lang === 'pl'
                ? 'Jakość obrazu jest suboptymalna. Wyniki mogą być niepełne.'
                : 'Image quality is suboptimal. Results may be incomplete.'}
            </Banner>
          </div>
        )}
        {report.imageQuality === 'non_diagnostic' && !manualMode && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="crit" title={t('bNonDiagnostic')} action={
              <Btn variant="secondary" size="sm" type="button" onClick={() => setManualMode(true)}>
                {t('continueNoAi')}
              </Btn>
            }>
              {lang === 'pl'
                ? 'Obraz jest niediagnostyczny. Analiza AI nie jest możliwa.'
                : 'Image is non-diagnostic. AI analysis is not possible.'}
            </Banner>
          </div>
        )}
        {/* Examination context card — clinical indication + comments */}
        {(report.clinicalIndication || report.comments || !isApproved) && (
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="eyebrow row g6" style={{ marginBottom: 14 }}>
              <Icon name="flask" size={14} aria-hidden />
              {lang === 'pl' ? 'Dane badania' : 'Examination context'}
            </div>
            <div className="col g14">
              <div>
                <label className="field-label" htmlFor="clinicalIndication">
                  {lang === 'pl' ? 'Wskazanie kliniczne' : 'Clinical indication'}
                  {!isApproved && <span className="opt"> ({lang === 'pl' ? 'opcjonalne' : 'optional'})</span>}
                </label>
                {isApproved ? (
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: report.clinicalIndication ? 'var(--text)' : 'var(--text-faint)' }}>
                    {report.clinicalIndication || (lang === 'pl' ? '—' : '—')}
                  </p>
                ) : (
                  <textarea
                    id="clinicalIndication"
                    className="textarea"
                    rows={2}
                    placeholder={lang === 'pl' ? 'Przepisz ze skierowania…' : 'Copy from referral…'}
                    defaultValue={report.clinicalIndication ?? ''}
                    onBlur={(e) => saveField('clinicalIndication', e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                )}
              </div>
              <div>
                <label className="field-label" htmlFor="radComments">
                  {lang === 'pl' ? 'Komentarz radiologa' : 'Radiologist comment'}
                  {!isApproved && <span className="opt"> ({lang === 'pl' ? 'opcjonalne' : 'optional'})</span>}
                </label>
                {isApproved ? (
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: report.comments ? 'var(--text)' : 'var(--text-faint)' }}>
                    {report.comments || '—'}
                  </p>
                ) : (
                  <textarea
                    id="radComments"
                    className="textarea"
                    rows={2}
                    placeholder={lang === 'pl' ? 'Uwagi przed analizą…' : 'Notes before analysis…'}
                    defaultValue={report.comments ?? ''}
                    onBlur={(e) => saveField('comments', e.target.value)}
                    style={{ fontSize: 13 }}
                  />
                )}
              </div>
              {savingField && (
                <div className="row g6 faint" style={{ fontSize: 12 }}>
                  <Icon name="loader" size={12} className="spin" aria-hidden />
                  {lang === 'pl' ? 'Zapisywanie…' : 'Saving…'}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="report-grid">
          {/* Main column */}
          <div className="col g20">
            {/* Fusion result (for multimodal) */}
            {report.fusionResult && (
              <Collapse title={t('fusionTitle')} sub={t('fusionSub')} defaultOpen icon="layers">
                <div style={{ padding: '16px' }}>
                  <FusionResultPanel result={report.fusionResult} lang={lang} />
                </div>
              </Collapse>
            )}

            {/* Report editor */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                <h2 className="h-sec">{t('formalReport')}</h2>
              </div>
              <div style={{ padding: 20 }}>
                <ReportEditor
                  report={report}
                  onChange={(updated) => setReport(updated as RadiologicalReport)}
                  readonly={isApproved && !manualMode}
                  lang={lang}
                  onEvidence={(f) => { setEvidenceFinding(f); setShowEvidenceModal(true) }}
                />
              </div>
            </div>

            {/* Quality Check */}
            {report.aiQualityCheck && (
              <Collapse title={t('qualityCheck')} icon="shield" defaultOpen>
                <div style={{ padding: 16 }}>
                  <QualityCheckPanel qc={report.aiQualityCheck} lang={lang} />
                </div>
              </Collapse>
            )}

            {/* AI Suggestions */}
            {(report.aiSuggestions?.length ?? 0) > 0 && (
              <Collapse title={t('aiSuggestions')} sub={t('aiSuggestionsHint')} icon="sparkle">
                <div style={{ padding: 16 }}>
                  <AiSuggestions
                    suggestions={report.aiSuggestions!}
                    lang={lang}
                    onInsert={(s) => {
                      if (!isApproved && s.canInsertIntoReport) {
                        // Add to report as a finding
                        const newFinding: Finding = {
                          id: `f-${Date.now()}`,
                          text: `${s.title}: ${s.rationale}`,
                          isDeviation: true,
                          confidence: s.confidence,
                          anatomicalLocation: '',
                        }
                        setReport((r) => r ? { ...r, findings: [...r.findings, newFinding] } : r)
                      }
                    }}
                  />
                </div>
              </Collapse>
            )}

            {/* Raw observations */}
            {(report.rawObservations?.length ?? 0) > 0 && (
              <Collapse title={t('rawObs')} sub={t('rawObsSub')}>
                <div style={{ padding: 16 }}>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {report.rawObservations!.map((o, i) => (
                      <li key={i} className="mono faint" style={{ fontSize: 12, marginBottom: 4 }}>{o}</li>
                    ))}
                  </ul>
                </div>
              </Collapse>
            )}
          </div>

          {/* Rail column */}
          <div className="report-rail col g16">
            {/* Image thumbnails */}
            {report.imageCount && report.imageCount > 0 && report.imageLabel && (
              <div className="card card-pad">
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  {lang === 'pl' ? 'Obrazy USG' : 'Ultrasound images'}
                </div>
                <div className="row wrap g8">
                  {Array.from({ length: report.imageCount }).map((_, i) => (
                    <div key={i} className="usg-thumb" style={{ width: 78, height: 60 }}>
                      <span className="usg-idx">{String(i + 1).padStart(2, '0')}</span>
                      <span className="usg-label">{report.imageLabel}_{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patient explanation (if approved) */}
            {isApproved && (
              <div className="card card-pad">
                <div className="h-sec row g8" style={{ marginBottom: 12 }}>
                  <Icon name="user" size={16} style={{ color: 'var(--accent-700)' }} aria-hidden />
                  {t('forPatient')}
                </div>
                {report.patientExplanation ? (
                  <div className="col g12">
                    <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                      {report.patientExplanation.plainLanguageSummary}
                    </p>
                    {report.patientExplanation.keyFindings.length > 0 && (
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>
                          {lang === 'pl' ? 'Kluczowe wyniki' : 'Key findings'}
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {report.patientExplanation.keyFindings.map((f, i) => (
                            <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {report.patientExplanation.nextSteps.length > 0 && (
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>
                          {lang === 'pl' ? 'Co dalej' : 'Next steps'}
                        </div>
                        <ol style={{ margin: 0, paddingLeft: 18 }}>
                          {report.patientExplanation.nextSteps.map((s, i) => (
                            <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {report.patientExplanation.followUp && (
                      <div className="row g8">
                        <Icon name="calendar" size={15} style={{ color: 'var(--text-faint)' }} aria-hidden />
                        <span className="muted" style={{ fontSize: 13 }}>{report.patientExplanation.followUp}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Btn
                    variant="secondary"
                    icon="sparkle"
                    size="sm"
                    className="btn-block"
                    onClick={async () => {
                      const expl = await apiClient.generatePatientExplanation({
                        reportId: report.id,
                        reportType: 'radiological',
                      })
                      setReport((r) => r ? { ...r, patientExplanation: expl } : r)
                    }}
                    type="button"
                  >
                    {t('genPatientExpl')}
                  </Btn>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve modal */}
      <Modal open={showApproveModal} onClose={() => setShowApproveModal(false)} title={t('confirmApproveTitle')}>
        <div style={{ padding: '20px 20px 0' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>{t('confirmApproveTitle')}</h2>
          <p className="muted" style={{ margin: 0 }}>{t('confirmApproveBody')}</p>
        </div>
        <div className="row g10" style={{ padding: 20, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setShowApproveModal(false)} type="button">
            {t('cancel')}
          </Btn>
          <Btn variant="primary" icon="check" loading={approving} onClick={handleApprove} type="button">
            {t('confirm')}
          </Btn>
        </div>
      </Modal>

      {/* Evidence modal */}
      <Modal open={showEvidenceModal} onClose={() => setShowEvidenceModal(false)} lg title={t('evidence')}>
        <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="row g8">
            <Icon name="eye" size={17} style={{ color: 'var(--accent-700)' }} aria-hidden />
            <span className="h-card">{t('evidence')}</span>
          </div>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setShowEvidenceModal(false)}
            aria-label={lang === 'en' ? 'Close' : 'Zamknij'}
          >
            <Icon name="x" size={16} aria-hidden />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <EvidenceViewer
            finding={evidenceFinding}
            imageLabel={report.imageLabel}
            imageCount={report.imageCount}
            lang={lang}
          />
        </div>
      </Modal>
    </div>
  )
}
