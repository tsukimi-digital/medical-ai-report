'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { ConfBadge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import type { User, RadiologicalReport, MedicalReport } from '@/lib/types'

const RAD_EXAM_ROWS = [
  { id: 'rad-A',      caseKey: 'A',    patientId: 'p-anna',   type: 'USG tarczycy',            date: '2026-06-04', status: 'draft',    mode: 'image',     summary: 'Zmiana 8 mm lewy płat — TI-RADS 4' },
  { id: 'rad-B',      caseKey: 'B',    patientId: 'p-marek',  type: 'USG jamy brzusznej',      date: '2026-06-04', status: 'draft',    mode: 'voice',     summary: 'Z dyktowania — kontrola' },
  { id: 'rad-D',      caseKey: 'D',    patientId: 'p-tomasz', type: 'USG tarczycy',            date: '2026-06-04', status: 'draft',    mode: 'multimodal',summary: 'Jakość suboptymalna — konflikt' },
  { id: 'rad-A-appr', caseKey: null,   patientId: 'p-anna',   type: 'USG tarczycy',            date: '2026-05-28', status: 'approved', mode: 'image',     summary: 'TI-RADS 4 — zatwierdzony' },
  { id: 'rad-seed-1', caseKey: null,   patientId: 'p-marek',  type: 'USG jamy brzusznej',      date: '2026-05-30', status: 'approved', mode: 'voice',     summary: 'Torbiel nerki (Bosniak I)' },
  { id: 'rad-seed-2', caseKey: null,   patientId: 'p-ewa',    type: 'USG ginekologiczne (TV)', date: '2026-06-01', status: 'approved', mode: 'image',     summary: 'O-RADS 2 — łagodna' },
]

const DOC_VISIT_ROWS = [
  { id: 'med-C',      caseKey: 'C',  patientId: 'p-anna',  type: 'Wizyta — omówienie USG tarczycy', date: '2026-06-04', status: 'draft',    linkedReport: 'rad-A-appr' },
  { id: 'med-seed-1', caseKey: null, patientId: 'p-marek', type: 'Wizyta kontrolna',                date: '2026-05-31', status: 'approved', linkedReport: 'rad-seed-1' },
]

const PATIENTS: Record<string, { name: string; age: number }> = {
  'p-anna':   { name: 'Anna Kowalska',   age: 52 },
  'p-marek':  { name: 'Marek Nowak',     age: 61 },
  'p-tomasz': { name: 'Tomasz Wiśniewski', age: 45 },
  'p-ewa':    { name: 'Ewa Mazur',        age: 36 },
}

const EN_TYPES: Record<string, string> = {
  'USG tarczycy': 'Thyroid ultrasound',
  'USG jamy brzusznej': 'Abdominal ultrasound',
  'USG ginekologiczne (TV)': 'Gynecological ultrasound (TV)',
  'Wizyta — omówienie USG tarczycy': 'Visit — thyroid ultrasound review',
  'Wizyta kontrolna': 'Follow-up visit',
  'Zmiana 8 mm lewy płat — TI-RADS 4': '8 mm left-lobe nodule — TI-RADS 4',
  'Z dyktowania — kontrola': 'From dictation — follow-up',
  'Jakość suboptymalna — konflikt': 'Suboptimal quality — conflict',
  'TI-RADS 4 — zatwierdzony': 'TI-RADS 4 — approved',
  'Torbiel nerki (Bosniak I)': 'Renal cyst (Bosniak I)',
  'O-RADS 2 — łagodna': 'O-RADS 2 — benign',
}

function L(lang: string, s: string) {
  return lang === 'en' ? (EN_TYPES[s] ?? s) : s
}

function ModeTag({ mode, lang }: { mode: string; lang: string }) {
  const m: Record<string, { icon: string; pl: string; en: string }> = {
    image:     { icon: 'image',  pl: 'zdjęcie',   en: 'image' },
    voice:     { icon: 'mic',    pl: 'głos',      en: 'voice' },
    multimodal:{ icon: 'layers', pl: 'multimodal', en: 'multimodal' },
  }
  const config = m[mode] ?? { icon: 'file', pl: mode, en: mode }
  return (
    <span className="row g6 faint" style={{ fontSize: 12 }}>
      <Icon name={config.icon as any} size={14} aria-hidden />
      {lang === 'en' ? config.en : config.pl}
    </span>
  )
}

