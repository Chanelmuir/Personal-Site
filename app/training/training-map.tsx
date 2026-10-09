'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { colors, streetStyle } from '../lib/street-map-style'
import { decodePolyline } from '../lib/polyline'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

// [year, type, encoded polyline], built by scripts/build-training-data.py
type RouteLine = [number, string, string]

type Bounds = [[number, number], [number, number]]

// Where most of the routes are, as [west, south], [east, north]
const PLACES: { name: string; bounds: Bounds }[] = [
  { name: 'Christchurch', bounds: [[172.53, -43.6], [172.73, -43.46]] },
  { name: 'Tulsa', bounds: [[-96.21, 36.0], [-95.85, 36.29]] },
  { name: 'Philadelphia', bounds: [[-75.23, 39.97], [-75.12, 40.08]] },
  { name: 'Mexico City', bounds: [[-99.23, 19.34], [-98.85, 19.68]] },
]

// Every route drawn faintly on top of the others, so the roads run most often build up darkest
export default function TrainingMap({ year }: { year: number | null }) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [place, setPlace] = useState(PLACES[0].name)

  useEffect(() => {
    const el = container.current
    if (!el) return

    const instance = new mapboxgl.Map({
      container: el,
      style: streetStyle,
      bounds: PLACES[0].bounds,
      attributionControl: false,
      cooperativeGestures: true,
    })
    instance.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    map.current = instance

    let cancelled = false
    instance.on('load', async () => {
      const lines: RouteLine[] = await fetch('/training/routes.json').then((r) => r.json())
      if (cancelled) return
      instance.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: lines.map(([lineYear, type, encoded]) => ({
            type: 'Feature',
            properties: { year: lineYear, type },
            geometry: { type: 'LineString', coordinates: decodePolyline(encoded) },
          })),
        },
      })
      instance.addLayer({
        id: 'routes',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colors.route,
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.12, 15, 0.3],
          'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 2.5],
        },
      })
      setLoaded(true)
    })

    return () => {
      cancelled = true
      instance.remove()
      map.current = null
    }
  }, [])

  useEffect(() => {
    if (!loaded || !map.current) return
    map.current.setFilter('routes', year === null ? null : ['==', ['get', 'year'], year])
  }, [year, loaded])

  const goTo = (name: string) => {
    const target = PLACES.find((p) => p.name === name)
    if (!target || !map.current) return
    setPlace(name)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    map.current.fitBounds(target.bounds, { padding: 24, animate: !reduceMotion, duration: 2500 })
  }

  return (
    // Mapbox's own CSS makes its container position: relative, so the map sits inside an absolute wrapper
    <div className="relative h-[clamp(380px,62vh,620px)] border-y border-border sm:border">
      <div className="absolute inset-0">
        <div ref={container} className="h-full w-full" aria-label="Map of every route" role="img" />
      </div>
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pr-14" role="group" aria-label="Zoom to a city">
        {PLACES.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => goTo(p.name)}
            aria-pressed={place === p.name}
            className={`border px-2.5 py-1 text-xs font-medium transition-colors ${
              place === p.name
                ? 'border-text-primary bg-text-primary text-background'
                : 'border-text-primary/30 bg-background/90 text-text-primary hover:border-text-primary'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      {!loaded && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-text-secondary">Loading routes…</p>
      )}
    </div>
  )
}
