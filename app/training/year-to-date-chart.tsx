'use client'

import { useEffect, useRef, useState } from 'react'
import type { YearToDate } from './stats'

const fmt = new Intl.NumberFormat('en-NZ')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const LABEL_GAP = 6 // % of the chart height between end labels
const STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000]
// The latest year is always blue; other picked years take the next colour along
const COLOURS = ['#d9632a', '#2b8a57', '#a8357a', '#17232b', '#8a6d1c', '#0f8a99']
const MIN_DAYS = 7
const MIN_KM = 20

type View = { x: [number, number]; km: [number, number] }

const dayLabel = (day: number) => {
  const m = MONTH_START.findLastIndex((s) => s <= day)
  return `${day - MONTH_START[m] + 1} ${MONTHS[m]}`
}

// Longest stretch of days in a row with no running
function longestBreak(km: number[]) {
  let best = { from: 0, days: 0 }
  let from = -1
  for (let day = 0; day <= km.length; day++) {
    const rest = day < km.length && km[day] === (day === 0 ? 0 : km[day - 1])
    if (rest && from < 0) from = day
    if (!rest && from >= 0) {
      if (day - from > best.days) best = { from, days: day - from }
      from = -1
    }
  }
  return best
}

// Each year's running total, day by day, so the current year can be lined up against the rest.
// Years can be picked to stand out, ctrl + scroll zooms around the cursor (drag to pan once zoomed),
// and two picked years show the gap between them.
export default function YearToDateChart({ years, selected }: { years: YearToDate[]; selected: number | null }) {
  const current = years[years.length - 1].year
  const [picked, setPicked] = useState<number[]>([])
  const [hover, setHover] = useState<number | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [pan, setPan] = useState<{ x: number; y: number; view: View } | null>(null)
  const chart = useRef<HTMLDivElement>(null)

  const fullHigh = Math.max(...years.map((y) => y.km[y.km.length - 1]))
  const fullStep = STEPS.find((s) => fullHigh / s <= 6) ?? 2000
  const fullTop = Math.ceil(fullHigh / fullStep) * fullStep
  const [d0, d1] = view?.x ?? [0, 365]
  const [bottom, top] = view?.km ?? [0, fullTop]
  const span = d1 - d0
  const i0 = Math.floor(d0)
  const i1 = Math.ceil(d1)

  const shown = [current, ...picked, ...(selected !== null && !picked.includes(selected) && selected !== current ? [selected] : [])]
  const colour = (year: number) =>
    year === current ? 'var(--color-accent)' : year === selected && !picked.includes(year) ? 'var(--color-text-primary)' : COLOURS[picked.indexOf(year) % COLOURS.length]
  const isShown = (year: number) => shown.includes(year)
  const toggle = (year: number) =>
    year !== current && setPicked((p) => (p.includes(year) ? p.filter((y) => y !== year) : [...p, year]))

  const at = (y: YearToDate, day: number) => y.km[Math.min(day, y.km.length - 1)]
  const inView = years.filter((y) => y.km.length > i0)
  const step = STEPS.find((s) => (top - bottom) / s <= 6) ?? 2000
  const grid = Array.from({ length: Math.floor(top / step) - Math.ceil(bottom / step) + 1 }, (_, i) => (Math.ceil(bottom / step) + i) * step).filter(
    (km) => km > bottom || bottom > 0,
  )
  const yOf = (km: number) => 100 - ((km - bottom) / (top - bottom)) * 100
  const xOf = (day: number) => ((day - d0) / span) * 100
  const points = (y: YearToDate, from = i0, to = i1) =>
    y.km
      .slice(from, Math.min(to + 1, y.km.length))
      .map((km, i) => `${from + i - d0},${yOf(km)}`)
      .join(' ')

  // End labels, nudged apart so close finishes don't overlap
  const ends = inView
    .map((y) => {
      const day = Math.min(y.km.length, i1) - 1
      return { year: y.year, km: at(y, day), x: Math.min(100, xOf(day + 1)), y: yOf(at(y, day)) }
    })
    .sort((a, b) => a.y - b.y)
  const visibleEnds = ends.filter((e) => e.y >= 0 && e.y <= 100)
  const atRight = visibleEnds.filter((e) => e.x > 90)
  for (let i = 1; i < atRight.length; i++) {
    if (atRight[i].y - atRight[i - 1].y < LABEL_GAP) atRight[i].y = atRight[i - 1].y + LABEL_GAP
  }

  // With two years picked, shade the gap between them and mark where it was widest
  const pair = shown.length === 2 ? shown.map((year) => years.find((y) => y.year === year)!) : null
  const gap = pair && (() => {
    const [a, b] = pair
    const last = Math.min(a.km.length, b.km.length)
    let widest = i0
    for (let day = i0; day < Math.min(i1, last); day++) {
      if (Math.abs(a.km[day] - b.km[day]) > Math.abs(a.km[widest] - b.km[widest])) widest = day
    }
    const to = Math.min(i1, last - 1)
    const area = `${points(a, i0, to)} ${b.km
      .slice(i0, to + 1)
      .map((km, i) => `${to - i - d0},${yOf(b.km[to - i])}`)
      .join(' ')}`
    return { a, b, widest, area, ahead: a.km[widest] >= b.km[widest] ? a : b, km: Math.abs(a.km[widest] - b.km[widest]) }
  })()

  // Keeps a view inside the year and the km range; zoomed all the way out is no zoom at all
  const fit = (x: [number, number], km: [number, number]): View | null => {
    const w = Math.min(365, Math.max(MIN_DAYS, x[1] - x[0]))
    const h = Math.min(fullTop, Math.max(MIN_KM, km[1] - km[0]))
    if (w >= 365 && h >= fullTop) return null
    const x0 = Math.max(0, Math.min(365 - w, x[0]))
    const k0 = Math.max(0, Math.min(fullTop - h, km[0]))
    return { x: [x0, x0 + w], km: [k0, k0 + h] }
  }

  // Ctrl (or ⌘) + scroll, and trackpad pinch, zoom around the cursor. React's wheel handler is passive, so
  // this one is added by hand to be allowed to stop the page zooming.
  useEffect(() => {
    const el = chart.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const box = el.getBoundingClientRect()
      const fx = (e.clientX - box.left) / box.width
      const fy = (e.clientY - box.top) / box.height
      const f = Math.exp(Math.max(-0.4, Math.min(0.4, e.deltaY * 0.004)))
      setView((v) => {
        const [x0, x1] = v?.x ?? [0, 365]
        const [k0, k1] = v?.km ?? [0, fullTop]
        const cx = x0 + fx * (x1 - x0)
        const ck = k1 - fy * (k1 - k0)
        const w = (x1 - x0) * f
        const h = (k1 - k0) * f
        return fit([cx - fx * w, cx - fx * w + w], [ck - (1 - fy) * h, ck - (1 - fy) * h + h])
      })
      setHover(null)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  const dayAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return Math.max(i0, Math.min(Math.min(i1, 365) - 1, Math.round(d0 + ((e.clientX - box.left) / box.width) * span)))
  }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!view) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setPan({ x: e.clientX, y: e.clientY, view })
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pan) return setHover(dayAt(e))
    const box = e.currentTarget.getBoundingClientRect()
    const dx = ((e.clientX - pan.x) / box.width) * (pan.view.x[1] - pan.view.x[0])
    const dk = ((e.clientY - pan.y) / box.height) * (pan.view.km[1] - pan.view.km[0])
    setView(fit([pan.view.x[0] - dx, pan.view.x[1] - dx], [pan.view.km[0] + dk, pan.view.km[1] + dk]))
  }

  const rows =
    hover === null
      ? []
      : years
          .filter((y) => hover < y.km.length)
          .map((y) => ({ year: y.year, km: y.km[hover] }))
          .sort((a, b) => b.km - a.km)

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Highlight years">
        {years.map((y) => {
          const on = isShown(y.year)
          return (
            <button
              key={y.year}
              type="button"
              onClick={() => toggle(y.year)}
              aria-pressed={on}
              disabled={y.year === current}
              className={`flex items-center gap-1.5 border px-2.5 py-1 text-sm tabular-nums transition-colors ${
                on ? 'border-text-primary text-text-primary' : 'border-border text-text-secondary hover:border-text-primary hover:text-text-primary'
              }`}
            >
              <span className="block h-2.5 w-2.5 rounded-full" style={{ background: on ? colour(y.year) : 'var(--color-border)' }} />
              {y.year}
            </button>
          )
        })}
        {view && (
          <button
            type="button"
            onClick={() => setView(null)}
            className="ml-auto border border-text-primary px-2.5 py-1 text-sm text-text-primary hover:bg-text-primary hover:text-background"
          >
            Show the whole year
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-text-secondary">Pick years to compare. Hold Ctrl (⌘ on a Mac) and scroll over the chart to zoom, then drag to move around.</p>

      <div className="relative mt-6 pr-24 pl-14">
        <div
          ref={chart}
          className={`relative h-72 select-none ${view ? (pan ? 'cursor-grabbing' : 'cursor-grab') : ''} ${view ? 'touch-none' : 'touch-pan-y'}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => setPan(null)}
          onPointerLeave={() => !pan && setHover(null)}
        >
          {grid.map((km) => (
            <div key={km} className="absolute inset-x-0 border-t border-border" style={{ top: `${yOf(km)}%` }}>
              <span className="absolute -left-14 -translate-y-1/2 text-xs text-text-secondary tabular-nums">{fmt.format(km)} km</span>
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 border-t border-text-primary" />
          <svg viewBox={`0 0 ${span} 100`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-hidden" aria-hidden="true">
            {gap && <polygon points={gap.area} style={{ fill: colour(gap.ahead.year) }} fillOpacity={0.12} />}
            {[...inView]
              .sort((a, b) => Number(isShown(a.year)) - Number(isShown(b.year)))
              .map((y) => {
                const on = isShown(y.year)
                const rest = longestBreak(y.km)
                return (
                  <g key={y.year}>
                    <polyline
                      points={points(y)}
                      fill="none"
                      className={on ? undefined : 'stroke-text-secondary/35'}
                      style={on ? { stroke: colour(y.year) } : undefined}
                      strokeWidth={on ? 2.5 : 1.25}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    {on && rest.days > 1 && rest.from + rest.days > d0 && rest.from < d1 && (
                      <polyline
                        points={points(y, Math.max(d0, rest.from - 1), Math.min(d1, rest.from + rest.days - 1))}
                        fill="none"
                        style={{ stroke: colour(y.year) }}
                        strokeOpacity={0.3}
                        strokeWidth={9}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                )
              })}
          </svg>
          {gap && gap.widest >= d0 && gap.widest < d1 && (
            <div
              className="pointer-events-none absolute border-l border-dashed border-text-primary"
              style={{
                left: `${xOf(gap.widest)}%`,
                top: `${Math.max(0, yOf(Math.max(gap.a.km[gap.widest], gap.b.km[gap.widest])))}%`,
                bottom: `${Math.max(0, 100 - yOf(Math.min(gap.a.km[gap.widest], gap.b.km[gap.widest])))}%`,
              }}
            >
              <span
                className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap bg-background/90 px-1 text-xs text-text-primary tabular-nums ${
                  xOf(gap.widest) > 60 ? 'right-1' : 'left-1'
                }`}
              >
                Widest gap {fmt.format(Math.round(gap.km))} km, {dayLabel(gap.widest)}
              </span>
            </div>
          )}
          {visibleEnds.map((e) => (
            <button
              key={e.year}
              type="button"
              tabIndex={-1}
              onPointerDown={(ev) => ev.stopPropagation()}
              onClick={() => toggle(e.year)}
              className={`absolute ml-2 -translate-y-1/2 text-xs whitespace-nowrap tabular-nums ${isShown(e.year) ? 'font-semibold' : 'text-text-secondary hover:text-text-primary'}`}
              style={{ left: `${e.x}%`, top: `${e.y}%`, color: isShown(e.year) ? colour(e.year) : undefined }}
            >
              {e.year} <span className="hidden sm:inline">{fmt.format(Math.round(e.km))}</span>
            </button>
          ))}
          {hover !== null && !pan && (
            <>
              <div className="pointer-events-none absolute inset-y-0 border-l border-text-primary/40" style={{ left: `${xOf(hover)}%` }} />
              <div
                className={`pointer-events-none absolute top-0 z-10 border border-text-primary bg-background px-2.5 py-1.5 text-xs whitespace-nowrap text-text-primary ${
                  xOf(hover) > 60 ? '-translate-x-full -ml-3' : 'ml-3'
                }`}
                style={{ left: `${xOf(hover)}%` }}
              >
                <span className="mb-1 block font-semibold">By {dayLabel(hover)}</span>
                {rows.map((r) => (
                  <span
                    key={r.year}
                    className={`flex justify-between gap-4 tabular-nums ${isShown(r.year) ? 'font-semibold' : 'text-text-secondary'}`}
                    style={{ color: isShown(r.year) ? colour(r.year) : undefined }}
                  >
                    <span>{r.year}</span>
                    <span>{fmt.format(Math.round(r.km))} km</span>
                  </span>
                ))}
                {gap && hover < Math.min(gap.a.km.length, gap.b.km.length) && (
                  <span className="mt-1 flex justify-between gap-4 border-t border-border pt-1 tabular-nums">
                    <span>Gap</span>
                    <span>{fmt.format(Math.round(Math.abs(gap.a.km[hover] - gap.b.km[hover])))} km</span>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="relative mt-2 h-4 overflow-hidden">
          {span >= 90
            ? MONTHS.map((m, i) =>
                MONTH_START[i] >= d0 && xOf(MONTH_START[i]) < 95 ? (
                  <span key={m} className="absolute text-xs text-text-secondary" style={{ left: `${xOf(MONTH_START[i])}%` }}>
                    <span className="hidden sm:inline">{m}</span>
                    <span className="sm:hidden">{i % 3 === 0 || span < 365 ? m : ''}</span>
                  </span>
                ) : null,
              )
            : [Math.ceil(d0), Math.round((d0 + d1) / 2), Math.floor(d1) - 1].map((day, i) => (
                <span
                  key={day}
                  className={`absolute text-xs whitespace-nowrap text-text-secondary ${i === 1 ? '-translate-x-1/2' : i === 2 ? '-translate-x-full' : ''}`}
                  style={{ left: `${xOf(i === 2 ? day + 1 : day)}%` }}
                >
                  {dayLabel(day)}
                </span>
              ))}
        </div>
      </div>

      {shown.length > 0 && (
        <ul className="mt-6 grid gap-x-8 gap-y-1 text-sm text-text-secondary sm:grid-cols-2">
          {shown
            .map((year) => years.find((y) => y.year === year)!)
            .map((y) => {
              const rest = longestBreak(y.km)
              return (
                <li key={y.year} className="flex items-baseline gap-2 tabular-nums">
                  <span className="block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colour(y.year) }} />
                  <span>
                    <span className="font-semibold text-text-primary">{y.year}</span>: {fmt.format(Math.round(y.km[y.km.length - 1]))} km
                    {rest.days > 1 && (
                      <>
                        , longest break {rest.days} days ({dayLabel(rest.from)} to {dayLabel(rest.from + rest.days - 1)})
                      </>
                    )}
                  </span>
                </li>
              )
            })}
        </ul>
      )}
    </div>
  )
}
