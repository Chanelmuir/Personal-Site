'use client'

import { useState } from 'react'
import { formatPace, type MonthPace } from './stats'

const monthLabel = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-NZ', { month: 'long', year: 'numeric', timeZone: 'UTC' })

// Monthly average pace, faster at the top. The faint line is each month; the bold one is the
// 12-month rolling average, which smooths out slower winters.
export default function PaceChart({ months }: { months: MonthPace[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const paces = months.map((m) => m.pace)
  const fast = Math.floor(Math.min(...paces) / 15) * 15
  const slow = Math.ceil(Math.max(...paces) / 15) * 15
  const y = (pace: number) => ((pace - fast) / (slow - fast)) * 100
  const x = (i: number) => ((i + 0.5) / months.length) * 100
  const ticks = Array.from({ length: (slow - fast) / 15 + 1 }, (_, i) => fast + i * 15)
  const line = (values: (number | null)[]) =>
    values
      .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
      .filter(Boolean)
      .join(' ')
  const yearStarts = months.flatMap((m, i) => (m.month.endsWith('-01') ? [{ i, year: m.month.slice(0, 4) }] : []))
  const hovered = hover === null ? null : months[hover]

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const i = Math.floor(((e.clientX - box.left) / box.width) * months.length)
    setHover(Math.max(0, Math.min(months.length - 1, i)))
  }

  return (
    <div className="relative mt-8 pl-16">
      <div className="relative h-56" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 border-t border-border" style={{ top: `${y(t)}%` }}>
            <span className="absolute -left-16 -translate-y-1/2 text-xs text-text-secondary tabular-nums">{formatPace(t)}</span>
          </div>
        ))}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <polyline points={line(paces)} fill="none" className="stroke-accent/35" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <polyline points={line(months.map((m) => m.trend))} fill="none" className="stroke-accent" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        {hovered && hover !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 border-l border-text-primary/40" style={{ left: `${x(hover)}%` }} />
            <span
              className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-accent"
              style={{ left: `${x(hover)}%`, top: `${y(hovered.pace)}%` }}
            />
            <div
              className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap border border-text-primary bg-background px-2.5 py-1.5 text-xs text-text-primary"
              style={{ left: `${Math.min(90, Math.max(10, x(hover)))}%` }}
            >
              <span className="block font-semibold tabular-nums">{formatPace(hovered.pace)}</span>
              <span className="block text-text-secondary tabular-nums">
                {monthLabel(hovered.month)}, {hovered.runs} runs
              </span>
              {hovered.trend !== null && (
                <span className="block text-text-secondary tabular-nums">12-month average {formatPace(hovered.trend)}</span>
              )}
            </div>
          </>
        )}
      </div>
      <div className="relative mt-2 h-4">
        {yearStarts.map(({ i, year }) => (
          <span key={year} className="absolute -translate-x-1/2 text-xs text-text-secondary tabular-nums" style={{ left: `${x(i)}%` }}>
            <span className="hidden sm:inline">{year}</span>
            <span className="sm:hidden">’{year.slice(2)}</span>
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-accent/35" /> Each month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-5 bg-accent" /> 12-month average
        </span>
      </div>
    </div>
  )
}
