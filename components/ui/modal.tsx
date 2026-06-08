'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type ModalProps = {
  open: boolean
  onClose?: () => void
  children: ReactNode
  lg?: boolean
  title?: string
}

export function Modal({ open, onClose, children, lg, title }: ModalProps) {
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const el = firstFocusableRef.current
    el?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="scrim"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <div
        className={`modal${lg ? ' modal-lg' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Focus trap: keep Tab within modal
          if (e.key !== 'Tab') return
          const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          if (!focusable.length) return
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault()
              last.focus()
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault()
              first.focus()
            }
          }
        }}
      >
        {children}
      </div>
    </div>
  )
}
