'use client'

import { useState } from 'react'

export default function GalleryUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
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
              onChange={(e) => setLng(e.target.value)}
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