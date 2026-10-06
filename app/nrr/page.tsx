'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { ExpressionSpecification } from 'mapbox-gl'
import Link from 'next/link'
import courseData from './course-data.json'
import { sevenLegRelay, rankSegment, segmentForCourseLeg, formatTime } from './splits/data'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type Coord = [number, number, ...number[]]

interface LegFeature {
  type: 'Feature'
  id: string
  geometry: { type: 'LineString'; coordinates: Coord[] }
  properties: { title: string; stroke: string }
}

interface ChangeoverFeature {
  type: 'Feature'
  id: string
  geometry: { type: 'Point'; coordinates: Coord }
  properties: { title: string }
}

const data = courseData as unknown as {
  features: (LegFeature | ChangeoverFeature)[]
}

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

const legNumber = (title: string) => Number(title.match(/LEG (\d+)/)?.[1] ?? 0)
const changeoverLetter = (title: string) => title.match(/Changeover (\w+)/)?.[1] ?? '?'

const legs = data.features
  .filter((f): f is LegFeature => f.geometry.type === 'LineString')
  .map((f) => ({
    id: f.id,
    number: legNumber(f.properties.title),
    color: f.properties.stroke,
    coordinates: f.geometry.coordinates,
    distanceKm: lineDistanceKm(f.geometry.coordinates),
  }))
  .sort((a, b) => a.number - b.number)

const changeovers = data.features
  .filter((f): f is ChangeoverFeature => f.geometry.type === 'Point')
  .map((f) => ({
    id: f.id,
    letter: changeoverLetter(f.properties.title),
    title: f.properties.title,
    coordinates: f.geometry.coordinates,
  }))
  .sort((a, b) => a.letter.localeCompare(b.letter))

const totalDistanceKm = legs.reduce((sum, leg) => sum + leg.distanceKm, 0)

// [zoom, pixel width] stops: lines stay thin and tightly bundled when zoomed
// out, and fan out as you zoom in, so the per-leg offset below (a multiple
// of the width at each stop) never looks like a wide, disconnected gap.
const WIDTH_STOPS: [number, number][] = [
  [8, 1.5],
  [11, 4],
  [15, 7],
]

function widthExpression(extra: number): ExpressionSpecification {
  const expr: unknown[] = ['interpolate', ['linear'], ['zoom']]
  WIDTH_STOPS.forEach(([zoom, width]) => expr.push(zoom, width + extra))
  return expr as unknown as ExpressionSpecification
}

function offsetExpression(indexFactor: number): ExpressionSpecification {
  const expr: unknown[] = ['interpolate', ['linear'], ['zoom']]
  WIDTH_STOPS.forEach(([zoom, width]) => expr.push(zoom, width * indexFactor))
  return expr as unknown as ExpressionSpecification
}

