'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import type { Patient } from '@/lib/types'

export default function PatientsPage() {
  const router = useRouter()
  const { lang, t } = useI18n()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiClient.getPatients().then(({ patients }) => {
      setPatients(patients)
      setLoading(false)
    })
  }, [])

  const filtered = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      p.pesel.includes(query),
  )

  return (
    <div className="page">
      <div className="page-wide">
        <div className="row between wrap g16" style={{ marginBottom: 24 }}>
          <h1 className="h-page">{t('patients')}</h1>
          <Btn variant="primary" icon="userPlus" onClick={() => router.push('/patients/new')}>
            {t('newPatient')}
          </Btn>
        </div>

        <div className="row g8" style={{ marginBottom: 16, maxWidth: 360 }}>
          <Icon name="search" size={16} style={{ color: 'var(--text-faint)' }} aria-hidden />
          <input
            className="input"
            placeholder={t('selectPatientPh')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('selectPatientPh')}
          />
        </div>

        {loading ? (
          <div className="col g8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skel" style={{ height: 56, borderRadius: 10 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card card-pad col center g8" style={{ padding: '40px 24px' }}>
            <Icon name="user" size={32} style={{ color: 'var(--text-faint)' }} aria-hidden />
            <div className="muted">{t('noResults')}</div>
            <Btn variant="secondary" icon="userPlus" onClick={() => router.push('/patients/new')}>
              {t('newPatient')}
            </Btn>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="table" aria-label={t('patients')}>
              <thead>
                <tr>
                  <th scope="col">{t('lastName')}</th>
                  <th scope="col">{t('pesel')}</th>
                  <th scope="col">{t('age')}</th>
                  <th scope="col">{t('gender')}</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => router.push(`/patients/${p.id}`)}>
                    <td>
                      <div className="row g10">
                        <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }} aria-hidden>
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono faint" style={{ fontSize: 12.5 }}>{p.pesel}</td>
                    <td>{p.age} {t('patientAge')}</td>
                    <td>{p.gender === 'F' ? t('female') : t('male')}</td>
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
