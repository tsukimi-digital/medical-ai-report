'use client'

import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  /** Auto-dismiss delay in ms. Pass null to keep the toast until dismissed. */
  duration?: number | null
  /** Render an explicit close button. */
  dismissible?: boolean
  /** Accessible label for the close button. */
  dismissLabel?: string
}

/**
 * Toast notification — fixed bottom-right.
 * Auto-dismisses after `duration` ms (default 4s); `duration={null}` makes it
 * persistent until dismissed (used for the session-expiry warning).
 */
export function Toast({
  message,
  onDismiss,
  duration = 4000,
  dismissible = false,
  dismissLabel = 'Zamknij',
}: ToastProps) {
  useEffect(() => {
    if (duration === null) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div role="status" aria-live="polite" className="toast">
      <span>{message}</span>
      {dismissible && (
        <button
          type="button"
          className="toast-close"
          onClick={onDismiss}
          aria-label={dismissLabel}
          style={{
            marginLeft: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            color: 'inherit',
            padding: 0,
            verticalAlign: 'middle',
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}
