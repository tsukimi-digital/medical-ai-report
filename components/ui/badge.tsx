import type { ReactNode } from 'react'
import type { ConfidenceLevel } from '@/lib/types'

type BadgeVariant =
  | 'hi' | 'med' | 'low'
  | 'accent' | 'neutral' | 'ai'
  | 'draft' | 'approved'
  | 'sq'

type BadgeProps = {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
  className?: string
}

export function Badge({ variant, dot, children, className = '' }: BadgeProps) {
  const cls = ['badge', variant ? `badge-${variant}` : '', className].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      {dot && <span className="dot" aria-hidden />}
      {children}
    </span>
  )
}

/** Confidence badge — always shows color + text label (WCAG 1.4.1) */
export function ConfBadge({ level, lang }: { level: ConfidenceLevel; lang?: 'pl' | 'en' }) {
  const map: Record<ConfidenceLevel, { cls: string; pl: string; en: string }> = {
    high:   { cls: 'badge-hi',  pl: 'pewne',    en: 'high' },
    medium: { cls: 'badge-med', pl: 'niepewne', en: 'medium' },
    low:    { cls: 'badge-low', pl: 'wątpliwe', en: 'low' },
  }
  const c = map[level]
  if (!c) return null
  return (
    <span className={`badge ${c.cls}`}>
      <span className="dot" aria-hidden />
      {lang === 'en' ? c.en : c.pl}
    </span>
  )
}