function StatusBadge({ status, t }: { status: string; t: (k: any) => string }) {
  return (
    <span className={`badge ${status === 'approved' ? 'badge-approved' : 'badge-draft'}`}>
      <span className="dot" aria-hidden />
      {status === 'approved' ? t('statusApproved') : t('statusDraft')}
    </span>
  )
}

function CaseChip({ k }: { k: string }) {
  return (
    <span className="badge badge-accent badge-sq mono" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>
      CASE {k}
    </span>
  )
}

function DemoCaseCard({
  icon,
  caseKey,
  title,
  sub,
  wow,
  href,
}: {
  icon: string
  caseKey: string
  title: string
  sub: string
  wow: string
  href: string
}) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="card card-pad"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 0.14s, transform 0.08s, border-color 0.14s',
      }}
      onClick={() => router.push(href)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--sh-3)'
        e.currentTarget.style.borderColor = 'var(--accent-tint-2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--sh-1)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      <div className="row between">
        <div className="row g10">
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--accent-tint)', color: 'var(--accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon as any} size={18} aria-hidden />
          </div>
          <CaseChip k={caseKey} />
        </div>
        <Icon name="arrowRight" size={17} style={{ color: 'var(--text-faint)' }} aria-hidden />
      </div>
      <div>
        <div className="h-card" style={{ marginBottom: 3 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{sub}</div>
      </div>
      <div className="row g6" style={{ marginTop: 'auto', paddingTop: 4 }}>
        <Icon name="sparkle" size={13} style={{ color: 'var(--accent-700)' }} aria-hidden />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent-800)' }}>{wow}</span>
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { lang, t } = useI18n()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const u = apiClient.getSessionUser()
    if (u) setUser(u)
  }, [])

  if (!user) {
    return (
      <div className="page">
        <div className="page-wide">
          <div className="col g12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skel" style={{ height: 60, borderRadius: 10 }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const isRad = user.role === 'radiologist'
  const lastName = user.name.split(' ').slice(-1)[0]

  const radCases = [
    {
      icon: 'image', caseKey: 'A',
      title: lang === 'pl' ? 'USG tarczycy — zdjęcie → raport' : 'Thyroid US — image → report',
      sub: lang === 'pl' ? 'Analiza 3 obrazów, klasyfikacja TI-RADS, warstwa evidence.' : '3-image analysis, TI-RADS, evidence layer.',
      wow: lang === 'pl' ? 'TI-RADS 4 + źródła z obrazów' : 'TI-RADS 4 + image sources',
      href: '/examination/rad-A',
    },
    {
      icon: 'mic', caseKey: 'B',
      title: lang === 'pl' ? 'USG jamy brzusznej — głos → raport' : 'Abdominal US — voice → report',
      sub: lang === 'pl' ? 'Z naturalnego dyktowania powstaje strukturalny raport.' : 'Structured report from natural dictation.',
      wow: lang === 'pl' ? 'Korekta w locie → czysty raport' : 'In-flight fix → clean report',
      href: '/examination/rad-B',
    },
    {
      icon: 'shield', caseKey: 'D',
      title: lang === 'pl' ? 'AI Quality Review — konflikt' : 'AI Quality Review — conflict',
      sub: lang === 'pl' ? 'Obraz suboptymalny + element niepewny. Warstwa jakości.' : 'Suboptimal image + uncertain item. Quality layer.',
      wow: lang === 'pl' ? 'AI nie udaje pewności' : "AI doesn't fake certainty",
      href: '/examination/rad-D',
    },
  ]
  const docCases = [
    {
      icon: 'stetho', caseKey: 'C',
      title: lang === 'pl' ? 'Wizyta → raport + wersja dla pacjenta' : 'Visit → report + patient version',
      sub: lang === 'pl' ? 'Jedno nagranie rozmowy daje dwa dokumenty jednocześnie.' : 'One recording yields two documents at once.',
      wow: lang === 'pl' ? 'Jedno nagranie → dwa dokumenty' : 'One recording → two documents',
      href: '/visit/med-C',
    },
  ]
  const cases = isRad ? radCases : docCases
  const rows = isRad ? RAD_EXAM_ROWS : DOC_VISIT_ROWS

  return (
    <div className="page">
      <div className="page-wide">
        {/* Header */}
        <div className="row between wrap g16" style={{ marginBottom: 24 }}>
          <div>
            <h1 className="h-page">{t('hello')}, {lastName}</h1>
            <p className="lead" style={{ marginTop: 3, marginBottom: 0 }}>
              {isRad ? t('dashRadSub') : t('dashDocSub')}
            </p>
          </div>
          <Btn
            variant="primary"
            size="lg"
            icon="plus"
            onClick={() => router.push(isRad ? '/examination/new' : '/visit')}
          >
            {isRad ? t('newExam') : t('newVisit')}
          </Btn>
        </div>

        {/* Demo cases */}
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="h-sec row g8">
              <Icon name="sparkle" size={17} style={{ color: 'var(--accent-700)' }} aria-hidden />
              {t('demoCases')}
            </div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{t('demoCasesSub')}</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isRad ? 'repeat(auto-fill, minmax(290px, 1fr))' : 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 14,
            marginBottom: 14,
          }}
          className="stagger"
        >
          {cases.map((c) => (
            <DemoCaseCard key={c.caseKey} {...c} />
          ))}
          {isRad && (
            <div
              className="card card-pad"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                background: 'var(--surface-2)',
                borderStyle: 'dashed',
              }}
            >
              <div className="row g10">
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface-3)', color: 'var(--accent-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="layers" size={18} aria-hidden />
                </div>
                <span className="badge badge-neutral badge-sq mono" style={{ fontWeight: 700 }}>MULTIMODAL</span>
              </div>
              <div>
                <div className="h-card" style={{ marginBottom: 3 }}>
                  {lang === 'pl' ? 'Copilot wielomodalny' : 'Multimodal copilot'}
                </div>
                <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.45 }}>
                  {lang === 'pl'
                    ? 'Obraz + dyktowanie równolegle → warstwa fuzji wykrywa konflikty.'
                    : 'Image + dictation in parallel → fusion layer detects conflicts.'}
                </div>
              </div>
              <Btn
                variant="secondary"
                size="sm"
                iconR="arrowRight"
                style={{ marginTop: 'auto', alignSelf: 'flex-start' }}
                onClick={() => router.push('/examination/rad-D')}
                type="button"
              >
                {lang === 'pl' ? 'Zobacz fuzję' : 'See fusion'}
              </Btn>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card" style={{ marginTop: 22, overflow: 'hidden' }}>
          <div className="row between" style={{ padding: '16px 18px 12px' }}>
            <h2 className="h-sec">{isRad ? t('yourExams') : t('yourVisits')}</h2>
            <span className="badge badge-neutral">{rows.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" aria-label={isRad ? t('yourExams') : t('yourVisits')}>
              <thead>
                <tr>
                  <th scope="col">{t('colDate')}</th>
                  <th scope="col">{t('colPatient')}</th>
                  <th scope="col">{t('colType')}</th>
                  {isRad && <th scope="col" className="hide-tablet">{t('colMode')}</th>}
                  <th scope="col">{isRad ? t('colSummary') : t('colStatus')}</th>
                  {isRad && <th scope="col">{t('colStatus')}</th>}
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const patient = PATIENTS[r.patientId]
                  const initials = patient?.name.split(' ').map((s) => s[0]).join('') ?? '?'
                  const href = isRad
                    ? (r.status === 'draft' && r.caseKey ? `/examination/${r.id}` : `/examination/${r.id}`)
                    : (r.caseKey ? `/visit/${r.id}` : `/visit/${r.id}`)

                  return (
                    <tr key={r.id} onClick={() => router.push(href)} style={{ cursor: 'pointer' }}>
                      <td className="mono faint nowrap" style={{ fontSize: 12.5 }}>{r.date}</td>
                      <td>
                        <div className="row g8">
                          <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }} aria-hidden>
                            {initials}
                          </div>
                          <div className="nowrap">
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{patient?.name}</div>
                            <div className="faint" style={{ fontSize: 11 }}>{patient?.age} {t('patientAge')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="nowrap">
                        <div className="row g8">
                          {r.caseKey && <CaseChip k={r.caseKey} />}
                          <span>{L(lang, (r as any).type)}</span>
                        </div>
                      </td>
                      {isRad && <td className="hide-tablet"><ModeTag mode={(r as any).mode} lang={lang} /></td>}
                      <td className="muted" style={{ fontSize: 12.5, maxWidth: 260 }}>
                        {isRad ? L(lang, (r as any).summary) : <StatusBadge status={r.status} t={t} />}
                      </td>
                      {isRad && <td><StatusBadge status={r.status} t={t} /></td>}
                      <td style={{ textAlign: 'right' }}>
                        <Icon name="chevR" size={16} style={{ color: 'var(--text-faint)' }} aria-hidden />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
