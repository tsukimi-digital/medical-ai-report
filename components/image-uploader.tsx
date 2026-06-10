'use client'

import { useRef, useState, useCallback } from 'react'
import { Icon } from './ui/icon'
import { useI18n } from '@/lib/i18n/index'

type ImageUploaderProps = {
  onFiles: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  maxSizeBytes?: number
  label?: string
  hint?: string
  uploadCta?: string
}

const MAX_FILES = 5
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export function ImageUploader({
  onFiles,
  disabled,
  maxFiles = MAX_FILES,
  maxSizeBytes = MAX_SIZE,
  label: labelProp,
  hint: hintProp,
  uploadCta: uploadCtaProp,
}: ImageUploaderProps) {
  const { lang, t } = useI18n()
  const label = labelProp ?? t('uploadImages')
  const hint = hintProp ?? t('uploadHint')
  const uploadCta = uploadCtaProp ?? t('uploadCta')
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null)
      const arr = Array.from(files)
      if (arr.length > maxFiles) {
        setError(lang === 'en' ? `Maximum ${maxFiles} files.` : `Maksymalnie ${maxFiles} plików.`)
        return
      }
      const oversized = arr.find((f) => f.size > maxSizeBytes)
      if (oversized) {
        const mb = maxSizeBytes / 1024 / 1024
        setError(
          lang === 'en'
            ? `File "${oversized.name}" exceeds ${mb} MB.`
            : `Plik „${oversized.name}" przekracza ${mb} MB.`,
        )
        return
      }
      const notImage = arr.find((f) => !f.type.startsWith('image/'))
      if (notImage) {
        setError(
          lang === 'en'
            ? `File "${notImage.name}" is not an image.`
            : `Plik „${notImage.name}" nie jest obrazem.`,
        )
        return
      }
      const urls = arr.map((f) => ({ url: URL.createObjectURL(f), name: f.name }))
      setPreviews(urls)
      onFiles(arr)
    },
    [maxFiles, maxSizeBytes, onFiles, lang],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      processFiles(e.dataTransfer.files)
    },
    [disabled, processFiles],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files)
  }

  const removePreview = (idx: number) => {
    URL.revokeObjectURL(previews[idx].url)
    const next = previews.filter((_, i) => i !== idx)
    setPreviews(next)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
        aria-label={label}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${label}: ${hint}`}
        className={`panel col center g8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600`}
        style={{
          padding: '22px 16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          borderStyle: dragging ? 'dashed' : 'solid',
          borderColor: dragging ? 'var(--accent-600)' : 'var(--border-strong)',
          background: dragging ? 'var(--accent-tint)' : 'var(--surface-2)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Icon name="upload" size={22} style={{ color: 'var(--accent-700)' }} aria-hidden />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{uploadCta}</div>
          <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>{hint}</div>
        </div>
      </div>

      {error && (
        <div className="faint" style={{ fontSize: 12, color: 'var(--crit-text)', marginTop: 6 }} role="alert">
          {error}
        </div>
      )}

      {previews.length > 0 && (
        <div className="row wrap g8" style={{ marginTop: 12 }}>
          {previews.map((p, i) => (
            <div
              key={i}
              className="usg-thumb"
              style={{ width: 78, height: 60, position: 'relative' }}
              title={p.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
              />
              <button
                type="button"
                aria-label={`${t('remove')} ${p.name}`}
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(8,16,28,0.7)',
                  border: 0,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onClick={(e) => { e.stopPropagation(); removePreview(i) }}
              >
                <Icon name="x" size={11} aria-hidden />
              </button>
              <span className="usg-idx">{String(i + 1).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
