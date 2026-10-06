import results from './results-2026.json'

export interface Segment {
  label: string
  short: string
  km: number | null
  legs: number[]
  combined: boolean
  note: string | null
  // The recorded times are wrong (but consistently so), so show no pace.
  paceHidden: boolean
}

export interface Team {
  id: number
  place: string
  team: string
  club: string | null
  category: string
  finish: number | null
  splits: (number | null)[]
  runners: (string | null)[]
}

export interface RelayEvent {
  id: number
  name: string
  legCount: number
  totalKm: number | null
  segments: Segment[]
  categories: { name: string; short: string }[]
  teams: Team[]
  notes: { title: string; text: string }[]
}

export interface RankedSplit {
  team: Team
  runner: string | null
  seconds: number
  rank: number
}

export const race = results as {
  race: string
  date: string
  venue: string
  source: string
  events: RelayEvent[]
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = String(m).padStart(h ? 2 : 1, '0')
  return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`
}

export function formatPace(seconds: number, km: number | null): string {
  if (!km) return '—'
  const p = Math.round(seconds / km)
  return `${Math.floor(p / 60)}:${String(p % 60).padStart(2, '0')}/km`
}

// Fastest first; tied splits share a rank.
export function rankSegment(event: RelayEvent, segmentIndex: number, category = 'all'): RankedSplit[] {
  const list = event.teams
    .filter((team) => team.splits[segmentIndex] != null)
    .filter((team) => category === 'all' || team.category === category)
    .map((team) => ({
      team,
      runner: team.runners[segmentIndex],
      seconds: team.splits[segmentIndex] as number,
      rank: 0,
    }))
    .sort((a, b) => a.seconds - b.seconds)
  list.forEach((entry, i) => {
    entry.rank = i > 0 && list[i - 1].seconds === entry.seconds ? list[i - 1].rank : i + 1
  })
  return list
}

export const sevenLegRelay = race.events.find((e) => e.legCount === 7)!

// The course map is the seven leg course, where legs 6 and 7 are timed together.
export function segmentForCourseLeg(leg: number): number {
  return sevenLegRelay.segments.findIndex((s) => s.legs.includes(leg))
}
