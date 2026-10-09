'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import type { GeoJSONSource } from 'mapbox-gl'
import routeCoords from './home-route.json'
import { colors, streetStyle as style } from '../lib/street-map-style'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

type LngLat = [number, number]

// Chanel's own GPS art run through the central city (13.6 km), spelling out the name
const RUN = routeCoords as LngLat[]

// Middle of Hagley Park, from Deans Ave to Rolleston Ave
const HAGLEY_PARK_LNG = 172.6195

function bounds(points: LngLat[]) {
  const b = new mapboxgl.LngLatBounds()
  for (const p of points) b.extend(p)
  return b
}

// Keep the runs clear of the title block, which sits bottom left (or across the bottom on phones)
function padding(el: HTMLElement) {
  const w = el.clientWidth
  const h = el.clientHeight
  return w < 640
    ? { top: 24, right: 16, bottom: h * 0.5, left: 16 }
    : { top: 40, right: 40, bottom: h * 0.2, left: w * 0.32 }
}

const line = (coordinates: LngLat[]): GeoJSON.Feature<GeoJSON.LineString> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates },
})

const point = (coordinates: LngLat): GeoJSON.Feature<GeoJSON.Point> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates },
})

// A scale bar about 100px long, rounded to a tidy distance
function scaleFor(map: mapboxgl.Map) {
  const lat = map.getCenter().lat
  const metresPerPx = (156543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** map.getZoom() / 2
  const target = metresPerPx * 100
  const nice = [100, 200, 250, 500, 1000, 2000].reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a))
  return { px: nice / metresPerPx, label: nice >= 1000 ? `${nice / 1000} km` : `${nice} m` }
}

export default function StreetMapHero({ intro }: { intro: string }) {
  const container = useRef<HTMLDivElement>(null)
  const titleBlock = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState<{ px: number; label: string } | null>(null)

  useEffect(() => {
    const el = container.current
    if (!el) return

    const area = bounds(RUN)
    const map = new mapboxgl.Map({
      container: el,
      style,
      center: area.getCenter(),
      zoom: 13,
      interactive: false,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0

    // Phones: fit the run beside the title block, then step back a zoom level so Hagley Park,
    // the Avon and the Four Avenues around it show it's Christchurch.
    // Wider screens: Hagley Park in the middle, zoomed so the run ends under the navbar's last icon.
    // Either way the run sits vertically centred in the space above the title block.
    const refit = () => {
      map.resize()
      const w = el.clientWidth
      const boxTop = titleBlock.current?.offsetTop ?? el.clientHeight * 0.6
      map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
      if (w < 640) {
        const pad = padding(el)
        const fit = map.cameraForBounds(area, { padding: pad })
        map.setPadding(pad)
        map.jumpTo({ center: area.getCenter(), zoom: (fit?.zoom ?? 14) - 1 })
        const ne = map.project(area.getNorthEast())
        const sw = map.project(area.getSouthWest())
        map.panBy([(ne.x + sw.x) / 2 - w / 2, (ne.y + sw.y) / 2 - boxTop / 2], { animate: false })
      } else {
        // The navbar's right edge: max-w-6xl column with sm:px-16
        const contentRight = (w + Math.min(w, 1152)) / 2 - 64
        const pxPerDegree = (contentRight - w / 2) / (area.getEast() - HAGLEY_PARK_LNG)
        const zoom = Math.log2((pxPerDegree * 360) / 512)
        map.jumpTo({ center: [HAGLEY_PARK_LNG, area.getCenter().lat], zoom })
        const ne = map.project(area.getNorthEast())
        const sw = map.project(area.getSouthWest())
        map.panBy([0, (ne.y + sw.y) / 2 - boxTop / 2], { animate: false })
      }
      setScale(scaleFor(map))
    }
    refit()
    const observer = new ResizeObserver(refit)
    observer.observe(el)

    map.on('load', () => {
      setScale(scaleFor(map))
      const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
      map.addSource('run', { type: 'geojson', data: empty })
      map.addSource('ends', { type: 'geojson', data: empty })
      map.addLayer({
        id: 'run',
        type: 'line',
        source: 'run',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': colors.route, 'line-width': 4.5 },
      })
      map.addLayer({
        id: 'ends',
        type: 'circle',
        source: 'ends',
        paint: {
          'circle-radius': 6,
          'circle-color': ['case', ['==', ['get', 'end'], 'start'], colors.paper, colors.route],
          'circle-stroke-color': colors.route,
          'circle-stroke-width': 3,
        },
      })

      const run = RUN
      const runSource = map.getSource('run') as GeoJSONSource
      const endsSource = map.getSource('ends') as GeoJSONSource
      const draw = (coords: LngLat[]) => {
        runSource.setData(line(coords))
        endsSource.setData({
          type: 'FeatureCollection',
          features: [
            { ...point(coords[0]), properties: { end: 'start' } },
            { ...point(coords[coords.length - 1]), properties: { end: 'head' } },
          ],
        })
      }

      if (reduceMotion) {
        draw(run)
        return
      }

      // Draw the run once, easing out as it reaches the finish
      const duration = 7000
      let start: number | null = null
      const step = (now: number) => {
        if (start === null) start = now
        const t = Math.min(1, (now - start) / duration)
        const eased = 1 - (1 - t) ** 2
        draw(run.slice(0, Math.max(2, Math.ceil(eased * run.length))))
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      map.remove()
    }
  }, [])

  return (
    <section aria-label="Introduction" className="relative h-[clamp(440px,64vh,620px)] overflow-hidden bg-background">
      {/* Mapbox's own CSS makes its container position: relative, so the map sits inside an absolute wrapper */}
      <div aria-hidden="true" className="absolute inset-0">
        <div ref={container} className="h-full w-full" />
      </div>

      <div className="pointer-events-none relative mx-auto flex h-full w-full max-w-6xl items-end px-6 py-8 sm:px-16">
        <div ref={titleBlock} className="pointer-events-auto max-w-full border-[1.5px] border-text-primary bg-background px-4 pt-4 pb-3 sm:px-5 sm:pt-4 sm:pb-4">
          <h1 className="text-[clamp(34px,6vw,68px)] font-extrabold leading-[0.88] tracking-[-0.035em] text-text-primary [font-stretch:125%]">
            Chanel Muir
          </h1>
          <p className="mt-3 max-w-[34ch] text-base text-text-primary">{intro}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] whitespace-nowrap text-text-secondary tabular-nums">
            {scale && (
              <>
                <span
                  aria-hidden="true"
                  className="flex h-1.5 border border-text-primary"
                  style={{ width: scale.px }}
                >
                  <span className="flex-1 bg-text-primary" />
                  <span className="flex-1" />
                  <span className="flex-1 bg-text-primary" />
                  <span className="flex-1" />
                </span>
                <span>{scale.label}</span>
              </>
            )}
            <span>Christchurch, NZ</span>
          </div>
        </div>
      </div>
    </section>
  )
}
