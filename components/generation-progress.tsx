'use client'

import { Icon } from './ui/icon'

export type GenStep = { label: string; done: boolean }

/**
 * Pipeline progress list — mirrors the prototype GenerationSim steps markup:
 * done = check in ok circle, active = loader .spin in accent circle,
 * waiting = step number, dimmed. Below: .pline progress bar sized by done steps.
 */
export function GenerationProgress({ steps }: { steps: GenStep[] }) {
  const activeIdx = steps.findIndex((s) => !s.done)
  const doneCount = steps.filter((s) => s.done).length
  return (
    <div className="col g12">
      <ol className="col g8" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {steps.map((s, i) => {
          const state = s.done ? 'done' : i === activeIdx ? 'active' : 'wait'
          return (
            <li key={i} className="row g10" style={{ opacity: state === 'wait' ? 0.4 : 1, transition: 'opacity .3s' }}>
              <div
                aria-hidden
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 99,
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: state === 'done' ? 'var(--ok-bg)' : state === 'active' ? 'var(--accent-tint)' : 'var(--surface-2)',
                  color: state === 'done' ? 'var(--ok-text)' : 'var(--accent-700)',
                }}
              >
                {state === 'done' ? (
                  <Icon name="check" size={14} aria-hidden />
                ) : state === 'active' ? (
                  <Icon name="loader" size={14} className="spin" aria-hidden />
                ) : (
                  <span className="mono" style={{ fontSize: 11 }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: 13.5, fontWeight: state === 'active' ? 600 : 500 }}>{s.label}</span>
            </li>
          )
        })}
      </ol>
      <div
        className="pline"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={doneCount}
      >
        <i style={{ width: `${(doneCount / Math.max(steps.length, 1)) * 100}%` }} />
      </div>
    </div>
  )
}
