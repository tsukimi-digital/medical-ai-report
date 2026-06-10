import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { GenerationProgress } from '../../components/generation-progress'

const steps = (done: boolean[]) =>
  done.map((d, i) => ({ label: `Step ${i + 1}`, done: d }))

describe('GenerationProgress', () => {
  it('renders all step labels in an ordered list', () => {
    const { container } = render(
      createElement(GenerationProgress, { steps: steps([false, false, false]) }),
    )
    const items = container.querySelectorAll('ol li')
    expect(items).toHaveLength(3)
    expect(items[0].textContent).toContain('Step 1')
    expect(items[2].textContent).toContain('Step 3')
  })

  it('marks the first not-done step as active (spinner) and future steps dimmed', () => {
    const { container } = render(
      createElement(GenerationProgress, { steps: steps([true, false, false]) }),
    )
    const items = container.querySelectorAll('ol li')
    // active step has a spinning loader icon
    expect(items[1].querySelector('.spin')).not.toBeNull()
    // waiting step is dimmed and shows its number
    expect((items[2] as HTMLElement).style.opacity).toBe('0.4')
    expect(items[2].textContent).toContain('3')
  })

  it('shows progress bar width proportional to completed steps', () => {
    const { container } = render(
      createElement(GenerationProgress, { steps: steps([true, true, false]) }),
    )
    const bar = container.querySelector('.pline > i') as HTMLElement
    expect(bar.style.width).toBe(`${(2 / 3) * 100}%`)
    const pline = container.querySelector('.pline')
    expect(pline?.getAttribute('role')).toBe('progressbar')
    expect(pline?.getAttribute('aria-valuenow')).toBe('2')
  })

  it('renders no spinner when all steps are done', () => {
    const { container } = render(
      createElement(GenerationProgress, { steps: steps([true, true]) }),
    )
    expect(container.querySelector('.spin')).toBeNull()
    const bar = container.querySelector('.pline > i') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })
})
