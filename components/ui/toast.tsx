'use client'

import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
}

/**
 * Toast notification — appears for 4 seconds then auto-dismisses.
 * Position: fixed bottom-right.
 */
export function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div role="status" aria-live="polite" className="toast">
      {message}
    </div>
  )
}
