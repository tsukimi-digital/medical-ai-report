'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/lib/types'

const DEMO_USERS: Array<{ email: string; name: string; role: string; initials: string }> = [
  { email: 'rad1@demo.pl', name: 'dr Anna Lewandowska', role: 'radiologist', initials: 'AL' },
  { email: 'rad2@demo.pl', name: 'dr Piotr Zieliński',  role: 'radiologist', initials: 'PZ' },
  { email: 'doc1@demo.pl', name: 'lek. Marta Sawicka',  role: 'doctor',      initials: 'MS' },
  { email: 'doc2@demo.pl', name: 'lek. Jan Kowalczyk',  role: 'doctor',      initials: 'JK' },
]

export default function LoginPage() {
  const router = useRouter()
  const { lang, setLang, t } = useI18n()
  const [email, setEmail] = useState('rad1@demo.pl')
  const [password, setPassword] = useState('demo2024')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { user } = await apiClient.login(email, password)
      apiClient.setSessionUser(user)
      router.push('/dashboard')
    } catch {
      setError(lang === 'en' ? 'Invalid credentials.' : 'Nieprawidłowe dane logowania.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
      }}
    >
      {/* top bar */}
      <div className="row between" style={{ padding: '16px 22px' }}>
        <div className="brand">
          <div className="brand-mark">
            <Icon name="activity" size={17} aria-hidden />
          </div>
          <div>
            <div className="brand-name">Sonara</div>
            <div className="brand-sub">{t('brandSub')}</div>
          </div>
        </div>
        <div className="lang-toggle" role="group" aria-label={t('ariaLanguage')}>
          {(['pl', 'en'] as const).map((l) => (
            <button
              key={l}
              className={lang === l ? 'on' : ''}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              type="button"
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* centered card */}
      <div
        className="grow row center"
        style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ width: '100%', maxWidth: 396 }}>
          <div className="card card-pad-lg fade-in">
            <div className="col center" style={{ marginBottom: 22, gap: 0 }}>
              <div
                className="brand-mark"
                style={{ width: 46, height: 46, borderRadius: 12, marginBottom: 14 }}
              >
                <Icon name="activity" size={26} aria-hidden />
              </div>
              <h1 className="h-page" style={{ fontSize: 21, margin: 0 }}>{t('loginTitle')}</h1>
              <p className="muted" style={{ marginTop: 4, marginBottom: 0 }}>{t('loginSub')}</p>
            </div>

            {error && (
              <div
                className="banner banner-crit"
                role="alert"
                style={{ marginBottom: 14 }}
              >
                <Icon name="alertCircle" size={16} aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="col g14">
              <div>
                <label className="field-label" htmlFor="email">{t('email')}</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="field-label" htmlFor="password">{t('password')}</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Btn
                variant="primary"
                size="lg"
                className="btn-block"
                type="submit"
                loading={loading}
              >
                {t('signIn')}
              </Btn>
            </form>

            <div className="divider" style={{ margin: '20px 0 16px' }} />
            <div className="eyebrow" style={{ marginBottom: 10 }}>{t('quickAccess')}</div>
            <div className="col g8" role="list" aria-label={t('quickAccess')}>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  role="listitem"
                  className="panel row between"
                  style={{
                    padding: '9px 11px',
                    cursor: 'pointer',
                    background: email === u.email ? 'var(--accent-tint)' : 'var(--surface)',
                    borderColor: email === u.email ? 'var(--accent-tint-2)' : 'var(--border)',
                    transition: 'background 0.12s',
                  }}
                  onClick={() => { setEmail(u.email); setPassword('demo2024') }}
                  aria-pressed={email === u.email}
                >
                  <div className="row g10">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                      {u.initials}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                      <div className="faint mono" style={{ fontSize: 11 }}>{u.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${u.role === 'radiologist' ? 'badge-accent' : 'badge-neutral'}`}>
                    {u.role === 'radiologist' ? t('radiologist') : t('doctor')}
                  </span>
                </button>
              ))}
            </div>
            <p className="faint" style={{ fontSize: 11.5, marginTop: 14, textAlign: 'center' }}>
              {t('demoHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
