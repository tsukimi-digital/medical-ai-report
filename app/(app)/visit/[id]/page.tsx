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
import { GenerationProgress } from '@/components/generation-progress'
import { QualityCheckPanel } from '@/components/quality-check-panel'
import { PatientSelector } from '@/components/patient-selector'
import { ReportSelector } from '@/components/report-selector'
import type { MedicalReport, Patient, RadiologicalReport, PatientExplanation } from '@/lib/types'

const NEW_VISIT_ID = 'new'

export default function VisitDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { lang, t, L } = useI18n()
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

  // New-visit patient & rad report selection
  const [allPatients, setAllPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientRadReports, setPatientRadReports] = useState<RadiologicalReport[]>([])
  const [selectedRadReport, setSelectedRadReport] = useState<RadiologicalReport | null>(null)

  // Sidebar: radiological report context for existing visits
  const [radReportContext, setRadReportContext] = useState<RadiologicalReport | null>(null)

  // Editable patient explanation (local state for pre-approval editing)
  const [editedExplanation, setEditedExplanation] = useState<PatientExplanation | null>(null)

  useEffect(() => {
    if (isNew) {
      apiClient.getPatients().then(({ patients }) => setAllPatients(patients)).catch(() => {})
      return
    }
    apiClient.getMedReport(params.id)
      .then(({ report }) => {
        setReport(report)
        if (report.patientExplanation) setEditedExplanation(report.patientExplanation)
        const patientFetch = apiClient.getPatient(report.patientId).then(({ patient }) => setPatient(patient))
        const radFetch = report.radiologicalReportId
          ? apiClient.getRadReport(report.radiologicalReportId).then(({ report: r }) => setRadReportContext(r)).catch(() => {})
          : Promise.resolve()
        return Promise.all([patientFetch, radFetch])
      })
      .catch(() => setError(lang === 'en' ? 'Visit not found.' : 'Nie znaleziono wizyty.'))
      .finally(() => setLoading(false))
  }, [params.id, lang, isNew])

  useEffect(() => {
    if (!selectedPatient) { setPatientRadReports([]); setSelectedRadReport(null); return }
    apiClient.getRadReports(selectedPatient.id)
      .then(({ reports }) => setPatientRadReports(reports.filter(r => r.status === 'approved')))
      .catch(() => {})
  }, [selectedPatient])

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
        // New visit — use the patient selected in the UI
        const chosenPatient = selectedPatient ?? allPatients[0]

        const { report: created } = await apiClient.createMedReport({
          patientId: chosenPatient?.id ?? 'p-anna',
          transcription,
          ...(selectedRadReport ? { radiologicalReportId: selectedRadReport.id } : {}),
        })

        // Phase 2: generate medical report AND patient explanation simultaneously
        const [draft] = await Promise.all([
          apiClient.generateReport({
            transcription,
            role: 'doctor',
            patientAge: chosenPatient?.age ?? 0,
            patientGender: (chosenPatient?.gender ?? 'F') as 'M' | 'F',
            language: lang,
            ...(selectedRadReport ? { radiologicalReportId: selectedRadReport.id } : {}),
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
        if (chosenPatient) setPatient(chosenPatient)
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
        if (updated.patientExplanation) setEditedExplanation(updated.patientExplanation)
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
      // Merge editedExplanation into report before approving
      if (editedExplanation && editedExplanation !== report.patientExplanation) {
        await apiClient.updateMedReport(report.id, { patientExplanation: editedExplanation })
      }
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
      <div className={report && !isNew ? 'page-wide' : 'page-narrow'}>
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
              {isApproved && (
                <span className="row g4 faint" style={{ fontSize: 12 }}>
                  <Icon name="sparkle" size={12} aria-hidden />
                  {t('approvedSource')}: {t('srcVoice')}
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

        {/* New visit: patient + rad report selectors */}
        {isNew && !report && (
          <div className="card card-pad" style={{ marginBottom: 20 }}>
            <div className="col g16">
              <div>
                <label className="field-label">{t('selectPatient')}</label>
                <PatientSelector
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                  patients={allPatients}
                  placeholder={t('selectPatientPh')}
                  lang={lang}
                />
              </div>
              {selectedPatient && (
                <div>
                  <label className="field-label">
                    {t('selectRadReport')}
                    <span className="opt"> · {t('optional')}</span>
                  </label>
                  <ReportSelector
                    value={selectedRadReport}
                    onChange={setSelectedRadReport}
                    reports={patientRadReports}
                    placeholder={t('selectRadReport')}
                    emptyText={t('noRadReport')}
                    lang={lang}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar: radiological report context (existing visits with linked rad report) */}
        {!isNew && radReportContext && (
          <div style={{ marginBottom: 20 }}>
            <Collapse title={t('radContext')} icon="image" defaultOpen>
              <div style={{ padding: 16 }} className="col g12">
                {radReportContext.classification && (
                  <div className="panel row g8" style={{ padding: '7px 11px', background: 'var(--accent-tint)', borderColor: 'var(--accent-tint-2)' }}>
                    <Icon name="target" size={15} style={{ color: 'var(--accent-800)' }} aria-hidden />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--accent-800)' }}>
                      {radReportContext.classification.name} {radReportContext.classification.value}{' '}
                      <span style={{ fontWeight: 400, fontSize: 11.5 }}>· {L(radReportContext.classification.label)}</span>
                    </span>
                  </div>
                )}
                {radReportContext.impression && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>
                      {lang === 'pl' ? 'Wnioski' : 'Impression'}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55 }}>{radReportContext.impression}</p>
                  </div>
                )}
                {radReportContext.findings.length > 0 && (
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>
                      {lang === 'pl' ? 'Znaleziska' : 'Findings'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {radReportContext.findings.map((f, i) => (
                        <li key={i} style={{ fontSize: 12.5, marginBottom: 4, color: f.isDeviation ? 'var(--warn-text)' : 'inherit' }}>
                          {f.text}
                          {f.anatomicalLocation && <span className="faint"> — {f.anatomicalLocation}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Collapse>
          </div>
        )}

        {/* Voice recorder */}
        {!isApproved && (!isNew || selectedPatient) && (
          <div className="card card-pad-lg" style={{ marginBottom: 20 }}>
            <div className="h-sec row g8" style={{ marginBottom: 14 }}>
              <Icon name="mic" size={17} style={{ color: 'var(--accent-700)' }} aria-hidden />
              {t('recordVisit')}
            </div>
            {transcribing || isProcessingReport ? (
              <div className="col g16">
                <GenerationProgress
                  steps={[
                    { label: t('stepTranscription'), done: !transcribing },
                    { label: t('stepStructuring'), done: false },
                  ]}
                />
                {rawTranscription !== null && (
                  <div className="panel fade-in" style={{ overflow: 'hidden' }}>
                    <div className="row g8" style={{ padding: '9px 13px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                      <Icon name="waveform" size={15} style={{ color: 'var(--accent-700)' }} aria-hidden />
                      <span className="h-card" style={{ fontSize: 12.5 }}>{t('rawTranscript')}</span>
                      <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>Whisper · {lang}</span>
                    </div>
                    <div className="mono" style={{ padding: '12px 14px', fontSize: 12, lineHeight: 1.7, color: 'var(--text-muted)' }}>{rawTranscription}</div>
                  </div>
                )}
              </div>
            ) : (
              <VoiceRecorder onRecording={handleVoiceRecording} labelRecord={t('recordVisit')} labelStop={t('stopRec')} />
            )}
          </div>
        )}

        {/* Medical report form + patient draft — two columns like the prototype */}
        {report && (
          <div className="col g20">
            <div className="visit-grid">
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="row g8" style={{ padding: '13px 16px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                <Icon name="stetho" size={17} style={{ color: 'var(--accent-700)' }} aria-hidden />
                <h2 className="h-card" style={{ margin: 0 }}>{t('medReport')}</h2>
              </div>
              <div style={{ padding: 18 }} className="col g16">
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
                  {!isApproved && report.uncertainItems && report.uncertainItems.length > 0 && (
                    <div className="col g4" style={{ marginTop: 8 }}>
                      <div className="eyebrow" style={{ fontSize: 11 }}>
                        {lang === 'pl' ? 'Wymaga weryfikacji' : 'Needs verification'}
                      </div>
                      {report.uncertainItems.map((item, i) => (
                        <div key={i} className="row g6" style={{ fontSize: 12, color: 'var(--warn-text)' }}>
                          <span>⚠</span><span>[WYMAGA WERYFIKACJI] {item}</span>
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* Patient draft panel — prototype PatientDraft */}
            {(report.patientExplanation || editedExplanation) && (
              <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div className="row g8" style={{ padding: '13px 16px', background: 'var(--accent-tint)', borderBottom: '1px solid var(--accent-tint-2)' }}>
                  <Icon name="heart" size={17} style={{ color: 'var(--accent-800)' }} aria-hidden />
                  <h2 className="h-card" style={{ margin: 0, color: 'var(--accent-800)' }}>{t('patientPanel')}</h2>
                  {!isApproved && (
                    <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                      <Icon name="edit" size={11} aria-hidden />
                      {t('editableDraft')}
                    </span>
                  )}
                </div>
                <div className="col g16" style={{ padding: 18 }}>
                  <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.5, display: 'flex', gap: 7 }}>
                    <Icon name="sparkle" size={13} style={{ flex: 'none', marginTop: 1, color: 'var(--accent-700)' }} aria-hidden />
                    {t('patientPanelBadge')}
                  </div>
                  {!isApproved && editedExplanation ? (
                    <>
                      <div>
                        <label className="field-label">{t('summaryLabel')}</label>
                        <textarea
                          className="textarea"
                          rows={3}
                          value={editedExplanation.plainLanguageSummary}
                          onChange={(e) =>
                            setEditedExplanation({ ...editedExplanation, plainLanguageSummary: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('keyFindings')}</div>
                        <ul className="col g6" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {editedExplanation.keyFindings.map((f, i) => (
                            <li key={i} className="row g8" style={{ alignItems: 'flex-start' }}>
                              <span aria-hidden style={{ marginTop: 6 }}>
                                <Icon name="dot" size={8} style={{ color: 'var(--accent-600)', flex: 'none' }} aria-hidden />
                              </span>
                              <input
                                className="input"
                                value={f}
                                style={{ fontSize: 13, padding: '6px 10px' }}
                                onChange={(e) => {
                                  const updated = [...editedExplanation.keyFindings]
                                  updated[i] = e.target.value
                                  setEditedExplanation({ ...editedExplanation, keyFindings: updated })
                                }}
                              />
                              <button
                                type="button"
                                className="iconbtn"
                                style={{ width: 30, height: 30, flex: 'none' }}
                                title={t('removeItem')}
                                aria-label={t('removeItem')}
                                onClick={() => setEditedExplanation({ ...editedExplanation, keyFindings: editedExplanation.keyFindings.filter((_, j) => j !== i) })}
                              >
                                <Icon name="trash" size={14} aria-hidden />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className="link row g6"
                          style={{ fontSize: 12, marginTop: editedExplanation.keyFindings.length > 0 ? 8 : 2 }}
                          onClick={() => setEditedExplanation({ ...editedExplanation, keyFindings: [...editedExplanation.keyFindings, ''] })}
                        >
                          <Icon name="plus" size={13} aria-hidden />
                          {t('addItem')}
                        </button>
                      </div>
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('nextSteps')}</div>
                        <ol className="col g6" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                          {editedExplanation.nextSteps.map((s, i) => (
                            <li key={i} className="row g8" style={{ alignItems: 'flex-start' }}>
                              <span aria-hidden style={{ marginTop: 6, width: 18, height: 18, borderRadius: 99, background: 'var(--accent-tint)', color: 'var(--accent-800)', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{i + 1}</span>
                              <input
                                className="input"
                                value={s}
                                style={{ fontSize: 13, padding: '6px 10px' }}
                                onChange={(e) => {
                                  const updated = [...editedExplanation.nextSteps]
                                  updated[i] = e.target.value
                                  setEditedExplanation({ ...editedExplanation, nextSteps: updated })
                                }}
                              />
                              <button
                                type="button"
                                className="iconbtn"
                                style={{ width: 30, height: 30, flex: 'none' }}
                                title={t('removeItem')}
                                aria-label={t('removeItem')}
                                onClick={() => setEditedExplanation({ ...editedExplanation, nextSteps: editedExplanation.nextSteps.filter((_, j) => j !== i) })}
                              >
                                <Icon name="trash" size={14} aria-hidden />
                              </button>
                            </li>
                          ))}
                        </ol>
                        <button
                          type="button"
                          className="link row g6"
                          style={{ fontSize: 12, marginTop: editedExplanation.nextSteps.length > 0 ? 8 : 2 }}
                          onClick={() => setEditedExplanation({ ...editedExplanation, nextSteps: [...editedExplanation.nextSteps, ''] })}
                        >
                          <Icon name="plus" size={13} aria-hidden />
                          {t('addItem')}
                        </button>
                      </div>
                      <div>
                        <div className="eyebrow" style={{ marginBottom: 8 }}>{t('followUp')}</div>
                        <div className="row g8">
                          <Icon name="calendar" size={15} style={{ color: 'var(--accent-700)', flex: 'none', marginTop: 9 }} aria-hidden />
                          <input
                            className="input"
                            value={editedExplanation.followUp ?? ''}
                            style={{ fontSize: 13 }}
                            onChange={(e) =>
                              setEditedExplanation({ ...editedExplanation, followUp: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="field-label">{t('summaryLabel')}</label>
                        <div className="panel" style={{ padding: '10px 12px', fontSize: 13.5, lineHeight: 1.6, background: 'var(--surface-2)' }}>
                          {(report.patientExplanation ?? editedExplanation)?.plainLanguageSummary}
                        </div>
                      </div>
                      {((report.patientExplanation ?? editedExplanation)?.keyFindings.length ?? 0) > 0 && (
                        <div>
                          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('keyFindings')}</div>
                          <ul className="col g6" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {(report.patientExplanation ?? editedExplanation)?.keyFindings.map((f, i) => (
                              <li key={i} className="row g8">
                                <Icon name="dot" size={8} style={{ color: 'var(--accent-600)', flex: 'none' }} aria-hidden />
                                <span style={{ fontSize: 13 }}>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {((report.patientExplanation ?? editedExplanation)?.nextSteps.length ?? 0) > 0 && (
                        <div>
                          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('nextSteps')}</div>
                          <ol className="col g6" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {(report.patientExplanation ?? editedExplanation)?.nextSteps.map((s, i) => (
                              <li key={i} className="row g8">
                                <span aria-hidden style={{ width: 18, height: 18, borderRadius: 99, background: 'var(--accent-tint)', color: 'var(--accent-800)', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{i + 1}</span>
                                <span style={{ fontSize: 13 }}>{s}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {(report.patientExplanation ?? editedExplanation)?.followUp && (
                        <div>
                          <div className="eyebrow" style={{ marginBottom: 8 }}>{t('followUp')}</div>
                          <div className="panel row g8" style={{ padding: '10px 12px', background: 'var(--surface-2)' }}>
                            <Icon name="calendar" size={15} style={{ color: 'var(--accent-700)', flex: 'none' }} aria-hidden />
                            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{(report.patientExplanation ?? editedExplanation)?.followUp}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
            </div>

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
