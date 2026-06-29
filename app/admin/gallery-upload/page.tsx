'use client'

import { useState, useRef, useEffect } from 'react'
import exifr from 'exifr'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function GalleryUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [gpsFoundInPhoto, setGpsFoundInPhoto] = useState<boolean | null>(null)

  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)

  // Initialize the map once, on mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [0, 20],
      zoom: 1.3,
    })

    map.current.on('click', (e) => {
      const { lat: clickedLat, lng: clickedLng } = e.lngLat
      setLat(clickedLat.toFixed(6))
      setLng(clickedLng.toFixed(6))
      placeMarker(clickedLat, clickedLng)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  function placeMarker(latVal: number, lngVal: number) {
    if (!map.current) return

    if (marker.current) {
      marker.current.setLngLat([lngVal, latVal])
    } else {
      marker.current = new mapboxgl.Marker({ color: '#166534', draggable: true })
        .setLngLat([lngVal, latVal])
        .addTo(map.current)

      // Let the user drag the pin to fine-tune the position
      marker.current.on('dragend', () => {
        const pos = marker.current!.getLngLat()
        setLat(pos.lat.toFixed(6))
        setLng(pos.lng.toFixed(6))
      })
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    setFile(selected)
    setGpsFoundInPhoto(null)

    if (!selected) return

    try {
      const gps = await exifr.gps(selected)

      if (gps?.latitude && gps?.longitude) {
        const extractedLat = gps.latitude
        const extractedLng = gps.longitude

        setLat(extractedLat.toFixed(6))
        setLng(extractedLng.toFixed(6))
        setGpsFoundInPhoto(true)

        // Center the map on the extracted location and drop a pin
        map.current?.flyTo({ center: [extractedLng, extractedLat], zoom: 12 })
        placeMarker(extractedLat, extractedLng)
      } else {
        setGpsFoundInPhoto(false)
      }
    } catch (err) {
      console.error('EXIF read error:', err)
      setGpsFoundInPhoto(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !lat || !lng) return

    setStatus('uploading')
    setErrorMessage('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('lat', lat)
    formData.append('lng', lng)
    formData.append('description', description)

    const res = await fetch('/api/admin/gallery-upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setStatus('error')
      setErrorMessage(data.error ?? 'Upload failed')
      return
    }

    setStatus('success')
    setFile(null)
    setLat('')
    setLng('')
    setDescription('')
    setGpsFoundInPhoto(null)
    marker.current?.remove()
    marker.current = null
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-32">
      <h1 className="text-2xl font-bold tracking-tight">Add a gallery game photo</h1>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm"
            required
          />
          {gpsFoundInPhoto === true && (
            <p className="text-sm text-accent mt-1">
              Location found in photo — adjust the pin below if needed.
            </p>
          )}
          {gpsFoundInPhoto === false && (
            <p className="text-sm text-text-secondary mt-1">
              No location data in this photo. Click the map to set it manually.
            </p>
          )}
        </div>

        {/* Map preview / picker */}
        <div className="rounded-xl border border-border overflow-hidden h-[300px]">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => {
                setLat(e.target.value)
                const parsedLat = parseFloat(e.target.value)
                const parsedLng = parseFloat(lng)
                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                  placeMarker(parsedLat, parsedLng)
                  map.current?.flyTo({ center: [parsedLng, parsedLat] })
                }
              }}
              className="w-full rounded-lg border border-border px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => {
                setLng(e.target.value)
                const parsedLat = parseFloat(lat)
                const parsedLng = parseFloat(e.target.value)
                if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                  placeMarker(parsedLat, parsedLng)
                  map.current?.flyTo({ center: [parsedLng, parsedLat] })
                }
              }}
              className="w-full rounded-lg border border-border px-3 py-2"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Memory description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'uploading'}
          className="rounded-lg bg-accent px-5 py-3 text-white hover:opacity-90 disabled:opacity-40"
        >
          {status === 'uploading' ? 'Uploading...' : 'Add photo'}
        </button>

        {status === 'success' && (
          <p className="text-sm text-accent">Photo added.</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    </main>
  )
}