'use client'

import { useEffect, useRef, useState } from 'react'
import CodePanel, { type Source } from '../code-panel'

type Fn = 'push_back' | 'pop_back' | 'insert' | 'erase' | 'grow'

const MAX_SIZE = 64

interface ArrayState {
  cells: (number | null)[] // one per slot of capacity
  size: number
  added: number
  copied: number
  next: number
}

interface Frame {
  cells: (number | null)[]
  old?: (number | null)[]
  hot?: number // highlighted slot in the new block
  oldHot?: number // highlighted slot in the old block
  size: number
  added: number
  copied: number
  fn: Fn | null
  message: string
  ms: number
}

const EMPTY: ArrayState = { cells: [], size: 0, added: 0, copied: 0, next: 1 }

// Each operation plays out as a list of frames, ending on the new state
type Op = (s: ArrayState) => { frames: Frame[]; state: ArrayState }

function frame(s: ArrayState, fn: Fn | null, message: string, extra: Partial<Frame> = {}): Frame {
  return { cells: [...s.cells], size: s.size, added: s.added, copied: s.copied, fn, message, ms: 650, ...extra }
}

// Doubles the capacity if the array is full, copying every element across
function growIfFull(s: ArrayState, frames: Frame[]): ArrayState {
  if (s.size < s.cells.length) return s
  const capacity = s.cells.length === 0 ? 1 : s.cells.length * 2
  const old = s.cells
  frames.push(frame(s, 'grow', s.size === 0 ? 'No block yet, so grow() allocates one' : `Full: size = capacity = ${s.size}, so grow()`))
  let next: ArrayState = { ...s, cells: Array(capacity).fill(null) }
  frames.push(frame(next, 'grow', `Allocate a new block with room for ${capacity}`, { old }))
  // Big copies run faster per element so a 32-element grow doesn't drag
  const ms = Math.max(70, Math.min(420, 1600 / Math.max(1, old.length)))
  for (let i = 0; i < old.length; i++) {
    const cells = [...next.cells]
    cells[i] = old[i]
    next = { ...next, cells, copied: next.copied + 1 }
    frames.push(frame(next, 'grow', `Copy element ${i} across`, { old, hot: i, oldHot: i, ms }))
  }
  if (old.length > 0) frames.push(frame(next, 'grow', 'Free the old block'))
  return next
}

const pushBack: Op = (start) => {
  const frames: Frame[] = []
  const s = growIfFull(start, frames)
  const cells = [...s.cells]
  cells[s.size] = s.next
  const state = { ...s, cells, size: s.size + 1, added: s.added + 1, next: s.next + 1 }
  frames.push(frame(state, 'push_back', `Write ${s.next} into slot ${s.size}`, { hot: s.size }))
  return { frames, state }
}

const popBack: Op = (s) => {
  const cells = [...s.cells]
  cells[s.size - 1] = null
  const state = { ...s, cells, size: s.size - 1 }
  return {
    frames: [
      frame(s, 'pop_back', `Size goes from ${s.size} to ${s.size - 1}`, { hot: s.size - 1 }),
      frame(state, 'pop_back', `Slot ${s.size - 1} stays allocated, it just stops counting`),
    ],
    state,
  }
}

const insertFront: Op = (start) => {
  const frames: Frame[] = []
  let s = growIfFull(start, frames)
  const ms = Math.max(70, Math.min(420, 1600 / Math.max(1, s.size)))
  for (let i = s.size; i > 0; i--) {
    const cells = [...s.cells]
    cells[i] = cells[i - 1]
    s = { ...s, cells }
    frames.push(frame(s, 'insert', `Shift slot ${i - 1} right to make room`, { hot: i, ms }))
  }
  const cells = [...s.cells]
  cells[0] = s.next
  const state = { ...s, cells, size: s.size + 1, added: s.added + 1, next: s.next + 1 }
  frames.push(frame(state, 'insert', `Write ${s.next} into slot 0`, { hot: 0 }))
  return { frames, state }
}

const eraseFront: Op = (start) => {
  const frames: Frame[] = [frame(start, 'erase', `Erase slot 0`, { hot: 0 })]
  let s = start
  const ms = Math.max(70, Math.min(420, 1600 / Math.max(1, s.size)))
  for (let i = 0; i + 1 < s.size; i++) {
    const cells = [...s.cells]
    cells[i] = cells[i + 1]
    s = { ...s, cells }
    frames.push(frame(s, 'erase', `Shift slot ${i + 1} left`, { hot: i, ms }))
  }
  const cells = [...s.cells]
  cells[s.size - 1] = null
  const state = { ...s, cells, size: s.size - 1 }
  frames.push(frame(state, 'erase', `Size goes down to ${state.size}`))
  return { frames, state }
}

