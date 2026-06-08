'use client'

import { useState, type ReactNode } from 'react'
import { Icon, type IconName } from './icon'

type CollapseProps = {
  title: ReactNode
  sub?: string
  defaultOpen?: boolean
  icon?: IconName
  right?: ReactNode
  children: ReactNode
}

export function Collapse({ title, sub, defaultOpen = false, icon, right, children }: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <button
        className="collapse-head between w-full"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        type="button"
      >
        <div className="row g8">
          <Icon name="chevR" size={16} className={`chev${open ? ' open' : ''}`} aria-hidden />
          {icon && <Icon name={icon} size={16} style={{ color: 'var(--accent-700)' }} aria-hidden />}
          <div>
            <div className="h-card">{title}</div>
            {sub && <div className="faint" style={{ fontSize: 11.5, fontWeight: 400 }}>{sub}</div>}
          </div>
        </div>
        {right}
      </button>
      {open && (
        <div className="fade-in" style={{ borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}
