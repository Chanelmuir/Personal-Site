import type { Metadata } from 'next'
import activities from './activities.json'
import TrainingExplorer, { type YearTotal } from './training-explorer'
import { dailyTotals, monthlyPace, weeklyTotals, yearToDate, type Run } from './stats'

export const metadata: Metadata = {
  title: 'My running stats | Chanel Muir',
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
  const first = runs[0][0]
  const runList: Run[] = runs.map(([date, , km, secs]) => ({ date, km, secs }))

  const byYear = new Map<number, YearTotal>()
  for (const [date, , km] of runs) {
    const year = Number(date.slice(0, 4))
    const total = byYear.get(year) ?? { year, km: 0, runs: 0 }
    total.km += km
    total.runs += 1
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
          My running stats
        </h1>
        <dl className="mt-6 grid gap-6 sm:grid-cols-3">
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

      <TrainingExplorer
        years={years}
        weeks={weeklyTotals(runList)}
        days={dailyTotals(runList)}
        paces={monthlyPace(runList)}
        ytd={yearToDate(runList)}
      />
    </div>
  )
}
