'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { Banner } from '@/components/ui/banner'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import type { PatientInput } from '@/lib/types'

function validatePesel(pesel: string): boolean {
  return /^\d{11}$/.test(pesel)
}

export default function NewPatientPage() {
  const router = useRouter()
  const { lang, t } = useI18n()

  const [form, setForm] = useState<PatientInput>({
    firstName: '',
    lastName: '',
    pesel: '',
    gender: 'F',
    dateOfBirth: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [peselError, setPeselError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPeselError(null)
    setError(null)

    if (!validatePesel(form.pesel)) {
      setPeselError(t('peselInvalid'))
      return
    }

    setLoading(true)
    try {
      const { patient } = await apiClient.createPatient(form)
      router.push(`/patients/${patient.id}`)
    } catch (err: any) {
      if (err.message?.includes('409')) {
        setError(lang === 'en' ? 'A patient with this ID already exists.' : 'Pacjent z tym PESELem już istnieje.')
      } else {
        setError(lang === 'en' ? 'Failed to save patient.' : 'Nie udało się zapisać pacjenta.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-narrow">
        <Link href="/patients" className="link row g6" style={{ marginBottom: 14, fontSize: 13, textDecoration: 'none' }}>
          <Icon name="arrowLeft" size={15} aria-hidden />
          {t('backToPatients')}
        </Link>
        <h1 className="h-page" style={{ marginBottom: 22 }}>{t('newPatient')}</h1>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Banner kind="crit">{error}</Banner>
          </div>
        )}

        <div className="card card-pad-lg">
          <form onSubmit={handleSubmit} className="col g18">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="field-label" htmlFor="firstName">{t('firstName')}</label>
                <input
                  id="firstName"
                  className="input"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="lastName">{t('lastName')}</label>
                <input
                  id="lastName"
                  className="input"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="pesel">{t('pesel')}</label>
              <input
                id="pesel"
                className="input"
                value={form.pesel}
                onChange={(e) => { setForm({ ...form, pesel: e.target.value }); setPeselError(null) }}
                maxLength={11}
                inputMode="numeric"
                required
                aria-describedby={peselError ? 'pesel-error' : undefined}
                aria-invalid={!!peselError}
              />
              {peselError && (
                <div id="pesel-error" style={{ color: 'var(--crit-text)', fontSize: 12, marginTop: 4 }} role="alert">
                  {peselError}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="field-label" htmlFor="gender">{t('gender')}</label>
                <select
                  id="gender"
                  className="select"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value as 'M' | 'F' })}
                >
                  <option value="F">{t('female')}</option>
                  <option value="M">{t('male')}</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="dateOfBirth">{t('dateOfBirth')}</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className="input"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="row g10">
              <Btn type="submit" variant="primary" loading={loading} icon="check">
                {t('savePatient')}
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => router.back()}>
                {t('cancel')}
              </Btn>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
