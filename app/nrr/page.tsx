'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import type { ExpressionSpecification } from 'mapbox-gl'
import { courses, type Course } from './courses'
import { race, rankSegment, segmentForLeg, formatTime } from './splits/data'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

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

function courseBounds(course: Course, legNumber: number | null = null) {
  const bounds = new mapboxgl.LngLatBounds()
  course.legs
    .filter((leg) => legNumber === null || leg.number === legNumber)
    .forEach((leg) => leg.coordinates.forEach((c) => bounds.extend([c[0], c[1]])))
  return bounds
}

const sourceId = (course: Course, legNumber: number) => `course-${course.eventId}-leg-${legNumber}`

function pill(active: boolean) {
  return `flex-shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'border-text-primary bg-text-primary text-background'
      : 'border-border bg-surface text-text-primary hover:border-text-secondary'
  }`
}

export default function NrrPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [courseId, setCourseId] = useState(courses[0].eventId)
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null)

  const course = courses.find((c) => c.eventId === courseId)!

  function chooseCourse(id: number) {
    setCourseId(id)
    setSelectedLeg(null)
  }

  function toggleLeg(number: number) {
    setSelectedLeg((current) => (current === number ? null : number))
  }

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const center = courseBounds(courses[0]).getCenter()
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
      setMapReady(true)
    })

    return () => {
      resizeObserver.disconnect()
      instance.remove()
      map.current = null
    }
  }, [])

  // Draw the chosen course, clearing whatever course was drawn before.
  useEffect(() => {
    const instance = map.current
    if (!instance || !mapReady) return

    const markers: mapboxgl.Marker[] = []

    course.legs.forEach((leg, index) => {
      const id = sourceId(course, leg.number)
      const indexFactor = index - (course.legs.length - 1) / 2
      const offset = offsetExpression(indexFactor)
      instance.addSource(id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: leg.coordinates },
        },
      })
      instance.addLayer({
        id: `${id}-casing`,
        type: 'line',
        source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#1c1917',
          'line-width': widthExpression(1),
          'line-opacity': 0.25,
          'line-offset': offset,
        },
      })
      instance.addLayer({
        id: `${id}-line`,
        type: 'line',
        source: id,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': leg.color, 'line-width': widthExpression(0), 'line-offset': offset },
      })
    })

    const lineLayers = course.legs.map((leg) => `${sourceId(course, leg.number)}-line`)
    const onClick = (e: mapboxgl.MapMouseEvent) => {
      const hit = instance.queryRenderedFeatures(e.point, { layers: lineLayers })[0]
      if (!hit) return
      const leg = course.legs.find((l) => `${sourceId(course, l.number)}-line` === hit.layer?.id)
      if (leg) setSelectedLeg((current) => (current === leg.number ? null : leg.number))
    }
    const onMove = (e: mapboxgl.MapMouseEvent) => {
      const hit = instance.queryRenderedFeatures(e.point, { layers: lineLayers }).length > 0
      instance.getCanvas().style.cursor = hit ? 'pointer' : ''
    }
    instance.on('click', onClick)
    instance.on('mousemove', onMove)

    course.changeovers.forEach((changeover) => {
      const el = document.createElement('div')
      el.className =
        'flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-stone-800 text-xs font-bold text-white shadow-md cursor-pointer'
      el.textContent = changeover.letter

      markers.push(
        new mapboxgl.Marker({ element: el })
          .setLngLat([changeover.coordinates[0], changeover.coordinates[1]])
          .setPopup(
            new mapboxgl.Popup({ offset: 16 }).setHTML(
              `<span style="font-weight:600">${changeover.title}</span>`
            )
          )
          .addTo(instance)
      )
    })

    instance.fitBounds(courseBounds(course), { padding: 48, duration: 500 })

    return () => {
      // The map itself is gone on unmount, taking its layers with it.
      if (!map.current) return
      instance.off('click', onClick)
      instance.off('mousemove', onMove)
      markers.forEach((m) => m.remove())
      course.legs.forEach((leg) => {
        const id = sourceId(course, leg.number)
        instance.removeLayer(`${id}-line`)
        instance.removeLayer(`${id}-casing`)
        instance.removeSource(id)
      })
    }
  }, [course, mapReady])

  useEffect(() => {
    const instance = map.current
    if (!instance || !mapReady) return

    course.legs.forEach((leg) => {
      const isSelected = selectedLeg === leg.number
      const isDimmed = selectedLeg !== null && !isSelected
      const id = sourceId(course, leg.number)
      if (!instance.getLayer(`${id}-line`)) return

      instance.setPaintProperty(`${id}-line`, 'line-width', widthExpression(isSelected ? 2 : 0))
      instance.setPaintProperty(`${id}-line`, 'line-opacity', isDimmed ? 0.25 : 1)
      instance.setPaintProperty(`${id}-casing`, 'line-opacity', isDimmed ? 0.08 : 0.25)
    })

    if (selectedLeg !== null) {
      instance.fitBounds(courseBounds(course, selectedLeg), { padding: 80, duration: 500 })
    } else {
      instance.fitBounds(courseBounds(course), { padding: 48, duration: 500 })
    }
  }, [selectedLeg, course, mapReady])

  const summary = `${course.legs.length === 1 ? '4 laps' : `${course.legs.length} legs`} · ${course.totalKm.toFixed(1)} km total`

  return (
    <main className="flex flex-col sm:flex-row w-full h-[calc(100dvh-68px)] overflow-hidden">
      {/* Mobile header */}
      <div className="sm:hidden flex-shrink-0 border-b border-border bg-surface">
        <div className="px-4 pt-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            National Road Relays 2026
          </p>
          <h1 className="font-serif text-xl text-text-primary">{course.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {summary} ·{' '}
            <Link href="/nrr/splits" className="text-accent hover:opacity-80">
              Leg splits →
            </Link>
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pt-3">
          {courses.map((c) => (
            <button key={c.eventId} onClick={() => chooseCourse(c.eventId)} className={pill(c.eventId === courseId)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 py-3">
          {course.legs.map((leg) => {
            const isSelected = selectedLeg === leg.number
            return (
              <button
                key={leg.id}
                onClick={() => toggleLeg(leg.number)}
                className={`flex h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold text-white shadow-sm transition-transform ${
                  isSelected ? 'ring-2 ring-offset-2 ring-text-primary scale-110' : ''
                }`}
                style={{ backgroundColor: leg.color, textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
              >
                {course.legs.length === 1 ? 'Lap' : leg.number}
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
            National Road Relays 2026
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {courses.map((c) => (
              <button key={c.eventId} onClick={() => chooseCourse(c.eventId)} className={pill(c.eventId === courseId)}>
                {c.name}
              </button>
            ))}
          </div>
          <h1 className="mt-4 font-serif text-3xl text-text-primary">{course.name}</h1>
          <p className="mt-2 text-sm text-text-secondary">{summary}</p>
          {course.note && <p className="mt-1 text-sm text-text-secondary">{course.note}</p>}
          <Link href="/nrr/splits" className="mt-3 inline-block text-sm text-accent hover:opacity-80">
            Who ran each leg fastest →
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {course.legs.map((leg) => (
            <button
              key={leg.id}
              onClick={() => toggleLeg(leg.number)}
              className={`flex items-center gap-3 p-4 text-left transition-colors hover:bg-background ${
                selectedLeg === leg.number ? 'bg-background' : ''
              }`}
            >
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: leg.color }}
              />
              <span className="flex-1">
                <span className="block font-medium text-text-primary">{leg.label}</span>
                <span className="block text-sm text-text-secondary">
                  {leg.distanceKm.toFixed(1)} km
                </span>
              </span>
            </button>
          ))}
        </div>

        {selectedLeg !== null && <FastestOnLeg eventId={courseId} leg={selectedLeg} />}

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
            {course.changeovers.map((c) => c.letter).join(' · ')}
          </p>
        </div>
      </aside>
    </main>
  )
}

function FastestOnLeg({ eventId, leg }: { eventId: number; leg: number }) {
  const event = race.events.find((e) => e.id === eventId)
  // The four leg relay runs one lap four times, so a single lap has no one leg to rank.
  if (!event || event.legCount === 4) return null
  const index = segmentForLeg(event, leg)
  if (index < 0) return null
  const segment = event.segments[index]
  const top = rankSegment(event, index).slice(0, 3)
  if (top.length === 0) return null

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
      {segment.paceHidden && (
        <p className="mt-3 text-xs text-text-secondary">The recorded times on this leg look wrong.</p>
      )}
    </div>
  )
}