function repeat(op: Op, times: number): Op {
  return (s) => {
    const frames: Frame[] = []
    let state = s
    for (let i = 0; i < times && state.size < MAX_SIZE; i++) {
      const result = op(state)
      // Speed through the cheap pushes so the expensive ones stand out
      frames.push(...result.frames.map((f) => ({ ...f, ms: Math.min(f.ms, f.fn === 'grow' ? f.ms : 220) })))
      state = result.state
    }
    return { frames, state }
  }
}

function Block({ cells, hot, label, faded }: { cells: (number | null)[]; hot?: number; label: string; faded?: boolean }) {
  return (
    <div className={`transition-opacity duration-300 ${faded ? 'opacity-45' : ''}`}>
      <p className="mb-1.5 text-xs uppercase tracking-[0.14em] text-text-secondary">{label}</p>
      <div className="flex flex-wrap gap-1">
        {cells.map((value, i) => {
          const inUse = value !== null
          return (
            <div
              key={i}
              className={`flex h-9 w-9 items-center justify-center text-sm font-semibold tabular-nums transition-colors duration-150 ${
                i === hot
                  ? 'bg-accent text-white'
                  : inUse
                    ? 'border-[1.5px] border-text-primary bg-surface text-text-primary'
                    : 'border border-dashed border-text-secondary/50 text-text-secondary/50'
              }`}
            >
              {value ?? ''}
            </div>
          )
        })}
        {cells.length === 0 && <p className="text-sm text-text-secondary">No memory allocated yet</p>}
      </div>
    </div>
  )
}

export default function DynamicArrayVisualiser({ source }: { source: Source }) {
  const [state, setState] = useState<ArrayState>(EMPTY)
  const [queue, setQueue] = useState<Frame[]>([])
  const [settled, setSettled] = useState<Frame>(frame(EMPTY, null, 'Press push_back to start'))
  const reduceMotion = useRef(false)

  useEffect(() => {
    reduceMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Play queued frames one at a time, settling on the last one
  useEffect(() => {
    if (queue.length === 0) return
    const [current, ...rest] = queue
    const t = setTimeout(() => {
      if (rest.length === 0) setSettled(current)
      setQueue(rest)
    }, current.ms)
    return () => clearTimeout(t)
  }, [queue])

  const shown = queue[0] ?? settled

  const busy = queue.length > 0

  function run(op: Op) {
    const { frames, state: next } = op(state)
    setState(next)
    if (reduceMotion.current) {
      setSettled(frames[frames.length - 1])
    } else {
      setQueue(frames)
    }
  }

  function reset() {
    setQueue([])
    setState(EMPTY)
    setSettled(frame(EMPTY, null, 'Press push_back to start'))
  }

  const full = state.size >= MAX_SIZE
  const empty = state.size === 0
  const buttons: { label: string; op: Op; disabled: boolean }[] = [
    { label: 'push_back', op: pushBack, disabled: full },
    { label: 'push_back × 10', op: repeat(pushBack, 10), disabled: full },
    { label: 'pop_back', op: popBack, disabled: empty },
    { label: 'insert(0)', op: insertFront, disabled: full },
    { label: 'erase(0)', op: eraseFront, disabled: empty },
  ]

  const perAdd = shown.added === 0 ? '–' : (shown.copied / shown.added).toFixed(2)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <div className="lg:sticky lg:top-24">
        <div className="flex flex-wrap gap-2">
          {buttons.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => run(b.op)}
              disabled={busy || b.disabled}
              className="border-[1.5px] border-text-primary px-3 py-1.5 font-mono text-sm text-text-primary transition-colors hover:bg-text-primary hover:text-background disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-text-primary"
            >
              {b.label}
            </button>
          ))}
          <button
            type="button"
            onClick={reset}
            className="px-3 py-1.5 text-sm text-text-secondary transition-colors hover:text-accent"
          >
            Reset
          </button>
        </div>

        <p className="mt-5 min-h-6 text-[15px] text-text-primary" aria-live="polite">
          {shown.fn && <span className="mr-2 font-mono text-sm text-accent">{shown.fn}()</span>}
          {shown.message}
        </p>

        <div className="mt-4 flex min-h-32 flex-col gap-5 border-t-[1.5px] border-text-primary pt-5">
          {shown.old && <Block cells={shown.old} hot={shown.oldHot} label="Old block" faded />}
          <Block
            cells={shown.cells}
            hot={shown.hot}
            label={shown.old ? 'New block' : `size ${shown.size} · capacity ${shown.cells.length}`}
          />
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-4">
          {[
            { value: shown.added, label: 'elements added' },
            { value: shown.copied, label: 'copied while growing' },
            { value: perAdd, label: 'copies per element' },
          ].map((s) => (
            <div key={s.label} className="border-t border-border pt-2">
              <dd className="text-2xl font-bold tabular-nums text-text-primary [font-stretch:115%]">{s.value}</dd>
              <dt className="text-xs text-text-secondary">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <CodePanel source={source} active={shown.fn} />
    </div>
  )
}
