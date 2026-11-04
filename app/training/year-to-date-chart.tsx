'use client'

import { useState } from 'react'
import type { YearToDate } from './stats'

const fmt = new Intl.NumberFormat('en-NZ')
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const LABEL_GAP = 6 // % of the chart height between end labels
const STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000]
// The latest year is always blue; other picked years take the next colour along
const COLOURS = ['#d9632a', '#2b8a57', '#a8357a', '#17232b', '#8a6d1c', '#0f8a99']
const MIN_ZOOM = 7

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
// Years can be picked to stand out, dragging a box on the chart zooms into it, and two picked years show
// the gap between them.
export default function YearToDateChart({ years, selected }: { years: YearToDate[]; selected: number | null }) {
  const current = years[years.length - 1].year
  const [picked, setPicked] = useState<number[]>([])
  const [hover, setHover] = useState<number | null>(null)
  const [zoom, setZoom] = useState<[number, number]>([0, 365])
  const [kmZoom, setKmZoom] = useState<[number, number] | null>(null)
  const [drag, setDrag] = useState<{ day: number; km: number }[] | null>(null)
  const [d0, d1] = zoom
  const span = d1 - d0

  const shown = [current, ...picked, ...(selected !== null && !picked.includes(selected) && selected !== current ? [selected] : [])]
  const colour = (year: number) =>
    year === current ? 'var(--color-accent)' : year === selected && !picked.includes(year) ? 'var(--color-text-primary)' : COLOURS[picked.indexOf(year) % COLOURS.length]
  const isShown = (year: number) => shown.includes(year)
  const toggle = (year: number) =>
    year !== current && setPicked((p) => (p.includes(year) ? p.filter((y) => y !== year) : [...p, year]))

  // Scale the km axis to whatever is in view
  const at = (y: YearToDate, day: number) => y.km[Math.min(day, y.km.length - 1)]
  const inView = years.filter((y) => y.km.length > d0)
  const low = Math.min(...inView.map((y) => at(y, d0)))
  const high = Math.max(...inView.map((y) => at(y, d1 - 1)))
  const [from, to] = kmZoom ?? [low, high]
  const step = STEPS.find((s) => (to - from) / s <= 6) ?? 2000
  // A box zoom keeps exactly the km range drawn; otherwise round out to the grid
  const bottom = kmZoom ? from : Math.floor(from / step) * step
  const top = kmZoom ? to : Math.max(bottom + step, Math.ceil(to / step) * step)
  const grid = Array.from({ length: Math.floor(top / step) - Math.ceil(bottom / step) + 1 }, (_, i) => (Math.ceil(bottom / step) + i) * step).filter(
    (km) => km > bottom || bottom > 0,
  )
  const yOf = (km: number) => 100 - ((km - bottom) / (top - bottom)) * 100
  const xOf = (day: number) => ((day - d0) / span) * 100
  const points = (y: YearToDate, from = d0, to = d1) =>
    y.km
      .slice(from, Math.min(to + 1, y.km.length))
      .map((km, i) => `${from + i - d0},${yOf(km)}`)
      .join(' ')

  // End labels, nudged apart so close finishes don't overlap
  const ends = inView
    .map((y) => {
      const day = Math.min(y.km.length, d1) - 1
      return { year: y.year, km: at(y, day), x: xOf(day + 1), y: yOf(at(y, day)) }
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
    let widest = d0
    for (let day = d0; day < Math.min(d1, last); day++) {
      if (Math.abs(a.km[day] - b.km[day]) > Math.abs(a.km[widest] - b.km[widest])) widest = day
    }
    const to = Math.min(d1, last - 1)
    const area = `${points(a, d0, to)} ${b.km
      .slice(d0, to + 1)
      .map((km, i) => `${to - i - d0},${yOf(b.km[to - i])}`)
      .join(' ')}`
    return { a, b, widest, area, ahead: a.km[widest] >= b.km[widest] ? a : b, km: Math.abs(a.km[widest] - b.km[widest]) }
  })()

  const pointAt = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const fy = Math.max(0, Math.min(1, (e.clientY - box.top) / box.height))
    return {
      day: Math.max(d0, Math.min(d1 - 1, Math.round(d0 + ((e.clientX - box.left) / box.width) * span))),
      km: top - fy * (top - bottom),
    }
  }
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag([pointAt(e), pointAt(e)])
  }
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointAt(e)
    setHover(p.day)
    if (drag) setDrag([drag[0], p])
  }
  const onUp = () => {
    if (drag) {
      const [a, b] = drag
      const days: [number, number] = [Math.min(a.day, b.day), Math.max(a.day, b.day) + 1]
      const kms: [number, number] = [Math.min(a.km, b.km), Math.max(a.km, b.km)]
      if (days[1] - days[0] >= MIN_ZOOM) {
        setZoom(days)
        // A flat swipe zooms the dates only and lets the km axis fit itself
        setKmZoom(kms[1] - kms[0] > (top - bottom) * 0.05 ? kms : null)
        setHover(null)
      }
    }
    setDrag(null)
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
        {(span < 365 || kmZoom) && (
          <button
            type="button"
            onClick={() => {
              setZoom([0, 365])
              setKmZoom(null)
            }}
            className="ml-auto border border-text-primary px-2.5 py-1 text-sm text-text-primary hover:bg-text-primary hover:text-background"
          >
            Show the whole year
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-text-secondary">Pick years to compare. Drag a box on the chart to zoom in.</p>

      <div className="relative mt-6 pr-24 pl-14">
        <div
          className="relative h-72 cursor-crosshair touch-pan-y select-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={() => !drag && setHover(null)}
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
          {drag && drag[0].day !== drag[1].day && (
            <div
              className="pointer-events-none absolute border border-accent bg-accent/10"
              style={{
                left: `${xOf(Math.min(drag[0].day, drag[1].day))}%`,
                width: `${(Math.abs(drag[1].day - drag[0].day) / span) * 100}%`,
                top: `${yOf(Math.max(drag[0].km, drag[1].km))}%`,
                bottom: `${100 - yOf(Math.min(drag[0].km, drag[1].km))}%`,
              }}
            />
          )}
          {hover !== null && !drag && (
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
            : [d0, Math.round((d0 + d1) / 2), d1 - 1].map((day, i) => (
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
