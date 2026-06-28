'use client'

import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

const MAP_STYLES = {
  standard: 'mapbox://styles/mapbox/standard',
  satellite: 'mapbox://styles/mapbox/standard-satellite',
} as const

type MapStyleKey = keyof typeof MAP_STYLES

interface GamePhoto {
  id: string
  image_path: string
  lat: number
  lng: number
  description: string | null
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function calculateScore(distanceKm: number): number {
  const maxScore = 5000
  return Math.round(maxScore * Math.exp(-distanceKm / 2000))
}

export default function GalleryGamePage() {
  const [photo, setPhoto] = useState<GamePhoto | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('standard')

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const guessMarker = useRef<mapboxgl.Marker | null>(null)
  const actualMarker = useRef<mapboxgl.Marker | null>(null)
  const lineSourceAdded = useRef(false)
  const hasInitializedStyle = useRef(false)

  const guessRef = useRef(guess)
  const photoRef = useRef(photo)
  const revealedRef = useRef(revealed)
  guessRef.current = guess
  photoRef.current = photo
  revealedRef.current = revealed

  useEffect(() => {
    async function loadPhoto() {
      setLoading(true)
      const res = await fetch('/api/gallery-game/random')
      if (res.ok) {
        const data = await res.json()
        setPhoto(data.photo)
        setImageUrl(data.imageUrl)
      }
      setLoading(false)
    }
    loadPhoto()
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.standard,
      center: [0, 20],
      zoom: 1.3,
    })

    map.current.on('click', (e) => {
      if (revealedRef.current) return

      const { lat, lng } = e.lngLat
      setGuess({ lat, lng })

      if (guessMarker.current) {
        guessMarker.current.setLngLat([lng, lat])
      } else {
        guessMarker.current = new mapboxgl.Marker({ color: '#166534' })
          .setLngLat([lng, lat])
          .addTo(map.current!)
      }
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle style switching: setStyle() wipes markers/layers, so re-add them

  useEffect(() => {
    if (!map.current) return

    if (!hasInitializedStyle.current) {
      hasInitializedStyle.current = true
      return
    }

    const target = MAP_STYLES[mapStyle]
    map.current.setStyle(target)

    const handleStyleLoad = () => {
      if (!map.current) return

      if (guessRef.current) {
        guessMarker.current = new mapboxgl.Marker({ color: '#166534' })
          .setLngLat([guessRef.current.lng, guessRef.current.lat])
          .addTo(map.current)
      }

      if (revealedRef.current && photoRef.current && guessRef.current) {
        actualMarker.current = new mapboxgl.Marker({ color: '#dc2626' })
          .setLngLat([photoRef.current.lng, photoRef.current.lat])
          .addTo(map.current)

        const lineGeoJson = {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [guessRef.current.lng, guessRef.current.lat],
              [photoRef.current.lng, photoRef.current.lat],
            ],
          },
          properties: {},
        }

        map.current.addSource('guess-line', { type: 'geojson', data: lineGeoJson })
        map.current.addLayer({
          id: 'guess-line-layer',
          type: 'line',
          source: 'guess-line',
          paint: {
            'line-color': '#475569',
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        })
        lineSourceAdded.current = true
      }
    }

    map.current.once('style.load', handleStyleLoad)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle])

  function handleSubmitGuess() {
    if (!guess || !photo || !map.current) return

    setRevealed(true)

    actualMarker.current = new mapboxgl.Marker({ color: '#dc2626' })
      .setLngLat([photo.lng, photo.lat])
      .addTo(map.current)

    const lineGeoJson = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [guess.lng, guess.lat],
          [photo.lng, photo.lat],
        ],
      },
      properties: {},
    }

    if (!lineSourceAdded.current) {
      map.current.addSource('guess-line', { type: 'geojson', data: lineGeoJson })
      map.current.addLayer({
        id: 'guess-line-layer',
        type: 'line',
        source: 'guess-line',
        paint: {
          'line-color': '#475569',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      })
      lineSourceAdded.current = true
    } else {
      const source = map.current.getSource('guess-line') as mapboxgl.GeoJSONSource
      source.setData(lineGeoJson)
    }

    setTimeout(() => {
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend([guess.lng, guess.lat])
      bounds.extend([photo.lng, photo.lat])
      map.current?.fitBounds(bounds, { padding: 60, maxZoom: 8 })
    }, 300)
  }

  function handlePlayAgain() {
    window.location.reload()
  }

  const distanceKm = guess && photo
    ? haversineDistanceKm(guess.lat, guess.lng, photo.lat, photo.lng)
    : null

  const score = distanceKm !== null ? calculateScore(distanceKm) : null

  return (
    <main className="flex w-full h-[calc(100dvh-64px)] overflow-hidden bg-surface">
      {/* Photo panel */}
      <div className="relative flex-1 bg-black/5">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Guess the location"
            className="absolute inset-0 w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-surface" />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-white text-lg">Loading a memory...</p>
          </div>
        )}
        {!loading && !photo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-white text-lg">No photos have been added yet.</p>
          </div>
        )}
      </div>

      {/* Sidebar: title, map, controls, reveal */}
      <aside className="w-[380px] flex-shrink-0 border-l border-border bg-surface flex flex-col overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight">Gallery Game</h1>
          <p className="text-text-secondary text-sm mt-1">
            Where in the world was this photo taken?
          </p>
        </div>

        <div className="p-6 flex flex-col gap-4">

          {/* Map */}
          <div
            className={"rounded-xl border border-border overflow-hidden shadow-sm transition-all duration-300 h-[40vh]"
          }
          >
            <div ref={mapContainer} className="w-full h-full" />
          </div>

          {/* Style toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMapStyle('standard')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm border transition-colors ${
                mapStyle === 'standard'
                  ? 'bg-accent text-white border-accent'
                  : 'border-border hover:border-accent'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm border transition-colors ${
                mapStyle === 'satellite'
                  ? 'bg-accent text-white border-accent'
                  : 'border-border hover:border-accent'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Submit button */}
          {!revealed && photo && (
            <button
              onClick={handleSubmitGuess}
              disabled={!guess}
              className="rounded-lg bg-accent px-5 py-3 text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {guess ? 'Submit guess' : 'Click the map to place a guess'}
            </button>
          )}

          {/* Score reveal */}
          {revealed && distanceKm !== null && score !== null && photo && (
            <div className="rounded-xl border border-border bg-background p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-accent">{score}</span>
                <span className="text-text-secondary">points</span>
              </div>
              <p className="mt-1 text-text-secondary text-sm">
                You were {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${Math.round(distanceKm)} km`} away.
              </p>
              {photo.description && (
                <p className="mt-4 leading-relaxed">{photo.description}</p>
              )}
              <button
                onClick={handlePlayAgain}
                className="mt-4 rounded-lg border border-border px-4 py-2 hover:border-accent text-sm"
              >
                Play again
              </button>
            </div>
          )}
        </div>
      </aside>
    </main>
  )
}