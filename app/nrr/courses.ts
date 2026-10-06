import courseData from './course-data.json'
import { race } from './splits/data'

type Coord = [number, number, ...number[]]

interface Feature {
  type: 'Feature'
  id: string
  geometry: { type: 'LineString'; coordinates: Coord[] } | { type: 'Point'; coordinates: Coord } | null
  properties: { title: string; stroke?: string; folderId?: string; class?: string }
}

export interface CourseLeg {
  id: string
  number: number
  label: string
  color: string
  coordinates: Coord[]
  distanceKm: number
}

export interface Changeover {
  id: string
  letter: string
  title: string
  coordinates: Coord
}

export interface Course {
  eventId: number
  name: string
  legs: CourseLeg[]
  changeovers: Changeover[]
  totalKm: number
  note: string | null
}

const features = (courseData as unknown as { features: Feature[] }).features

function haversineKm(a: Coord, b: Coord): number {
  const R = 6371
  const dLat = (b[1] - a[1]) * Math.PI / 180
  const dLng = (b[0] - a[0]) * Math.PI / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h =
    sinLat * sinLat +
    Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function lineDistanceKm(coords: Coord[]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    total += haversineKm(coords[i - 1], coords[i])
  }
  return total
}

const folderId = (prefix: string) =>
  features.find((f) => f.properties.class === 'Folder' && f.properties.title.startsWith(prefix))!.id

function legsInFolder(prefix: string): CourseLeg[] {
  const folder = folderId(prefix)
  return features
    .filter((f) => f.properties.folderId === folder && f.geometry?.type === 'LineString')
    .map((f) => {
      const coordinates = f.geometry!.coordinates as Coord[]
      const number = Number(f.properties.title.match(/LEG (\d+)/i)?.[1] ?? 1)
      return {
        id: f.id,
        number,
        label: `Leg ${number}`,
        color: f.properties.stroke ?? '#1c1917',
        coordinates,
        distanceKm: lineDistanceKm(coordinates),
      }
    })
    .sort((a, b) => a.number - b.number)
}

const allChangeovers: Changeover[] = features
  .filter((f) => f.geometry?.type === 'Point')
  .map((f) => ({
    id: f.id,
    letter: f.properties.title.match(/Changeover (\w+)/)?.[1] ?? '?',
    title: f.properties.title,
    coordinates: f.geometry!.coordinates as Coord,
  }))
  .sort((a, b) => a.letter.localeCompare(b.letter))

// A course uses the changeovers its legs start or finish at.
function changeoversFor(legs: CourseLeg[]): Changeover[] {
  const ends = legs.flatMap((leg) => [leg.coordinates[0], leg.coordinates[leg.coordinates.length - 1]])
  return allChangeovers.filter((c) => ends.some((end) => haversineKm(end, c.coordinates) < 0.05))
}

function course(eventId: number, legs: CourseLeg[], repeats = 1, note: string | null = null): Course {
  return {
    eventId,
    name: race.events.find((e) => e.id === eventId)!.name,
    legs,
    changeovers: changeoversFor(legs),
    totalKm: legs.reduce((sum, leg) => sum + leg.distanceKm, 0) * repeats,
    note,
  }
}

const longLegs = legsInFolder('Long Course')
const shortLegs = legsInFolder('Short Course')
const lap = legsInFolder('4 Leg Course').map((leg) => ({ ...leg, label: 'The lap' }))

const byEvent: Record<number, Course> = {
  1: course(1, longLegs),
  2: course(2, shortLegs),
  4: course(4, shortLegs.filter((leg) => leg.number <= 5), 1, 'Same as the Six Leg Relay, without leg 6.'),
  3: course(3, lap, 4, 'All four legs run the same lap.'),
}

// Same order as the splits page.
export const courses: Course[] = race.events.map((e) => byEvent[e.id]).filter(Boolean)
