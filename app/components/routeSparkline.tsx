export default function RouteSparkline({ route, width = 64, height = 64 }: {
  route: { type: string; coordinates: [number, number][] } | null
  width?: number
  height?: number
}) {
  if (!route?.coordinates?.length) return null

  const points = route.coordinates

  const lngs = points.map(p => p[0])
  const lats = points.map(p => p[1])
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)

  const latRange = maxLat - minLat || 1
  const lngRange = maxLng - minLng || 1

  const padding = 4
  const path = points
    .map(([lng, lat], i) => {
      const x = padding + ((lng - minLng) / lngRange) * (width - padding * 2)
      const y = padding + (1 - (lat - minLat) / latRange) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}