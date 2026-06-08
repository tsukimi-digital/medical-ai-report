'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import { PatientSelector } from '@/components/patient-selector'
import { ExaminationTypeSelect } from '@/components/examination-type-select'
import { ExaminationContextFields } from '@/components/examination-context-fields'
import { ImageUploader } from '@/components/image-uploader'
import { VoiceRecorder } from '@/components/voice-recorder'
import type { Patient, ExaminationContext, AnalysisMode } from '@/lib/types'

type GenMode = 'image' | 'voice' | 'multimodal'

export default function NewExaminationPage() {
  const router = useRouter()
  const { lang, t } = useI18n()

  const [patients, setPatients] = useState<Patient[]>([])
  const [patient, setPatient] = useState<Patient | null>(null)
  const [examType, setExamType] = useState<string | null>(null)
  const [indication, setIndication] = useState('')
  const [comments, setComments] = useState('')
  const [context, setContext] = useState<ExaminationContext>({})
  const [images, setImages] = useState<File[]>([])
  const [voiceBlob, setVoiceBlob] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const [mode, setMode] = useState<GenMode>('image')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [rawTranscription, setRawTranscription] = useState<string | null>(null)
  const [isProcessingReport, setIsProcessingReport] = useState(false)

  useEffect(() => {
    apiClient.getPatients().then(({ patients }) => setPatients(patients))
  }, [])

  const canGenImage = images.length > 0
  const canGenVoice = !!voiceBlob
  const canGenMulti = canGenImage && canGenVoice

  const buildImageFormData = () => {
    const formData = new FormData()
    images.forEach((img) => formData.append('images', img))
    formData.append('examinationType', examType!)
    formData.append('clinicalIndication', indication)
    formData.append('examinationContext', JSON.stringify(context))
    formData.append('comments', comments)
    formData.append('patientAge', String(patient!.age))
    formData.append('patientGender', patient!.gender)
    formData.append('language', lang)
    return formData
  }

  const handleGenerate = async () => {
    if (!patient || !examType) {
      setError(lang === 'en' ? 'Please select a patient and examination type.' : 'Wybierz pacjenta i typ badania.')
      return
    }
    if (mode === 'multimodal' && !canGenMulti) {
      setError(t('multiNeedsBoth'))
      return
    }
    setError(null)
    setManualMode(false)
    setRawTranscription(null)
    setIsProcessingReport(false)
    setLoading(true)
    try {
      // Create draft report
      const { report } = await apiClient.createRadReport({
        patientId: patient.id,
        examinationType: examType,
        clinicalIndication: indication || undefined,
        examinationContext: Object.keys(context).length > 0 ? context : undefined,
        comments: comments || undefined,
        analysisMode: mode as AnalysisMode,
      })

      if (mode === 'image') {
        // ── Image-only flow ──────────────────────────────────────────────────
        const imageAnalysis = await apiClient.analyzeImage(buildImageFormData())

        if ('fallback' in imageAnalysis && (imageAnalysis as unknown as { fallback: boolean; error: string }).fallback) {
          const fb = imageAnalysis as unknown as { fallback: boolean; error: string }
          setError(fb.error)
          setManualMode(true)
          setLoading(false)
          return
        }

        await apiClient.updateRadReport(report.id, {
          findings: imageAnalysis.findings,
          lowConfidenceFindings: imageAnalysis.lowConfidenceFindings,
          impression: imageAnalysis.impression,
          imagingLimitations: imageAnalysis.imagingLimitations ?? undefined,
          imageQuality: imageAnalysis.imageQuality,
          rawObservations: imageAnalysis.rawObservations,
          aiSuggestions: imageAnalysis.aiSuggestions,
          aiQualityCheck: imageAnalysis.aiQualityCheck,
          imageCount: images.length,
          aiGenerated: true,
        })

      } else if (mode === 'voice') {
        // ── Voice-only two-phase flow ────────────────────────────────────────
        // Phase 1: transcribe → show raw transcription immediately
        const { transcription } = await apiClient.transcribeAudio(voiceBlob!.blob, lang)
        setRawTranscription(transcription)
        setIsProcessingReport(true)
        setLoading(false) // unblock UI — show raw preview

        // Phase 2: generate report in background
        try {
          const draft = await apiClient.generateReport({
            transcription,
            role: 'radiologist',
            examinationType: examType,
            examinationContext: Object.keys(context).length > 0 ? context : undefined,
            patientAge: patient.age,
            patientGender: patient.gender as 'M' | 'F',
            language: lang,
          }) as Partial<import('@/lib/types').RadiologicalReport>
          await apiClient.updateRadReport(report.id, {
            ...draft,
            aiGenerated: true,
          })
        } finally {
          setIsProcessingReport(false)
        }
        router.push(`/examination/${report.id}`)
        return

      } else if (mode === 'multimodal') {
        // ── Multimodal flow — parallel image+voice analysis ──────────────────
        setIsProcessingReport(true)
        setLoading(false)

        const [imageResult, voiceResult] = await Promise.all([
          apiClient.analyzeImage(buildImageFormData()),
          apiClient.transcribeAudio(voiceBlob!.blob, lang).then(async ({ transcription }) => {
            setRawTranscription(transcription)
            const voiceDraft = await apiClient.generateReport({
              transcription,
              role: 'radiologist',
              examinationType: examType,
              examinationContext: Object.keys(context).length > 0 ? context : undefined,
              patientAge: patient!.age,
              patientGender: patient!.gender as 'M' | 'F',
              language: lang,
            }) as Partial<import('@/lib/types').RadiologicalReport>
            return { transcription, findings: voiceDraft.findings ?? [] }
          }),
        ])

        const fusionResult = await apiClient.fuseFindings({
          findingsFromImages: imageResult.findings ?? [],
          findingsFromSpeech: voiceResult.findings,
        })

        await apiClient.updateRadReport(report.id, {
          findings: fusionResult.confirmedFindings,
          fusionResult,
          impression: imageResult.impression,
          imagingLimitations: imageResult.imagingLimitations ?? undefined,
          imageQuality: imageResult.imageQuality,
          rawObservations: imageResult.rawObservations,
          aiSuggestions: imageResult.aiSuggestions,
          aiQualityCheck: imageResult.aiQualityCheck,
          imageCount: images.length,
          aiGenerated: true,
        })

        setIsProcessingReport(false)
      }

      router.push(`/examination/${report.id}`)
    } catch {
      setError(lang === 'en' ? 'Failed to create report.' : 'Nie udało się utworzyć raportu.')
      setLoading(false)
      setIsProcessingReport(false)
    }
  }

  return (
    <div className="page">
      <div className="page-narrow">
        <Link href="/dashboard" className="link row g6" style={{ marginBottom: 14, fontSize: 13, textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={15} aria-hidden />
          {t('backToDash')}
        </Link>
        <h1 className="h-page" style={{ marginBottom: 4 }}>{t('newExamTitle')}</h1>
        <p className="lead" style={{ marginBottom: 22 }}>
          {apiClient.getSessionUser()?.name} · {new Date().toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')}
        </p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="crit" action={manualMode ? (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => { setManualMode(false); setError(null) }}
              >
                {lang === 'en' ? 'Enter manually' : 'Wprowadź ręcznie'}
              </button>
            ) : undefined}>
              {error}
            </Banner>
          </div>
        )}

        <div className="card card-pad-lg col g20">
          {/* Patient */}
          <div>
            <label className="field-label">{t('selectPatient')}</label>
            <PatientSelector
              value={patient}
              onChange={setPatient}
              patients={patients}
              placeholder={t('selectPatientPh')}
              emptyText={t('noResults')}
              lang={lang}
            />
            <Link href="/patients/new" className="link row g6" style={{ fontSize: 12.5, marginTop: 8, textDecoration: 'none' }}>
              <Icon name="userPlus" size={14} aria-hidden />
              {t('addPatient')}
            </Link>
          </div>

          {/* Exam type */}
          <div>
            <label className="field-label">{t('examType')}</label>
            <ExaminationTypeSelect
              value={examType}
              onChange={setExamType}
              placeholder={t('examTypePh')}
              emptyText={t('noResults')}
              lang={lang}
            />
          </div>

          {/* Contextual fields */}
          <ExaminationContextFields
            examType={examType}
            context={context}
            onChange={setContext}
            lang={lang}
          />

          {/* Clinical indication */}
          <div>
            <label className="field-label" htmlFor="indication">
              {t('clinicalIndication')}
              <span className="opt"> ({t('optional')})</span>
            </label>
            <textarea
              id="indication"
              className="textarea"
              placeholder={t('clinicalIndicationPh')}
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
            />
          </div>

          {/* Generate mode */}
          <div>
            <div className="field-label">{t('generateMode')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {(
                [
                  { mode: 'image',     icon: 'image',  titleKey: 'genImage',  subKey: 'genImageSub',  disabled: false },
                  { mode: 'voice',     icon: 'mic',    titleKey: 'genVoice',  subKey: 'genVoiceSub',  disabled: false },
                  { mode: 'multimodal',icon: 'layers', titleKey: 'genMulti',  subKey: 'genMultiSub',  disabled: false },
                ] as const
              ).map(({ mode: m, icon, titleKey, subKey }) => (
                <button
                  key={m}
                  type="button"
                  className="card"
                  onClick={() => setMode(m)}
                  style={{
                    padding: 16,
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor: mode === m ? 'var(--accent-600)' : 'var(--border)',
                    background: mode === m ? 'var(--accent-tint)' : 'var(--surface)',
                    transition: 'border-color 0.12s, background 0.12s',
                  }}
                  aria-pressed={mode === m}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: mode === m ? 'var(--accent)' : 'var(--accent-tint)', color: mode === m ? '#fff' : 'var(--accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <Icon name={icon} size={20} aria-hidden />
                  </div>
                  <div className="h-card" style={{ marginBottom: 2 }}>{t(titleKey)}</div>
                  <div className="faint" style={{ fontSize: 12 }}>{t(subKey)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image upload */}
          {(mode === 'image' || mode === 'multimodal') && (
            <div>
              <label className="field-label">{t('uploadImages')}</label>
              <ImageUploader
                onFiles={setImages}
                label={t('uploadImages')}
                hint={t('uploadHint')}
                uploadCta={t('uploadCta')}
              />
            </div>
          )}

          {/* Voice recording */}
          {(mode === 'voice' || mode === 'multimodal') && (
            <div>
              <label className="field-label">{t('genVoice')}</label>
              <VoiceRecorder
                onRecording={(blob, mimeType) => setVoiceBlob({ blob, mimeType })}
                labelRecord={t('genVoice')}
                labelStop={t('stopRec')}
              />
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="field-label" htmlFor="comments">
              {t('comments')}
              <span className="opt"> ({t('optional')})</span>
            </label>
            <textarea
              id="comments"
              className="textarea"
              placeholder={t('commentsPh')}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          {/* Raw transcription preview — shown immediately after Whisper returns */}
          {rawTranscription !== null && (
            <div>
              <label className="field-label" style={{ color: 'var(--text-muted)' }}>
                {isProcessingReport
                  ? (lang === 'en' ? 'Whisper Transcription — processing with AI…' : 'Transkrypcja Whisper — przetwarzanie przez AI…')
                  : (lang === 'en' ? 'Whisper Transcription' : 'Transkrypcja Whisper')}
              </label>
              <textarea
                className="textarea"
                readOnly
                value={rawTranscription}
                rows={4}
                style={{ opacity: isProcessingReport ? 0.7 : 1, resize: 'none' }}
              />
              {isProcessingReport && (
                <div className="row g8" style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                  <Icon name="loader" size={14} className="spin" aria-hidden />
                  {lang === 'en' ? 'Claude is generating the report draft…' : 'Claude generuje szkic raportu…'}
                </div>
              )}
            </div>
          )}

          <Btn
            variant="primary"
            size="lg"
            icon="sparkle"
            onClick={handleGenerate}
            loading={loading || isProcessingReport}
            disabled={!patient || !examType || isProcessingReport}
            className="btn-block"
            type="button"
          >
            {t('analyzing')}
          </Btn>
        </div>
      </div>
    </div>
  )
}
