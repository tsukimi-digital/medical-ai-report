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
import { VoiceRecorder } from '@/components/voice-recorder'
import { QualityCheckPanel } from '@/components/quality-check-panel'
import type { MedicalReport, Patient } from '@/lib/types'

const NEW_VISIT_ID = 'new'

export default function VisitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { lang, t } = useI18n()
  const isNew = params.id === NEW_VISIT_ID

  const [report, setReport] = useState<MedicalReport | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [rawTranscription, setRawTranscription] = useState<string | null>(null)
  const [isProcessingReport, setIsProcessingReport] = useState(false)

  useEffect(() => {
    if (isNew) return
    apiClient.getMedReport(params.id)
      .then(({ report }) => {
        setReport(report)
        return apiClient.getPatient(report.patientId)
      })
      .then(({ patient }) => setPatient(patient))
      .catch(() => setError(lang === 'en' ? 'Visit not found.' : 'Nie znaleziono wizyty.'))
      .finally(() => setLoading(false))
  }, [params.id, lang, isNew])

  const handleVoiceRecording = async (blob: Blob, _mimeType: string) => {
    setTranscribing(true)
    setRawTranscription(null)
    setIsProcessingReport(false)
    try {
      // Phase 1: transcribe immediately
      const { transcription } = await apiClient.transcribeAudio(blob, lang)
      setRawTranscription(transcription)
      setTranscribing(false)
      setIsProcessingReport(true)

      if (!report) {
        // New visit — create the report shell first, then generate in parallel
        const { patients } = await apiClient.getPatients()
        const defaultPatient = patients[0]

        const { report: created } = await apiClient.createMedReport({
          patientId: defaultPatient?.id ?? 'p-anna',
          transcription,
        })

        // Phase 2: generate medical report AND patient explanation simultaneously
        const [draft] = await Promise.all([
          apiClient.generateReport({
            transcription,
            role: 'doctor',
            patientAge: defaultPatient?.age ?? 0,
            patientGender: (defaultPatient?.gender ?? 'F') as 'M' | 'F',
            language: lang,
          }),
          // Patient explanation generated concurrently (result applied below when draft arrives)
          apiClient.generatePatientExplanation({
            reportId: created.id,
            reportType: 'medical',
            transcription,
          }).catch(() => null), // non-fatal
        ])

        const { report: updated } = await apiClient.updateMedReport(created.id, {
          ...(draft as Partial<MedicalReport>),
          transcription,
        })
        setReport(updated)
        if (defaultPatient) setPatient(defaultPatient)
        router.push(`/visit/${updated.id}`)
      } else {
        // Existing visit — generate against known report
        const [draft, explanation] = await Promise.all([
          apiClient.generateReport({
            transcription,
            role: 'doctor',
            patientAge: patient?.age ?? 0,
            patientGender: (patient?.gender ?? 'F') as 'M' | 'F',
            language: lang,
            radiologicalReportId: report.radiologicalReportId ?? undefined,
          }),
          // Patient explanation generated simultaneously
          apiClient.generatePatientExplanation({
            reportId: report.id,
            reportType: 'medical',
            transcription,
          }).catch(() => null),
        ])

        const { report: updated } = await apiClient.updateMedReport(report.id, {
          ...(draft as Partial<MedicalReport>),
          transcription,
          ...(explanation ? { patientExplanation: explanation } : {}),
        })
        setReport(updated)
        setRawTranscription(null) // clear preview — editor now has the draft
      }
    } catch {
      setError(lang === 'en' ? 'Transcription failed.' : 'Transkrypcja nie powiodła się.')
    } finally {
      setTranscribing(false)
      setIsProcessingReport(false)
    }
  }

  const handleApprove = async () => {
    if (!report) return
    setApproving(true)
    try {
      const { report: updated } = await apiClient.approveMedReport(report.id)
      setReport(updated)
      setShowApproveModal(false)
    } catch {
      setError(lang === 'en' ? 'Failed to approve.' : 'Nie udało się zatwierdzić.')
    } finally {
      setApproving(false)
    }
  }

  const isApproved = report?.status === 'approved'
  const canApprove = report && report.anamnesis && report.diagnosis && report.recommendations

  if (loading) {
    return (
      <div className="page">
        <div className="page-narrow col g12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skel" style={{ height: 60, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error && !isNew) {
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
      <div className="page-narrow">
        <Link href="/dashboard" className="link row g6" style={{ marginBottom: 14, fontSize: 13, textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={15} aria-hidden />
          {t('backToDash')}
        </Link>

        <div className="row between wrap g16" style={{ marginBottom: 20 }}>
          <div>
            <div className="row g10" style={{ marginBottom: 4 }}>
              <h1 className="h-page">{t('visitTitle')}</h1>
              {report?.caseKey && (
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
              {!isApproved && report?.aiGenerated && (
                <span className="badge badge-ai">
                  <Icon name="sparkle" size={11} aria-hidden />
                  {t('aiDraftBadge')}
                </span>
              )}
            </div>
          </div>
          {!isApproved && report && (
            <Btn
              variant="primary"
              size="lg"
              icon="check"
              disabled={!canApprove}
              title={!canApprove ? t('approveDisabled') : ''}
              onClick={() => setShowApproveModal(true)}
              type="button"
            >
              {t('saveApprove')}
            </Btn>
          )}
        </div>

        {/* Transcription quality banners */}
        {report?.transcriptionQuality === 'partial' && !isApproved && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="warn">{t('bTranscPartial')} — {lang === 'en' ? 'check the recording before approving.' : 'sprawdź nagranie przed zatwierdzeniem.'}</Banner>
          </div>
        )}
        {report?.transcriptionQuality === 'poor' && !isApproved && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="crit">{t('bTranscPoor')} — {lang === 'en' ? 'verification required.' : 'weryfikacja wymagana.'}</Banner>
          </div>
        )}

        {isApproved && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="info">{t('reportReadonly')}</Banner>
          </div>
        )}

        {/* Voice recorder */}
        {!isApproved && (
          <div className="card card-pad-lg" style={{ marginBottom: 20 }}>
            <div className="h-sec row g8" style={{ marginBottom: 14 }}>
              <Icon name="mic" size={17} style={{ color: 'var(--accent-700)' }} aria-hidden />
              {t('recordVisit')}
            </div>
            {transcribing ? (
              <div className="row g10">
                <Icon name="loader" size={18} className="spin" aria-hidden />
                <span className="muted">{t('transcribing')}</span>
              </div>
            ) : isProcessingReport ? (
              <div className="col g10">
                {rawTranscription !== null && (
                  <div>
                    <label className="field-label" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {lang === 'en' ? 'Whisper Transcription — processing with AI…' : 'Transkrypcja Whisper — przetwarzanie przez AI…'}
                    </label>
                    <textarea
                      className="textarea"
                      readOnly
                      value={rawTranscription}
                      rows={3}
                      style={{ opacity: 0.7, resize: 'none', fontSize: 13 }}
                    />
                  </div>
                )}
                <div className="row g8" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  <Icon name="loader" size={14} className="spin" aria-hidden />
                  {lang === 'en' ? 'Claude is generating the report draft…' : 'Claude generuje szkic raportu…'}
                </div>
              </div>
            ) : (
              <VoiceRecorder onRecording={handleVoiceRecording} labelRecord={t('recordVisit')} labelStop={t('stopRec')} />
            )}
          </div>
        )}

        {/* Medical report form */}
        {report && (
          <div className="col g20">
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                <h2 className="h-sec">{t('medReport')}</h2>
              </div>
              <div style={{ padding: 20 }} className="col g16">
                <div>
                  <label className="field-label" htmlFor="anamnesis">{t('anamnesis')}</label>
                  <textarea
                    id="anamnesis"
                    className="textarea"
                    value={report.anamnesis}
                    readOnly={isApproved}
                    rows={4}
                    onChange={(e) => !isApproved && setReport({ ...report, anamnesis: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="diagnosis">{t('diagnosis')}</label>
                  <textarea
                    id="diagnosis"
                    className="textarea"
                    value={report.diagnosis}
                    readOnly={isApproved}
                    rows={3}
                    onChange={(e) => !isApproved && setReport({ ...report, diagnosis: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="recommendations">{t('recommendations')}</label>
                  <textarea
                    id="recommendations"
                    className="textarea"
                    value={report.recommendations}
                    readOnly={isApproved}
                    rows={3}
                    onChange={(e) => !isApproved && setReport({ ...report, recommendations: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Patient explanation */}
            {report.patientExplanation && (
              <Collapse title={t('patientPanel')} sub={t('patientPanelBadge')} icon="user" defaultOpen>
                <div style={{ padding: 16 }} className="col g12">
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    {report.patientExplanation.plainLanguageSummary}
                  </p>
                  {report.patientExplanation.keyFindings.length > 0 && (
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 8 }}>{t('keyFindings')}</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {report.patientExplanation.keyFindings.map((f, i) => (
                          <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.patientExplanation.nextSteps.length > 0 && (
                    <div>
                      <div className="eyebrow" style={{ marginBottom: 8 }}>{t('nextSteps')}</div>
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
              </Collapse>
            )}

            {/* Quality Check */}
            {report.aiQualityCheck && (
              <Collapse title={t('qualityCheck')} icon="shield">
                <div style={{ padding: 16 }}>
                  <QualityCheckPanel qc={report.aiQualityCheck} lang={lang} />
                </div>
              </Collapse>
            )}
          </div>
        )}
      </div>

      {/* Approve modal */}
      <Modal open={showApproveModal} onClose={() => setShowApproveModal(false)} title={t('confirmVisitTitle')}>
        <div style={{ padding: '20px 20px 0' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>{t('confirmVisitTitle')}</h2>
          <p className="muted" style={{ margin: 0 }}>{t('confirmVisitBody')}</p>
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
    </div>
  )
}
