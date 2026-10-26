'use client'

import { useEffect, useRef, useState } from 'react'
import type { Week } from './stats'

const fmt = new Intl.NumberFormat('en-NZ')
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

const MIN_WEEKS = 4
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// One thin bar per week, every week since the first run. The chosen year stays full strength.
// The strip underneath picks which weeks the chart shows.
export default function WeeklyChart({ weeks: all, year }: { weeks: Week[]; year: number | null }) {
  const [hover, setHover] = useState<number | null>(null)
  const [range, setRange] = useState<[number, number]>([0, all.length])
  const weeks = all.slice(range[0], range[1])
  const top = Math.ceil(Math.max(...weeks.map((w) => w.km)) / 50) * 50
  const grid = Array.from({ length: top / 50 }, (_, i) => (i + 1) * 50)
  const axis = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = axis.current
    if (!el) return
    const watch = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    watch.observe(el)
    return () => watch.disconnect()
  }, [])
  // Months get labels once there's room: every month, then every quarter, else years only
  const monthPx = (width / weeks.length) * 4.35
  const every = monthPx >= 34 ? 1 : monthPx >= 12 ? 3 : 12
  const ticks = weeks.flatMap((w, i) => {
    if (i === 0 || w.start.slice(0, 7) === weeks[i - 1].start.slice(0, 7)) return []
    const m = Number(w.start.slice(5, 7)) - 1
    if (m === 0) return [{ i, label: w.start.slice(0, 4), year: true }]
    return m % every === 0 ? [{ i, label: MONTHS[m], year: false }] : []
  })
  // With no January in view, the year sits at the left edge, so drop any month it would overlap
  const leftYear = !ticks.some((t) => t.year)
  const shown = leftYear ? ticks.filter((t) => (t.i / weeks.length) * width > 44) : ticks
  const hovered = hover === null ? null : weeks[hover]

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - box.left) / box.width) * weeks.length)
    setHover(Math.max(0, Math.min(weeks.length - 1, i)))
  }

  return (
    <div className="relative mt-8 pl-12">
      <div className="relative h-52" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {grid.map((km) => (
          <div key={km} className="absolute inset-x-0 border-t border-border" style={{ bottom: `${(km / top) * 100}%` }}>
            <span className="absolute -left-12 -translate-y-1/2 text-xs text-text-secondary tabular-nums">{km} km</span>
          </div>
        ))}
        <svg viewBox={`0 0 ${weeks.length} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {weeks.map((w, i) => {
            const dimmed = year !== null && Number(w.start.slice(0, 4)) !== year
            return (
              <rect
                key={w.start}
                x={i + 0.1}
                width={0.8}
                y={100 - (w.km / top) * 100}
                height={(w.km / top) * 100}
                className={i === hover ? 'fill-text-primary' : dimmed ? 'fill-accent/20' : 'fill-accent'}
              />
            )
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 border-t border-text-primary" />
        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap border border-text-primary bg-background px-2.5 py-1.5 text-xs text-text-primary"
            style={{ left: `${Math.min(92, Math.max(8, ((hover + 0.5) / weeks.length) * 100))}%` }}
          >
            <span className="block font-semibold tabular-nums">{fmt.format(Math.round(hovered.km * 10) / 10)} km</span>
            <span className="block text-text-secondary tabular-nums">
              Week of {shortDate(hovered.start)}, {hovered.runs} {hovered.runs === 1 ? 'run' : 'runs'}
            </span>
          </div>
        )}
      </div>
      <div ref={axis} className="relative mt-2 h-4">
        {leftYear && (
          <span className={`absolute left-0 text-xs tabular-nums ${every < 12 ? 'text-text-primary' : 'text-text-secondary'}`}>{weeks[0].start.slice(0, 4)}</span>
        )}
        {shown.map(({ i, label, year: isYear }) => (
          <span
            key={`${i}-${label}`}
            className={`absolute -translate-x-1/2 text-xs tabular-nums ${isYear && every < 12 ? 'text-text-primary' : 'text-text-secondary'}`}
            style={{ left: `${(i / weeks.length) * 100}%` }}
          >
            {isYear ? (
              <>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">’{label.slice(2)}</span>
              </>
            ) : (
              label
            )}
          </span>
        ))}
      </div>
      <RangeStrip weeks={all} range={range} onChange={setRange} />
    </div>
  )
}

type Drag = { mode: 'start' | 'end' | 'move'; x: number; range: [number, number] }

function RangeStrip({ weeks, range, onChange }: { weeks: Week[]; range: [number, number]; onChange: (r: [number, number]) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const n = weeks.length
  const top = Math.max(...weeks.map((w) => w.km))
  const [lo, hi] = range

  const clamp = (mode: Drag['mode'], [a, b]: [number, number], d: number): [number, number] => {
    if (mode === 'start') return [Math.max(0, Math.min(b - MIN_WEEKS, a + d)), b]
    if (mode === 'end') return [a, Math.min(n, Math.max(a + MIN_WEEKS, b + d))]
    const shift = Math.max(-a, Math.min(n - b, d))
    return [a + shift, b + shift]
  }

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const mode = (e.target as HTMLElement).closest<HTMLElement>('[data-mode]')?.dataset.mode as Drag['mode'] | undefined
    if (!mode) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { mode, x: e.clientX, range }
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !box.current) return
    const d = Math.round(((e.clientX - drag.current.x) / box.current.clientWidth) * n)
    onChange(clamp(drag.current.mode, drag.current.range, d))
  }
  const key = (mode: 'start' | 'end') => (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -52, PageUp: 52 }[e.key]
    if (step === undefined) return
    e.preventDefault()
    onChange(clamp(mode, range, step))
  }
  const handle = (mode: 'start' | 'end', at: number, label: string) => (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={n}
      aria-valuenow={at}
      aria-valuetext={shortDate(weeks[Math.min(at, n - 1)].start)}
      data-mode={mode}
      onKeyDown={key(mode)}
      className="absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize touch-none focus:outline-none focus-visible:[&>span]:bg-accent"
      style={{ left: `${(at / n) * 100}%` }}
    >
      <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-text-primary" />
    </div>
  )

  return (
    <div className="mt-6">
      <div ref={box} className="relative h-10 touch-none select-none" onPointerDown={down} onPointerMove={move} onPointerUp={() => (drag.current = null)}>
        <svg viewBox={`0 0 ${n} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {weeks.map((w, i) => (
            <rect key={w.start} x={i} width={1} y={100 - (w.km / top) * 100} height={(w.km / top) * 100} className="fill-text-secondary/40" />
          ))}
        </svg>
        <div
          data-mode="move"
          className="absolute inset-y-0 cursor-grab border-y border-text-primary bg-accent/15 active:cursor-grabbing"
          style={{ left: `${(lo / n) * 100}%`, right: `${100 - (hi / n) * 100}%` }}
        />
        {handle('start', lo, 'First week shown')}
        {handle('end', hi, 'Last week shown')}
      </div>
      <p className="mt-2 text-center text-xs text-text-secondary tabular-nums">
        Showing {shortDate(weeks[lo].start)} to {shortDate(weeks[hi - 1].start)}
      </p>
    </div>
  )
}
