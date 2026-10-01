'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import courseData from './course-data.json'

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

export default function NrrPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const bounds = new mapboxgl.LngLatBounds()
    legs.forEach((leg) => leg.coordinates.forEach((c) => bounds.extend([c[0], c[1]])))

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      bounds,
      fitBoundsOptions: { padding: 48 },
    })
    map.current = instance

    const resizeObserver = new ResizeObserver(() => instance.resize())
    resizeObserver.observe(mapContainer.current)

    instance.on('load', () => {
      legs.forEach((leg) => {
        const sourceId = `leg-${leg.number}`
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
          paint: { 'line-color': '#1c1917', 'line-width': 6, 'line-opacity': 0.25 },
        })
        instance.addLayer({
          id: `${sourceId}-line`,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': leg.color, 'line-width': 4 },
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

      instance.setPaintProperty(lineLayer, 'line-width', isSelected ? 6 : 4)
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
      {/* Map */}
      <div className="relative flex-1 order-2 sm:order-1">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {/* Sidebar */}
      <aside className="w-full sm:w-[340px] flex-shrink-0 border-b sm:border-b-0 sm:border-l border-border bg-surface flex flex-col overflow-y-auto order-1 sm:order-2">
        <div className="p-6 border-b border-border">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            National Road Relays
          </p>
          <h1 className="mt-2 font-serif text-3xl text-text-primary">2026 Course</h1>
          <p className="mt-2 text-sm text-text-secondary">
            {legs.length} legs · {totalDistanceKm.toFixed(1)} km total
          </p>
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
