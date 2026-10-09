'use client'

import { useState } from 'react'
import TrainingMap from './training-map'

export type YearTotal = { year: number; km: number; activities: number; partial?: string }

const fmt = new Intl.NumberFormat('en-NZ')

// The year buttons and the distance chart both pick which year the map shows
export default function TrainingExplorer({ years }: { years: YearTotal[] }) {
  const [year, setYear] = useState<number | null>(null)
  const max = Math.max(...years.map((y) => y.km))

  const chip = (label: string, value: number | null) => (
    <button
      key={label}
      type="button"
      onClick={() => setYear(value)}
      aria-pressed={year === value}
      className={`border px-2.5 py-1 text-sm tabular-nums transition-colors ${
        year === value
          ? 'border-text-primary bg-text-primary text-background'
          : 'border-border text-text-secondary hover:border-text-primary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap gap-2 px-6 pb-4 sm:px-16" role="group" aria-label="Show year">
        {chip('All years', null)}
        {years.map((y) => chip(String(y.year), y.year))}
      </div>

      <div className="mx-auto w-full max-w-6xl sm:px-16">
        <TrainingMap year={year} />
      </div>

      <section className="mx-auto w-full max-w-6xl px-6 pt-16 sm:px-16" aria-labelledby="by-year">
        <h2 id="by-year" className="font-serif text-2xl text-text-primary">
          Distance by year
        </h2>
        <div className="mt-8 flex h-56 items-end gap-1.5 border-b border-text-primary sm:gap-3">
          {years.map((y) => {
            const dimmed = year !== null && year !== y.year
            return (
              <button
                key={y.year}
                type="button"
                onClick={() => setYear(year === y.year ? null : y.year)}
                aria-label={`${y.year}: ${fmt.format(Math.round(y.km))} km over ${y.activities} activities${y.partial ? ` (${y.partial})` : ''}`}
                className="group relative flex h-full min-w-0 flex-1 items-end focus-visible:outline-none"
              >
                <span
                  className={`mx-auto block w-full max-w-16 rounded-t-[4px] transition-opacity ${
                    dimmed ? 'bg-accent/25' : 'bg-accent'
                  } group-hover:opacity-80 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-text-primary`}
                  style={{ height: `${(y.km / max) * 100}%` }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap border border-text-primary bg-background px-2.5 py-1.5 text-left text-xs text-text-primary group-hover:block group-focus-visible:block">
                  <span className="block font-semibold tabular-nums">{fmt.format(Math.round(y.km))} km</span>
                  <span className="block text-text-secondary tabular-nums">
                    {y.activities} activities{y.partial ? `, ${y.partial}` : ''}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex gap-1.5 sm:gap-3">
          {years.map((y) => (
            <div key={y.year} className="min-w-0 flex-1 text-center">
              <div className="text-xs text-text-primary tabular-nums sm:text-sm">{y.year}</div>
              <div className="hidden text-xs text-text-secondary tabular-nums sm:block">
                {fmt.format(Math.round(y.km))} km
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