export default function NrrPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const bounds = new mapboxgl.LngLatBounds()
    legs.forEach((leg) => leg.coordinates.forEach((c) => bounds.extend([c[0], c[1]])))
    const center = bounds.getCenter()

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [center.lng, center.lat],
      zoom: 11,
    })
    map.current = instance

    const resizeObserver = new ResizeObserver(() => instance.resize())
    resizeObserver.observe(mapContainer.current)

    instance.on('load', () => {
      instance.resize()
      instance.fitBounds(bounds, { padding: 48, duration: 0 })

      legs.forEach((leg, index) => {
        const sourceId = `leg-${leg.number}`
        const indexFactor = index - (legs.length - 1) / 2
        const offset = offsetExpression(indexFactor)
        instance.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: leg.coordinates },
          },
        })
        instance.addLayer({
          id: `${sourceId}-casing`,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#1c1917',
            'line-width': widthExpression(1),
            'line-opacity': 0.25,
            'line-offset': offset,
          },
        })
        instance.addLayer({
          id: `${sourceId}-line`,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': leg.color, 'line-width': widthExpression(0), 'line-offset': offset },
        })
        instance.on('click', `${sourceId}-line`, () => {
          setSelectedLeg((current) => (current === leg.number ? null : leg.number))
        })
        instance.on('mouseenter', `${sourceId}-line`, () => {
          instance.getCanvas().style.cursor = 'pointer'
        })
        instance.on('mouseleave', `${sourceId}-line`, () => {
          instance.getCanvas().style.cursor = ''
        })
      })

      changeovers.forEach((changeover) => {
        const el = document.createElement('div')
        el.className =
          'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-stone-800 text-xs font-bold text-white shadow-md cursor-pointer'
        el.textContent = changeover.letter

        new mapboxgl.Marker({ element: el })
          .setLngLat([changeover.coordinates[0], changeover.coordinates[1]])
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setHTML(
              `<span style="font-weight:600">${changeover.title}</span>`
            )
          )
          .addTo(instance)
      })
    })

    return () => {
      resizeObserver.disconnect()
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance || !instance.isStyleLoaded()) return

    legs.forEach((leg) => {
      const isSelected = selectedLeg === leg.number
      const isDimmed = selectedLeg !== null && !isSelected
      const lineLayer = `leg-${leg.number}-line`
      const casingLayer = `leg-${leg.number}-casing`
      if (!instance.getLayer(lineLayer)) return

      instance.setPaintProperty(lineLayer, 'line-width', widthExpression(isSelected ? 2 : 0))
      instance.setPaintProperty(lineLayer, 'line-opacity', isDimmed ? 0.25 : 1)
      instance.setPaintProperty(casingLayer, 'line-opacity', isDimmed ? 0.08 : 0.25)
    })

    if (selectedLeg !== null) {
      const leg = legs.find((l) => l.number === selectedLeg)
      if (leg) {
        const bounds = new mapboxgl.LngLatBounds()
        leg.coordinates.forEach((c) => bounds.extend([c[0], c[1]]))
        instance.fitBounds(bounds, { padding: 80, duration: 500 })
      }
    } else {
      const bounds = new mapboxgl.LngLatBounds()
      legs.forEach((leg) => leg.coordinates.forEach((c) => bounds.extend([c[0], c[1]])))
      instance.fitBounds(bounds, { padding: 48, duration: 500 })
    }
  }, [selectedLeg])

  return (
    <main className="flex flex-col sm:flex-row w-full h-[calc(100dvh-68px)] overflow-hidden">
      {/* Mobile leg bubbles */}
      <div className="sm:hidden flex-shrink-0 border-b border-border bg-surface">
        <div className="px-4 pt-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            National Road Relays
          </p>
          <h1 className="font-serif text-xl text-text-primary">2026 Course</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {legs.length} legs · {totalDistanceKm.toFixed(1)} km total ·{' '}
            <Link href="/nrr/splits" className="text-accent hover:opacity-80">
              Leg splits →
            </Link>
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 py-3">
          {legs.map((leg) => {
            const isSelected = selectedLeg === leg.number
            return (
              <button
                key={leg.id}
                onClick={() => setSelectedLeg((current) => (current === leg.number ? null : leg.number))}
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-transform ${
                  isSelected ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : ''
                }`}
                style={{ backgroundColor: leg.color, textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
              >
                {leg.number}
              </button>
            )
          })}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1 overflow-hidden">
        <div ref={mapContainer} className="w-full h-full" />
      </div>

      {/* Sidebar */}
      <aside className="hidden sm:flex w-full sm:w-[340px] flex-shrink-0 border-l border-border bg-surface flex-col overflow-y-auto">
        <div className="p-6 border-b border-border">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            National Road Relays
          </p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">2026 Course</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {legs.length} legs · {totalDistanceKm.toFixed(1)} km total
          </p>
          <Link href="/nrr/splits" className="mt-3 inline-block text-sm text-accent hover:opacity-80">
            Who ran each leg fastest →
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {legs.map((leg) => (
            <button
              key={leg.id}
              onClick={() => setSelectedLeg((current) => (current === leg.number ? null : leg.number))}
              className={`flex items-center gap-3 p-4 text-left transition-colors hover:bg-background ${
                selectedLeg === leg.number ? 'bg-background' : ''
              }`}
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: leg.color }}
              />
              <span className="flex-1">
                <span className="block font-medium text-text-primary">Leg {leg.number}</span>
                <span className="block text-sm text-text-secondary">
                  {leg.distanceKm.toFixed(1)} km
                </span>
              </span>
            </button>
          ))}
        </div>

        {selectedLeg !== null && <FastestOnLeg leg={selectedLeg} />}

        {selectedLeg !== null && (
          <button
            onClick={() => setSelectedLeg(null)}
            className="m-4 rounded-full border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors"
          >
            Show full course
          </button>
        )}

        <div className="p-6 mt-auto border-t border-border">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Changeovers</p>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {changeovers.map((c) => c.letter).join(' · ')}
          </p>
        </div>
      </aside>
    </main>
  )
}

function FastestOnLeg({ leg }: { leg: number }) {
  const index = segmentForCourseLeg(leg)
  if (index < 0) return null
  const segment = sevenLegRelay.segments[index]
  const top = rankSegment(sevenLegRelay, index).slice(0, 3)

  return (
    <div className="border-b border-border p-6">
      <p className="text-xs uppercase tracking-wide text-text-secondary">
        Fastest on {segment.label.toLowerCase()} in 2026
      </p>
      <ol className="mt-3 flex flex-col gap-2">
        {top.map((r) => (
          <li key={r.team.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium text-text-primary">{r.runner ?? r.team.team}</span>
              <span className="block text-xs text-text-secondary">{r.team.club ?? r.team.team}</span>
            </span>
            <span className="font-semibold tabular-nums text-text-primary">{formatTime(r.seconds)}</span>
          </li>
        ))}
      </ol>
      {segment.combined && (
        <p className="mt-3 text-xs text-text-secondary">
          Legs {segment.legs.join(' and ')} weren&apos;t timed separately, so this is their combined time.
        </p>
      )}
    </div>
  )
}
