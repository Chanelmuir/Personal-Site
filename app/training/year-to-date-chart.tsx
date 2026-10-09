'use client'

import { useState } from 'react'
import type { YearToDate } from './stats'

const fmt = new Intl.NumberFormat('en-NZ')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const LABEL_GAP = 6 // % of the chart height between end labels

const dayLabel = (day: number) => {
  const m = MONTH_START.findLastIndex((s) => s <= day)
  return `${day - MONTH_START[m] + 1} ${MONTHS[m]}`
}

// Each year's running total, day by day, so the current year can be lined up against the rest.
// The latest year is the bold one; a year picked with the year buttons is drawn in ink.
export default function YearToDateChart({ years, selected }: { years: YearToDate[]; selected: number | null }) {
  const [hover, setHover] = useState<number | null>(null)
  const current = years[years.length - 1].year
  const top = Math.ceil(Math.max(...years.map((y) => y.km[y.km.length - 1])) / 1000) * 1000
  const grid = Array.from({ length: top / 1000 }, (_, i) => (i + 1) * 1000)
  const yOf = (km: number) => 100 - (km / top) * 100

  const style = (year: number) =>
    year === selected
      ? { stroke: 'stroke-text-primary', text: 'text-text-primary font-semibold', width: 2.5 }
      : year === current
        ? { stroke: 'stroke-accent', text: 'text-accent font-semibold', width: 2.5 }
        : { stroke: 'stroke-text-secondary/35', text: 'text-text-secondary', width: 1.25 }

  // End labels, nudged apart so close finishes don't overlap
  const ends = years
    .map((y) => ({ year: y.year, km: y.km[y.km.length - 1], x: ((y.km.length - 1) / 365) * 100, y: yOf(y.km[y.km.length - 1]) }))
    .sort((a, b) => a.y - b.y)
  const atYearEnd = ends.filter((e) => e.x > 90)
  for (let i = 1; i < atYearEnd.length; i++) {
    if (atYearEnd[i].y - atYearEnd[i - 1].y < LABEL_GAP) atYearEnd[i].y = atYearEnd[i - 1].y + LABEL_GAP
  }

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    setHover(Math.max(0, Math.min(364, Math.round(((e.clientX - box.left) / box.width) * 365))))
  }
  const rows =
    hover === null
      ? []
      : years
          .filter((y) => hover < y.km.length)
          .map((y) => ({ year: y.year, km: y.km[hover] }))
          .sort((a, b) => b.km - a.km)

  return (
    <div className="relative mt-8 pr-24 pl-14">
      <div className="relative h-72" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {grid.map((km) => (
          <div key={km} className="absolute inset-x-0 border-t border-border" style={{ top: `${yOf(km)}%` }}>
            <span className="absolute -left-14 -translate-y-1/2 text-xs text-text-secondary tabular-nums">{fmt.format(km)} km</span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 border-t border-text-primary" />
        <svg viewBox="0 0 365 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          {[...years]
            .sort((a, b) => (a.year === selected || a.year === current ? 1 : 0) - (b.year === selected || b.year === current ? 1 : 0))
            .map((y) => {
              const s = style(y.year)
              return (
                <polyline
                  key={y.year}
                  points={y.km.map((km, day) => `${day},${yOf(km)}`).join(' ')}
                  fill="none"
                  className={s.stroke}
                  strokeWidth={s.width}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
        </svg>
        {ends.map((e) => (
          <span
            key={e.year}
            className={`absolute ml-2 -translate-y-1/2 text-xs whitespace-nowrap tabular-nums ${style(e.year).text}`}
            style={{ left: `${e.x}%`, top: `${e.y}%` }}
          >
            {e.year} <span className="hidden sm:inline">{fmt.format(Math.round(e.km))}</span>
          </span>
        ))}
        {hover !== null && (
          <>
            <div className="pointer-events-none absolute inset-y-0 border-l border-text-primary/40" style={{ left: `${(hover / 365) * 100}%` }} />
            <div
              className={`pointer-events-none absolute top-0 z-10 border border-text-primary bg-background px-2.5 py-1.5 text-xs text-text-primary ${
                hover > 220 ? '-translate-x-full -ml-3' : 'ml-3'
              }`}
              style={{ left: `${(hover / 365) * 100}%` }}
            >
              <span className="mb-1 block font-semibold">By {dayLabel(hover)}</span>
              {rows.map((r) => (
                <span key={r.year} className={`flex justify-between gap-4 tabular-nums ${style(r.year).text}`}>
                  <span>{r.year}</span>
                  <span>{fmt.format(Math.round(r.km))} km</span>
                </span>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="relative mt-2 h-4">
        {MONTHS.map((m, i) => (
          <span key={m} className="absolute text-xs text-text-secondary" style={{ left: `${(MONTH_START[i] / 365) * 100}%` }}>
            <span className="hidden sm:inline">{m}</span>
            <span className="sm:hidden">{i % 3 === 0 ? m : ''}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
