'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { Icon } from './icon'

type ComboboxProps<T> = {
  value: T | null
  onChange: (value: T) => void
  options: T[]
  placeholder?: string
  render?: (item: T) => ReactNode
  getLabel?: (item: T) => string
  emptyText?: string
  disabled?: boolean
  id?: string
}

export function Combobox<T>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  render,
  getLabel,
  emptyText = 'No results',
  disabled,
  id,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const lab = useCallback((o: T) => (getLabel ? getLabel(o) : String(o)), [getLabel])

  const filtered = options.filter((o) => lab(o).toLowerCase().includes(query.toLowerCase()))

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setActiveIndex(-1)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && filtered[activeIndex]) {
        onChange(filtered[activeIndex])
        setOpen(false)
        setQuery('')
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const displayLabel = value ? (render ? render(value) : lab(value)) : null

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={placeholder}
        tabIndex={disabled ? -1 : 0}
        className={`input row between${disabled ? ' opacity-50 cursor-not-allowed' : ' cursor-pointer'}`}
        style={{ paddingRight: 10 }}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
      >
        <span
          style={{
            color: value ? 'var(--text)' : 'var(--text-faint)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayLabel ?? placeholder}
        </span>
        <Icon name="chevD" size={16} style={{ color: 'var(--text-faint)', flex: 'none' }} aria-hidden />
      </div>

      {open && (
        <div
          className="card fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            right: 0,
            zIndex: 30,
            boxShadow: 'var(--sh-3)',
            padding: 6,
            maxHeight: 280,
            overflow: 'auto',
          }}
          role="listbox"
          ref={listRef}
        >
          <div className="row g6" style={{ padding: '4px 8px 8px' }}>
            <Icon name="search" size={15} style={{ color: 'var(--text-faint)' }} aria-hidden />
            <input
              ref={inputRef}
              className="input"
              style={{ border: 0, padding: '2px 0', boxShadow: 'none' }}
              placeholder={placeholder}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
              onKeyDown={handleKeyDown}
              aria-label={placeholder}
            />
          </div>
          <div className="divider" style={{ margin: '0 -6px 6px' }} />
          {filtered.map((o, i) => (
            <div
              key={i}
              role="option"
              aria-selected={activeIndex === i}
              className="row"
              style={{
                padding: '8px 10px',
                borderRadius: 7,
                cursor: 'pointer',
                background: activeIndex === i ? 'var(--accent-tint)' : 'transparent',
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(o)
                setOpen(false)
                setQuery('')
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {render ? render(o) : lab(o)}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="faint" style={{ padding: '8px 10px', fontSize: 13 }}>
              {emptyText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
