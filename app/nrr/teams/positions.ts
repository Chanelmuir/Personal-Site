import type { RelayEvent, Team } from '../splits/data'

export interface PositionModel {
  teams: Team[]
  // Race time at the end of each segment (null once a team stops being timed).
  elapsed: Map<number, (number | null)[]>
  // Position at the end of each segment; the last one is the finishing place.
  positions: Map<number, (number | null)[]>
  // Chart row for each team: finishers by place, then non-finishers.
  row: Map<number, number>
  lastTimed: (team: Team) => number
  netChange: (team: Team) => number | null
}

function elapsedTimes(team: Team): (number | null)[] {
  let total = 0
  let stopped = false
  return team.splits.map((s) => {
    if (s == null) stopped = true
    if (stopped) return null
    total += s!
    return total
  })
}

// Position by race time at each changeover, within the chosen category.
export function positionModel(event: RelayEvent, category = 'all'): PositionModel {
  const segments = event.segments.length
  const teams = event.teams.filter(
    (t) => (category === 'all' || t.category === category) && t.splits.some((s) => s != null)
  )
  const elapsed = new Map(teams.map((t) => [t.id, elapsedTimes(t)]))
  const positions = new Map(teams.map((t) => [t.id, Array<number | null>(segments).fill(null)]))

  for (let k = 0; k < segments - 1; k++) {
    const timed = teams
      .filter((t) => elapsed.get(t.id)![k] != null)
      .sort((a, b) => elapsed.get(a.id)![k]! - elapsed.get(b.id)![k]!)
    timed.forEach((t, i) => {
      const prev = timed[i - 1]
      const tied = prev && elapsed.get(prev.id)![k] === elapsed.get(t.id)![k]
      positions.get(t.id)![k] = tied ? positions.get(prev.id)![k] : i + 1
    })
  }

  const finishers = teams.filter((t) => t.finish != null).sort((a, b) => a.finish! - b.finish!)
  finishers.forEach((t, i) => {
    positions.get(t.id)![segments - 1] = i + 1
  })

  const lastTimed = (t: Team) => {
    const p = positions.get(t.id)!
    for (let k = segments - 1; k >= 0; k--) if (p[k] != null) return k
    return -1
  }

  const row = new Map(finishers.map((t, i) => [t.id, i + 1]))
  teams
    .filter((t) => t.finish == null)
    .sort((a, b) => lastTimed(b) - lastTimed(a))
    .forEach((t, i) => row.set(t.id, finishers.length + i + 1))

  const netChange = (t: Team) => {
    const p = positions.get(t.id)!
    return p[0] == null || p[segments - 1] == null ? null : p[0] - p[segments - 1]!
  }

  return { teams, elapsed, positions, row, lastTimed, netChange }
}

// Leader, biggest climber and biggest faller: a sensible first comparison.
export function defaultHighlights(model: PositionModel, segments: number): number[] {
  const finishers = model.teams
    .filter((t) => model.positions.get(t.id)![segments - 1] != null)
    .sort((a, b) => model.positions.get(a.id)![segments - 1]! - model.positions.get(b.id)![segments - 1]!)
  const ids: number[] = []
  if (finishers[0]) ids.push(finishers[0].id)
  const byNet = finishers.filter((t) => model.netChange(t) != null)
  const climber = [...byNet]
    .sort((a, b) => model.netChange(b)! - model.netChange(a)!)
    .find((t) => model.netChange(t)! > 0 && !ids.includes(t.id))
  if (climber) ids.push(climber.id)
  const faller = [...byNet]
    .sort((a, b) => model.netChange(a)! - model.netChange(b)!)
    .find((t) => model.netChange(t)! < 0 && !ids.includes(t.id))
  if (faller) ids.push(faller.id)
  return ids
}

export const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
