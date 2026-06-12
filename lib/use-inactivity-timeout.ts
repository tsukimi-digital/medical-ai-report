'use client'

import { useEffect, useRef } from 'react'

const MINUTE_MS = 60_000

// ---------------------------------------------------------------------------
// Spec (design doc l.1128): after 10 min of inactivity show a warning toast
// ("Sesja wygaśnie za 5 minut — zapisz raport."); after 15 min of inactivity
// log the user out and redirect to /login.
//
// Production thresholds are 10/15 minutes. For manual testing they can be
// overridden via env (values in ms, read at build time):
//   NEXT_PUBLIC_SESSION_WARN_MS=5000 NEXT_PUBLIC_SESSION_LOGOUT_MS=10000 npm run dev
// ---------------------------------------------------------------------------
function envMs(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

export const SESSION_WARN_AFTER_MS = envMs(
  process.env.NEXT_PUBLIC_SESSION_WARN_MS,
  10 * MINUTE_MS,
)
export const SESSION_LOGOUT_AFTER_MS = envMs(
  process.env.NEXT_PUBLIC_SESSION_LOGOUT_MS,
  15 * MINUTE_MS,
)

/** Activity events are throttled so rapid typing doesn't churn timers. */
export const ACTIVITY_THROTTLE_MS = 1_000

/**
 * While the user is active, ping the server at most this often so the session
 * cookie (maxAge 15 min, sliding — refreshed by middleware on every request)
 * keeps counting from the *last activity*, not from login.
 */
export const SESSION_REFRESH_INTERVAL_MS = 4 * MINUTE_MS

export interface InactivityTimeoutOptions {
  /** Fired once after `warnAfterMs` without user activity. */
  onWarn: () => void
  /** Fired once after `timeoutAfterMs` without user activity. */
  onTimeout: () => void
  /** Fired on (throttled) user activity — e.g. to hide the warning toast. */
  onActivity?: () => void
  /**
   * Fired at most every SESSION_REFRESH_INTERVAL_MS while the user is active —
   * used to make a lightweight authenticated request that slides the cookie.
   */
  onRefreshSession?: () => void
  warnAfterMs?: number
  timeoutAfterMs?: number
}

/**
 * Client-side inactivity tracker. Resets on pointerdown/keydown (throttled).
 * Timers restart on every (throttled) activity; warning and logout fire only
 * after a full uninterrupted period of inactivity.
 */
export function useInactivityTimeout(options: InactivityTimeoutOptions) {
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    const warnAfter = optsRef.current.warnAfterMs ?? SESSION_WARN_AFTER_MS
    const timeoutAfter = optsRef.current.timeoutAfterMs ?? SESSION_LOGOUT_AFTER_MS

    let warnTimer: ReturnType<typeof setTimeout> | undefined
    let logoutTimer: ReturnType<typeof setTimeout> | undefined
    let lastActivity = Date.now()
    let lastRefresh = Date.now()

    const startTimers = () => {
      warnTimer = setTimeout(() => optsRef.current.onWarn(), warnAfter)
      logoutTimer = setTimeout(() => optsRef.current.onTimeout(), timeoutAfter)
    }
    const clearTimers = () => {
      clearTimeout(warnTimer)
      clearTimeout(logoutTimer)
    }

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivity < ACTIVITY_THROTTLE_MS) return
      lastActivity = now
      clearTimers()
      startTimers()
      optsRef.current.onActivity?.()
      if (now - lastRefresh >= SESSION_REFRESH_INTERVAL_MS) {
        lastRefresh = now
        optsRef.current.onRefreshSession?.()
      }
    }

    startTimers()
    window.addEventListener('pointerdown', handleActivity)
    window.addEventListener('keydown', handleActivity)

    return () => {
      clearTimers()
      window.removeEventListener('pointerdown', handleActivity)
      window.removeEventListener('keydown', handleActivity)
    }
    // Threshold options are read once on mount by design — the timeout values
    // never change at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
