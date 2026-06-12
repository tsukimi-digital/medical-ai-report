'use client'

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { Btn } from '@/components/ui/button'
import { Toast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/index'
import { apiClient } from '@/lib/api-client'
import { useInactivityTimeout } from '@/lib/use-inactivity-timeout'
import type { User } from '@/lib/types'

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { lang, setLang, t } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [showLangToast, setShowLangToast] = useState(false)
  const [showSessionToast, setShowSessionToast] = useState(false)
  const prevLangRef = useRef<string | null>(null)

  useEffect(() => {
    const u = apiClient.getSessionUser()
    if (u) {
      setUser(u)
      return
    }
    // In-memory sessionUser is not set (e.g. hard refresh) — re-hydrate from server cookie
    apiClient.me()
      .then(({ user: serverUser }) => {
        apiClient.setSessionUser(serverUser)
        setUser(serverUser)
      })
      .catch(() => {
        // No valid session cookie either — go to login
        router.replace('/login')
      })
  }, [router])

  // Show toast whenever lang actually changes (compare against previous value —
  // a "first render" flag misfires under StrictMode's double-mount in dev)
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      if (prevLangRef.current !== null) setShowLangToast(true)
      prevLangRef.current = lang
    }
  }, [lang])

  const handleDismissToast = useCallback(() => setShowLangToast(false), [])

  const handleLogout = async () => {
    await apiClient.logout()
    router.push('/login')
  }

  // -------------------------------------------------------------------------
  // Session inactivity (spec l.1128): warn after 10 min, auto-logout after 15.
  // Activity (pointerdown/keydown) resets the timers and hides the warning;
  // a throttled /api/auth/me ping slides the server-side cookie so the 15-min
  // window counts from last activity, not from login.
  // -------------------------------------------------------------------------
  const handleSessionWarn = useCallback(() => setShowSessionToast(true), [])
  const handleSessionActivity = useCallback(() => setShowSessionToast(false), [])
  const handleSessionRefresh = useCallback(() => {
    // Lightweight authenticated request — middleware re-issues the cookie.
    // If the session is already gone server-side, send the user to /login.
    apiClient.me().catch(() => router.replace('/login'))
  }, [router])
  const handleSessionTimeout = useCallback(async () => {
    try {
      await apiClient.logout()
    } catch {
      // Session may already be invalidated server-side — redirect regardless.
    }
    router.push('/login')
  }, [router])

  useInactivityTimeout({
    onWarn: handleSessionWarn,
    onTimeout: handleSessionTimeout,
    onActivity: handleSessionActivity,
    onRefreshSession: handleSessionRefresh,
  })

  return (
    <div className="app-shell">
      {/* Navbar */}
      <header className="navbar" role="banner">
        <Link href="/dashboard" className="brand" aria-label={t('ariaHome')}>
          <div className="brand-mark">
            <Icon name="activity" size={17} aria-hidden />
          </div>
          <div>
            <div className="brand-name">Sonara</div>
            <div className="brand-sub">{t('brandSub')}</div>
          </div>
        </Link>

        <nav className="row g12" aria-label={t('ariaMainNav')} style={{ marginLeft: 8 }}>
          <Link
            href="/dashboard"
            className="link"
            style={{ fontSize: 13.5, fontWeight: 600, textDecoration: 'none', color: 'var(--text-muted)' }}
          >
            {user?.role === 'radiologist' ? t('yourExams') : t('yourVisits')}
          </Link>
          <Link
            href="/patients"
            className="link"
            style={{ fontSize: 13.5, fontWeight: 600, textDecoration: 'none', color: 'var(--text-muted)' }}
          >
            {t('patients')}
          </Link>
        </nav>

        <div className="nav-spacer" />

        {/* Language toggle */}
        <div className="lang-toggle" role="group" aria-label={t('ariaLanguage')}>
          {(['pl', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              className={lang === l ? 'on' : ''}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {/* User chip */}
        {user && (
          <div className="user-chip row g8">
            <div className="avatar" aria-hidden>{user.initials}</div>
            <div className="user-meta hide-tablet">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.role === 'radiologist' ? t('radiologist') : t('doctor')}
              </div>
            </div>
            <Btn
              variant="ghost"
              size="sm"
              icon="logout"
              onClick={handleLogout}
              aria-label={t('logout')}
              type="button"
            >
              <span className="hide-tablet">{t('logout')}</span>
            </Btn>
          </div>
        )}
      </header>

      {/* Disclaimer bar */}
      <div className="disclaimer" role="status" aria-live="polite">
        <Icon name="alertCircle" size={14} aria-hidden />
        <span>{t('disclaimer')}</span>
      </div>

      {/* Page content */}
      <main>{children}</main>

      {/* Session expiry warning toast — persistent until activity or dismissal */}
      {showSessionToast && (
        <Toast
          message={t('sessionExpireWarning')}
          onDismiss={() => setShowSessionToast(false)}
          duration={null}
          dismissible
          dismissLabel={t('sessionToastDismiss')}
        />
      )}

      {/* Lang change toast */}
      {showLangToast && (
        <Toast
          message={
            lang === 'pl'
              ? `Wygenerowany raport jest w języku PL. Zmiana języka interfejsu nie wpływa na treść raportu.`
              : `The generated report is in EN. Changing the interface language does not affect report content.`
          }
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  )
}
