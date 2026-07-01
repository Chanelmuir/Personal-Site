import { encodePolyline, simplify } from '../lib/polyline'

export default function RouteSparkline({ route, width = 300, height = 150 }: {
  route: { type: string; coordinates: [number, number][] } | null
  width?: number
  height?: number
}) {
  if (!route?.coordinates?.length) return null

  const coords = simplify(route.coordinates)
  const encoded = encodeURIComponent(encodePolyline(coords))

  // Layered glow: wide soft halo underneath, crisp line on top
  const glow = `path-8+166534-0.35(${encoded})`
  const line = `path-3+166534-1(${encoded})`
  const pathOverlay = `${glow},${line}`

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const src = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pathOverlay}/auto/${width}x${height}@2x?padding=20&access_token=${token}`

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Route map"
      width={width}
      height={height}
      className="rounded-lg object-cover"
      loading="lazy"
    />
  )
}