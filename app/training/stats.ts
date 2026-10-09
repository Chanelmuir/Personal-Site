// Run summaries shaped for the training charts. Dates are NZ calendar dates (YYYY-MM-DD).

export type Run = { date: string; km: number; secs: number }

const DAY = 86_400_000

const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`)
const toDate = (time: number) => new Date(time).toISOString().slice(0, 10)

// Monday of the week a date falls in
export function weekStart(date: string) {
  const t = toTime(date)
  const weekday = (new Date(t).getUTCDay() + 6) % 7
  return toDate(t - weekday * DAY)
}

export type Week = { start: string; km: number; runs: number }

// Every week from the first run to the last, including empty ones
export function weeklyTotals(runs: Run[]): Week[] {
  const byWeek = new Map<string, Week>()
  for (const run of runs) {
    const start = weekStart(run.date)
    const week = byWeek.get(start) ?? { start, km: 0, runs: 0 }
    week.km += run.km
    week.runs += 1
    byWeek.set(start, week)
  }
  const weeks: Week[] = []
  const last = toTime(weekStart(runs[runs.length - 1].date))
  for (let t = toTime(weekStart(runs[0].date)); t <= last; t += 7 * DAY) {
    const start = toDate(t)
    weeks.push(byWeek.get(start) ?? { start, km: 0, runs: 0 })
  }
  return weeks
}

// Distance run on each day, keyed by date
export function dailyTotals(runs: Run[]): Record<string, number> {
  const days: Record<string, number> = {}
  for (const run of runs) days[run.date] = (days[run.date] ?? 0) + run.km
  return days
}

export type MonthPace = { month: string; pace: number; trend: number | null; runs: number }

// Average pace per month (total time over total distance, seconds per km), plus a 12-month
// rolling average to smooth out the seasons. Runs with an impossible pace (GPS glitches,
// a watch left running) are left out.
export function monthlyPace(runs: Run[]): MonthPace[] {
  const byMonth = new Map<string, { secs: number; km: number; runs: number }>()
  for (const run of runs) {
    if (run.km < 1) continue
    const pace = run.secs / run.km
    if (pace < 150 || pace > 540) continue
    const month = run.date.slice(0, 7)
    const total = byMonth.get(month) ?? { secs: 0, km: 0, runs: 0 }
    total.secs += run.secs
    total.km += run.km
    total.runs += 1
    byMonth.set(month, total)
  }
  const months = [...byMonth.entries()]
    .filter(([, m]) => m.runs >= 3)
    .sort(([a], [b]) => a.localeCompare(b))
  return months.map(([month, m], i) => {
    const window = months.slice(Math.max(0, i - 11), i + 1).map(([, w]) => w)
    const trend = window.length < 12 ? null : window.reduce((s, w) => s + w.secs, 0) / window.reduce((s, w) => s + w.km, 0)
    return { month, pace: m.secs / m.km, trend, runs: m.runs }
  })
}

export function formatPace(secsPerKm: number) {
  const whole = Math.round(secsPerKm)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')} /km`
}
