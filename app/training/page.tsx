import type { Metadata } from 'next'
import Link from 'next/link'
import activities from './activities.json'
import TrainingExplorer, { type YearTotal } from './training-explorer'

export const metadata: Metadata = {
  title: 'Every run since 2018 | Chanel Muir',
}

// [date, type, km, moving seconds, climb m, avg HR], built by scripts/build-training-data.py
type Activity = [string, string, number, number, number | null, number | null]

const EARTH_KM = 40075
const fmt = new Intl.NumberFormat('en-NZ')

export default function TrainingPage() {
  const all = activities as Activity[]
  const totalKm = all.reduce((sum, a) => sum + a[2], 0)
  const runs = all.filter((a) => a[1] === 'Run')
  const longest = Math.max(...runs.map((a) => a[2]))
  const first = all[0][0]
  const last = all[all.length - 1][0]

  const byYear = new Map<number, YearTotal>()
  for (const [date, , km] of all) {
    const year = Number(date.slice(0, 4))
    const total = byYear.get(year) ?? { year, km: 0, activities: 0 }
    total.km += km
    total.activities += 1
    byYear.set(year, total)
  }
  const years = [...byYear.values()].sort((a, b) => a.year - b.year)
  years[0].partial = `from ${new Date(first).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' })}`
  years[years.length - 1].partial = 'so far'

  const stats = [
    { value: `${fmt.format(Math.round(totalKm))} km`, label: `${Math.round((totalKm / EARTH_KM) * 100)}% of the way around the Earth` },
    { value: fmt.format(runs.length), label: `runs, plus ${fmt.format(all.length - runs.length)} walks, hikes and rides` },
    { value: `${longest.toFixed(1)} km`, label: 'longest run' },
  ]

  return (
    <div className="overflow-x-hidden pb-24">
      <header className="mx-auto w-full max-w-6xl px-6 pt-10 pb-8 sm:px-16">
        <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold leading-[0.95] tracking-[-0.03em] text-text-primary [font-stretch:125%]">
          Every run since 2018
        </h1>
        <p className="mt-4 max-w-[60ch] text-text-secondary">
          Everything I&apos;ve recorded, first on Strava and now on my COROS watch, drawn on one map. The roads I run
          most build up darkest.
        </p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="border-t-[1.5px] border-text-primary pt-3">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-3xl font-bold tabular-nums tracking-[-0.02em] text-text-primary [font-stretch:115%]">
                {s.value}
              </dd>
              <dd className="mt-1 text-sm text-text-secondary">{s.label}</dd>
            </div>
          ))}
        </dl>
      </header>

      <TrainingExplorer years={years} />

      <p className="mx-auto mt-12 w-full max-w-6xl px-6 text-sm text-text-secondary sm:px-16">
        Strava activities up to July 2026 come from{' '}
        <Link href="/projects/sleevemap" className="run-link text-text-primary hover:text-accent">
          SleeveMap
        </Link>
        , and everything since from COROS. Indoor sessions count towards the totals but have no route. Routes are
        cut short near the places I start from most. Updated {new Date(last).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}.
      </p>
    </div>
  )
}
