'use client'

import { useState, useRef, useCallback } from 'react'
import { Icon } from './ui/icon'
import { Btn } from './ui/button'
import { useI18n } from '@/lib/i18n/index'

type RecorderState = 'idle' | 'recording' | 'stopped'

type VoiceRecorderProps = {
  onRecording: (blob: Blob, mimeType: string) => void
  disabled?: boolean
  labelRecord?: string
  labelStop?: string
}

function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ]
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return 'audio/webm'
}

export function VoiceRecorder({
  onRecording,
  disabled,
  labelRecord,
  labelStop,
}: VoiceRecorderProps) {
  const { t } = useI18n()
  const [state, setState] = useState<RecorderState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const blobRef = useRef<Blob | null>(null)

  const startRecording = useCallback(async () => {
    setError(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1 },
      })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      const mr = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        blobRef.current = blob
        setAudioUrl(URL.createObjectURL(blob))
        setState('stopped')
        streamRef.current?.getTracks().forEach((t) => t.stop())
      }

      mr.start(250)
      setState('recording')
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch (err) {
      setError(true)
      setState('idle')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }, [])

  const sendRecording = useCallback(() => {
    if (!blobRef.current) return
    const mimeType = getSupportedMimeType()
    onRecording(blobRef.current, mimeType)
  }, [onRecording])

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setState('idle')
    setDuration(0)
    blobRef.current = null
  }, [audioUrl])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div>
      {state === 'idle' && (
        <Btn
          variant="secondary"
          icon="mic"
          onClick={startRecording}
          disabled={disabled}
          type="button"
        >
          {labelRecord ?? t('genVoice')}
        </Btn>
      )}

      {state === 'recording' && (
        <div className="panel row g12" style={{ padding: '12px 14px', borderColor: 'var(--crit-bd)' }}>
          <span className="pulse-dot" aria-label={t('recording')} />
          <div className="wave" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="mono faint" style={{ fontSize: 12 }}>{formatDuration(duration)}</span>
          <div className="grow" />
          <Btn variant="danger" size="sm" icon="x" onClick={stopRecording} type="button">
            {labelStop ?? t('stopRec')}
          </Btn>
        </div>
      )}

      {state === 'stopped' && audioUrl && (
        <div className="panel col g10" style={{ padding: '12px 14px' }}>
          <div className="row g10">
            <Icon name="waveform" size={16} style={{ color: 'var(--accent-700)' }} aria-hidden />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t('recReady')}</span>
            <span className="faint mono" style={{ fontSize: 12 }}>{formatDuration(duration)}</span>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio src={audioUrl} controls style={{ width: '100%', height: 36 }} aria-label={t('recPreview')} />
          <div className="row g8">
            <Btn variant="primary" size="sm" icon="upload" onClick={sendRecording} type="button">
              {t('recSend')}
            </Btn>
            <Btn variant="ghost" size="sm" onClick={resetRecording} type="button">
              {t('recReset')}
            </Btn>
          </div>
        </div>
      )}

      {error && (
        <div className="faint" style={{ fontSize: 12, color: 'var(--crit-text)', marginTop: 6 }} role="alert">
          {t('micError')}
        </div>
      )}
    </div>
  )
}
