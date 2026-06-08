'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import type { Patient, RadiologicalReport } from '@/lib/types'

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { lang, t } = useI18n()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [reports, setReports] = useState<RadiologicalReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      apiClient.getPatient(params.id),
      apiClient.getRadReports(params.id),
    ])
      .then(([{ patient }, { reports }]) => {
        setPatient(patient)
        setReports(reports)
      })
      .catch(() => setError(lang === 'en' ? 'Patient not found.' : 'Nie znaleziono pacjenta.'))
      .finally(() => setLoading(false))
  }, [params.id, lang])

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

  if (error || !patient) {
    return (
      <div className="page">
        <div className="page-narrow">
          <div className="banner banner-crit">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-narrow">
        <Link href="/patients" className="link row g6" style={{ marginBottom: 14, fontSize: 13, textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={15} aria-hidden />
          {t('backToPatients')}
        </Link>

        <div className="card card-pad-lg" style={{ marginBottom: 24 }}>
          <div className="row g16">
            <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }} aria-hidden>
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h1 className="h-page" style={{ marginBottom: 4 }}>{patient.firstName} {patient.lastName}</h1>
              <div className="row g12 faint" style={{ fontSize: 13 }}>
                <span className="mono">{patient.pesel}</span>
                <span className="dot-sep" />
                <span>{patient.age} {t('patientAge')}</span>
                <span className="dot-sep" />
                <span>{patient.gender === 'F' ? t('female') : t('male')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h-sec">{t('patientReports')}</h2>
          <Btn variant="primary" size="sm" icon="plus" onClick={() => router.push('/examination/new')}>
            {t('newExam')}
          </Btn>
        </div>

        {reports.length === 0 ? (
          <div className="card card-pad col center g8" style={{ padding: '32px 24px' }}>
            <Icon name="file" size={28} style={{ color: 'var(--text-faint)' }} aria-hidden />
            <div className="muted" style={{ fontSize: 13 }}>
              {lang === 'en' ? 'No reports yet.' : 'Brak badań.'}
            </div>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" aria-label={t('patientReports')}>
              <thead>
                <tr>
                  <th scope="col">{t('colDate')}</th>
                  <th scope="col">{t('colType')}</th>
                  <th scope="col">{t('colMode')}</th>
                  <th scope="col">{t('colStatus')}</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/examination/${r.id}`)}>
                    <td className="mono faint nowrap" style={{ fontSize: 12.5 }}>
                      {new Date(r.createdAt).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')}
                    </td>
                    <td>{r.examinationType}</td>
                    <td className="faint" style={{ fontSize: 12.5 }}>{r.analysisMode ?? '—'}</td>
                    <td>
                      <span className={`badge ${r.status === 'approved' ? 'badge-approved' : 'badge-draft'}`}>
                        <span className="dot" aria-hidden />
                        {r.status === 'approved' ? t('statusApproved') : t('statusDraft')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Icon name="chevR" size={16} style={{ color: 'var(--text-faint)' }} aria-hidden />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
