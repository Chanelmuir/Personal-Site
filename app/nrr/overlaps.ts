import type { CourseLeg } from './courses'

type Coord = CourseLeg['coordinates'][number]

// A stretch of one leg, drawn `lane` line-widths to the right of its own
// direction of travel (negative is left). Lane 0 sits on the route itself.
export interface LegPiece {
  coordinates: Coord[]
  lane: number
}

// Two legs share a road where their lines run within this distance of each
// other, in the same or opposite direction.
const SHARED_METRES = 25
const MAX_ANGLE_DEG = 35

// Flat x/y in metres; plenty accurate over a course a few km across.
function toMetres(c: Coord, lat0: number): [number, number] {
  const k = (Math.PI / 180) * 6371000
  return [c[0] * k * Math.cos((lat0 * Math.PI) / 180), c[1] * k]
}

type Vec = [number, number]

function nearestSegment(p: Vec, line: Vec[], skip: (i: number) => boolean = () => false) {
  let best = { dist: Infinity, index: 0 }
  for (let i = 1; i < line.length; i++) {
    if (skip(i - 1)) continue
    const [ax, ay] = line[i - 1]
    const [bx, by] = line[i]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / len2))
    const dist = Math.hypot(p[0] - (ax + t * dx), p[1] - (ay + t * dy))
    if (dist < best.dist) best = { dist, index: i - 1 }
  }
  return best
}

function direction(line: Vec[], i: number): Vec {
  const dx = line[i + 1][0] - line[i][0]
  const dy = line[i + 1][1] - line[i][1]
  const len = Math.hypot(dx, dy) || 1
  return [dx / len, dy / len]
}

// Drop shared runs too short to be a real stretch of road (a crossing),
// and close one-segment gaps inside a shared run.
function smooth(flags: boolean[]): boolean[] {
  const out = [...flags]
  for (let i = 1; i < out.length - 1; i++) {
    if (!out[i] && out[i - 1] && out[i + 1]) out[i] = true
  }
  let start = 0
  for (let i = 0; i <= out.length; i++) {
    if (i === out.length || !out[i]) {
      if (i - start < 2) for (let j = start; j < i; j++) out[j] = false
      start = i + 1
    }
  }
  return out
}

export function splitIntoLanes(legs: CourseLeg[]): LegPiece[][] {
  if (legs.length === 0) return []
  const lat0 = legs[0].coordinates[0][1]
  const lines = legs.map((leg) => leg.coordinates.map((c) => toMetres(c, lat0)))
  const cosMax = Math.cos((MAX_ANGLE_DEG * Math.PI) / 180)

  // shared[a][b][i]: segment i of leg a runs along leg b. sense[a][b][i]: +1
  // if leg b heads the same way there, -1 if it runs the opposite way.
  // A leg can share a road with itself on an out-and-back; then match[a][i]
  // is the segment of the same leg coming the other way.
  const shared: boolean[][][] = []
  const sense: number[][][] = []
  const match: number[][] = []
  lines.forEach((a, ai) => {
    shared[ai] = []
    sense[ai] = []
    match[ai] = []
    lines.forEach((b, bi) => {
      const flags: boolean[] = []
      const senses: number[] = []
      for (let i = 0; i < a.length - 1; i++) {
        const mid: Vec = [(a[i][0] + a[i + 1][0]) / 2, (a[i][1] + a[i + 1][1]) / 2]
        const self = ai === bi
        // Against itself, ignore the neighbouring stretch of road.
        const near = nearestSegment(mid, b, self ? (j) => Math.abs(j - i) < 4 : undefined)
        const da = direction(a, i)
        const db = direction(b, near.index)
        const dot = da[0] * db[0] + da[1] * db[1]
        const close = near.dist < SHARED_METRES
        flags.push(self ? close && dot < -cosMax : close && Math.abs(dot) > cosMax)
        senses.push(dot >= 0 ? 1 : -1)
        if (self) match[ai].push(near.index)
      }
      shared[ai][bi] = smooth(flags)
      sense[ai][bi] = senses
    })
  })

  return legs.map((leg, ai) => {
    const pieces: LegPiece[] = []
    for (let i = 0; i < leg.coordinates.length - 1; i++) {
      // Every leg on this stretch, in course order, gets its own lane (an
      // out-and-back gets two, outbound first). Lanes are laid out in the
      // frame of the first of them, so a line running the other way flips
      // its offset to stay on the same physical side.
      const outAndBack = shared[ai][ai][i]
      const pass = outAndBack && i > match[ai][i] ? 1 : 0
      const group: { leg: number; pass: number }[] = []
      legs.forEach((_, bi) => {
        if (bi === ai) {
          group.push({ leg: ai, pass: 0 })
          if (outAndBack) group.push({ leg: ai, pass: 1 })
        } else if (shared[ai][bi][i]) {
          group.push({ leg: bi, pass: 0 })
        }
      })
      const centre = (group.length - 1) / 2
      const reference = group[0]
      const flip =
        reference.leg === ai ? (reference.pass === pass ? 1 : -1) : sense[ai][reference.leg][i]
      const slot = group.findIndex((m) => m.leg === ai && m.pass === pass)
      const lane = (slot - centre) * flip

      const last = pieces[pieces.length - 1]
      if (last && last.lane === lane) {
        last.coordinates.push(leg.coordinates[i + 1])
      } else {
        pieces.push({ coordinates: [leg.coordinates[i], leg.coordinates[i + 1]], lane })
      }
    }
    return pieces
  })
}
