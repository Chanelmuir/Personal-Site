'use client'

import { useState } from 'react'

const DAY = 86_400_000
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

// Darker for longer days: nothing, under 5 km, under 10, under 15, under 21, a half marathon or more
const STEPS = [5, 10, 15, 21]
const SHADES = ['bg-border/60', 'bg-accent/20', 'bg-accent/40', 'bg-accent/60', 'bg-accent/80', 'bg-accent']
const shade = (km: number) => (km <= 0 ? SHADES[0] : SHADES[1 + STEPS.filter((s) => km >= s).length])

const iso = (t: number) => new Date(t).toISOString().slice(0, 10)
const longDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' })

// One square per day of the year, a column per week, GitHub style
export default function RunCalendar({ days, year }: { days: Record<string, number>; year: number }) {
  // Days after the latest run haven't happened yet (or aren't in the data), so they stay blank
  const latest = Object.keys(days).sort().at(-1) ?? ''
  const [hover, setHover] = useState<{ date: string; col: number; row: number } | null>(null)

  const jan1 = Date.UTC(year, 0, 1)
  const first = jan1 - ((new Date(jan1).getUTCDay() + 6) % 7) * DAY
  const end = Date.UTC(year + 1, 0, 1)
  const columns = Math.ceil((end - first) / (7 * DAY))
  const cells: { date: string | null; col: number; row: number }[] = []
  for (let col = 0; col < columns; col++) {
    for (let row = 0; row < 7; row++) {
      const t = first + (col * 7 + row) * DAY
      cells.push({ date: t >= jan1 && t < end ? iso(t) : null, col, row })
    }
  }
  const months = Array.from({ length: 12 }, (_, m) => {
    const t = Date.UTC(year, m, 1)
    return { label: new Date(t).toLocaleDateString('en-NZ', { month: 'short', timeZone: 'UTC' }), col: Math.floor((t - first) / (7 * DAY)) }
  })
  const total = Object.entries(days).filter(([d]) => d.startsWith(String(year)))
  const runDays = total.filter(([, km]) => km > 0).length

  return (
    <div className="mt-6">
      <p className="text-sm text-text-secondary tabular-nums">
        {year}: ran on {runDays} days
      </p>
      <div className="mt-4 overflow-x-auto pb-2">
        <div className="relative min-w-[640px] pl-9">
          <div className="relative mb-1 h-4">
            {months.map((m) => (
              <span key={m.label} className="absolute text-xs text-text-secondary" style={{ left: `${(m.col / columns) * 100}%` }}>
                {m.label}
              </span>
            ))}
          </div>
          <div className="relative">
            <div className="absolute top-0 -left-9 grid h-full grid-rows-7 text-[11px] leading-none text-text-secondary">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="flex items-center">
                  {d}
                </span>
              ))}
            </div>
            <div
              className="grid grid-flow-col grid-rows-7 gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              onPointerLeave={() => setHover(null)}
            >
              {cells.map((c) =>
                c.date && c.date > latest ? (
                  <div key={c.date} className="aspect-square rounded-[2px] border border-border/70" />
                ) : c.date ? (
                  <div
                    key={c.date}
                    onPointerEnter={() => setHover({ date: c.date!, col: c.col, row: c.row })}
                    className={`aspect-square rounded-[2px] ${shade(days[c.date] ?? 0)} ${
                      hover?.date === c.date ? 'outline outline-1 outline-text-primary' : ''
                    }`}
                  />
                ) : (
                  <div key={`${c.col}-${c.row}`} />
                ),
              )}
            </div>
            {hover && (
              <div
                className="pointer-events-none absolute z-10 mb-2 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-text-primary bg-background px-2.5 py-1.5 text-xs text-text-primary"
                style={{ left: `${((hover.col + 0.5) / columns) * 100}%`, top: `${(hover.row / 7) * 100}%` }}
              >
                <span className="block font-semibold tabular-nums">
                  {days[hover.date] ? `${(Math.round(days[hover.date] * 10) / 10).toFixed(1)} km` : 'Rest day'}
                </span>
                <span className="block text-text-secondary">{longDate(hover.date)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-text-secondary">
            <span>Rest</span>
            {SHADES.map((s) => (
              <span key={s} className={`size-3 rounded-[2px] ${s}`} />
            ))}
            <span>21 km+</span>
          </div>
        </div>
      </div>
    </div>
  )
}
