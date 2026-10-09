'use client'

import { useState } from 'react'
import type { Week } from './stats'

const fmt = new Intl.NumberFormat('en-NZ')
const shortDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

// One thin bar per week, every week since the first run. The chosen year stays full strength.
export default function WeeklyChart({ weeks, year }: { weeks: Week[]; year: number | null }) {
  const [hover, setHover] = useState<number | null>(null)
  const top = Math.ceil(Math.max(...weeks.map((w) => w.km)) / 50) * 50
  const grid = Array.from({ length: top / 50 }, (_, i) => (i + 1) * 50)
  const yearStarts = weeks.flatMap((w, i) =>
    i > 0 && w.start.slice(0, 4) !== weeks[i - 1].start.slice(0, 4) ? [{ i, year: w.start.slice(0, 4) }] : [],
  )
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
      <div className="relative mt-2 h-4">
        {yearStarts.map(({ i, year: label }) => (
          <span
            key={label}
            className="absolute -translate-x-1/2 text-xs text-text-secondary tabular-nums"
            style={{ left: `${(i / weeks.length) * 100}%` }}
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">’{label.slice(2)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
