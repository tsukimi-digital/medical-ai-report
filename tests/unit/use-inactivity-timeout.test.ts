import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useInactivityTimeout,
  ACTIVITY_THROTTLE_MS,
  SESSION_REFRESH_INTERVAL_MS,
} from '../../lib/use-inactivity-timeout'

const WARN_MS = 10 * 60_000
const LOGOUT_MS = 15 * 60_000

function setup(extra: Partial<Parameters<typeof useInactivityTimeout>[0]> = {}) {
  const onWarn = vi.fn()
  const onTimeout = vi.fn()
  const onActivity = vi.fn()
  const onRefreshSession = vi.fn()
  const utils = renderHook(() =>
    useInactivityTimeout({
      onWarn,
      onTimeout,
      onActivity,
      onRefreshSession,
      warnAfterMs: WARN_MS,
      timeoutAfterMs: LOGOUT_MS,
      ...extra,
    }),
  )
  return { onWarn, onTimeout, onActivity, onRefreshSession, ...utils }
}

function fireActivity() {
  window.dispatchEvent(new Event('pointerdown'))
}

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires onWarn after 10 min and onTimeout after 15 min of inactivity', () => {
    const { onWarn, onTimeout } = setup()

    act(() => vi.advanceTimersByTime(WARN_MS - 1))
    expect(onWarn).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(1))
    expect(onWarn).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(LOGOUT_MS - WARN_MS))
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('resets both timers on user activity (pointerdown)', () => {
    const { onWarn, onTimeout, onActivity } = setup()

    // 9 minutes pass, then the user moves — no warning should ever fire at 10
    act(() => vi.advanceTimersByTime(9 * 60_000))
    act(() => fireActivity())
    expect(onActivity).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(WARN_MS - 1))
    expect(onWarn).not.toHaveBeenCalled()

    // Full 10 minutes after the last activity → warning fires
    act(() => vi.advanceTimersByTime(1))
    expect(onWarn).toHaveBeenCalledTimes(1)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('resets timers on keydown as well', () => {
    const { onWarn } = setup()
    act(() => vi.advanceTimersByTime(9 * 60_000))
    act(() => window.dispatchEvent(new Event('keydown')))
    act(() => vi.advanceTimersByTime(2 * 60_000))
    expect(onWarn).not.toHaveBeenCalled()
  })

  it('resets timers on wheel (scroll) as well', () => {
    const { onWarn, onActivity } = setup()
    act(() => vi.advanceTimersByTime(9 * 60_000))
    act(() => window.dispatchEvent(new Event('wheel')))
    expect(onActivity).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(2 * 60_000))
    expect(onWarn).not.toHaveBeenCalled()
  })

  it('wheel shares the same activity throttle', () => {
    const { onActivity } = setup()
    act(() => vi.advanceTimersByTime(ACTIVITY_THROTTLE_MS + 1))
    act(() => {
      window.dispatchEvent(new Event('wheel'))
      window.dispatchEvent(new Event('wheel'))
      window.dispatchEvent(new Event('pointerdown'))
    })
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('hides warning and restarts cycle when activity happens after the warning', () => {
    const { onWarn, onTimeout, onActivity } = setup()

    act(() => vi.advanceTimersByTime(WARN_MS))
    expect(onWarn).toHaveBeenCalledTimes(1)

    // Activity after the toast appeared — onActivity hides it, timers restart
    act(() => fireActivity())
    expect(onActivity).toHaveBeenCalledTimes(1)

    act(() => vi.advanceTimersByTime(LOGOUT_MS - 1))
    expect(onTimeout).not.toHaveBeenCalled()

    // Second full inactivity cycle: warning fires again
    expect(onWarn).toHaveBeenCalledTimes(2)
  })

  it('throttles rapid activity events', () => {
    const { onActivity } = setup()
    act(() => vi.advanceTimersByTime(ACTIVITY_THROTTLE_MS + 1))
    act(() => {
      fireActivity()
      fireActivity()
      fireActivity()
    })
    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it('calls onRefreshSession at most every SESSION_REFRESH_INTERVAL_MS of activity', () => {
    const { onRefreshSession } = setup()

    // Activity shortly after mount — interval not yet elapsed, no refresh
    act(() => vi.advanceTimersByTime(ACTIVITY_THROTTLE_MS + 1))
    act(() => fireActivity())
    expect(onRefreshSession).not.toHaveBeenCalled()

    // Activity after the refresh interval — cookie slide ping fires once
    act(() => vi.advanceTimersByTime(SESSION_REFRESH_INTERVAL_MS))
    act(() => fireActivity())
    expect(onRefreshSession).toHaveBeenCalledTimes(1)

    // Immediately-following activity within the interval does not re-ping
    act(() => vi.advanceTimersByTime(ACTIVITY_THROTTLE_MS + 1))
    act(() => fireActivity())
    expect(onRefreshSession).toHaveBeenCalledTimes(1)
  })

  it('cleans up timers and listeners on unmount', () => {
    const { onWarn, onTimeout, unmount } = setup()
    unmount()
    act(() => vi.advanceTimersByTime(LOGOUT_MS * 2))
    expect(onWarn).not.toHaveBeenCalled()
    expect(onTimeout).not.toHaveBeenCalled()
  })
})
