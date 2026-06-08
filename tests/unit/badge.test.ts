import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { ConfBadge, Badge } from '../../components/ui/badge'

describe('ConfBadge', () => {
  it('renders high confidence with correct class and label (pl)', () => {
    const { container } = render(createElement(ConfBadge, { level: 'high' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-hi')
    expect(span?.textContent).toContain('pewne')
  })

  it('renders medium confidence with correct class and label (pl)', () => {
    const { container } = render(createElement(ConfBadge, { level: 'medium' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-med')
    expect(span?.textContent).toContain('niepewne')
  })

  it('renders low confidence with correct class and label (pl)', () => {
    const { container } = render(createElement(ConfBadge, { level: 'low' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-low')
    expect(span?.textContent).toContain('wątpliwe')
  })

  it('renders high confidence in English', () => {
    const { container } = render(createElement(ConfBadge, { level: 'high', lang: 'en' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-hi')
    expect(span?.textContent).toContain('high')
  })

  it('renders medium confidence in English', () => {
    const { container } = render(createElement(ConfBadge, { level: 'medium', lang: 'en' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-med')
    expect(span?.textContent).toContain('medium')
  })

  it('renders low confidence in English', () => {
    const { container } = render(createElement(ConfBadge, { level: 'low', lang: 'en' }))
    const span = container.querySelector('span')
    expect(span?.className).toContain('badge-low')
    expect(span?.textContent).toContain('low')
  })

  it('always renders both color class and text label (WCAG 1.4.1)', () => {
    const levels = ['high', 'medium', 'low'] as const
    for (const level of levels) {
      const { container } = render(createElement(ConfBadge, { level }))
      const span = container.querySelector('span')
      // Must have a color class
      const hasColorClass = ['badge-hi', 'badge-med', 'badge-low'].some((c) =>
        span?.className.includes(c),
      )
      expect(hasColorClass).toBe(true)
      // Must have text content (not just a dot)
      const text = span?.textContent?.trim() ?? ''
      expect(text.length).toBeGreaterThan(0)
    }
  })

  it('renders a dot element inside', () => {
    const { container } = render(createElement(ConfBadge, { level: 'high' }))
    const dot = container.querySelector('.dot')
    expect(dot).not.toBeNull()
  })
})

describe('Badge', () => {
  it('renders with badge class', () => {
    const { container } = render(createElement(Badge, null, 'Test'))
    expect(container.querySelector('.badge')).not.toBeNull()
  })

  it('renders variant class when provided', () => {
    const { container } = render(createElement(Badge, { variant: 'approved' }, 'Approved'))
    expect(container.querySelector('.badge-approved')).not.toBeNull()
  })

  it('renders dot when dot prop is true', () => {
    const { container } = render(createElement(Badge, { dot: true }, 'With dot'))
    expect(container.querySelector('.dot')).not.toBeNull()
  })
})
