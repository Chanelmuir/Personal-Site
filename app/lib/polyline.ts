export function encodePolyline(coordinates: [number, number][], precision = 5): string {
  const factor = Math.pow(10, precision)
  let output = ''
  let prevLat = 0
  let prevLng = 0

  for (const [lng, lat] of coordinates) {
    const lat5 = Math.round(lat * factor)
    const lng5 = Math.round(lng * factor)

    output += encodeNumber(lat5 - prevLat)
    output += encodeNumber(lng5 - prevLng)

    prevLat = lat5
    prevLng = lng5
  }

  return output
}

function encodeNumber(num: number): string {
  let sgnNum = num << 1
  if (num < 0) sgnNum = ~sgnNum

  let output = ''
  while (sgnNum >= 0x20) {
    output += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63)
    sgnNum >>= 5
  }
  output += String.fromCharCode(sgnNum + 63)
  return output
}

// Compress routes that would breach Mapbox static API character limit
export function simplify(coords: [number, number][], maxPoints = 100): [number, number][] {
  if (coords.length <= maxPoints) return coords
  const step = Math.ceil(coords.length / maxPoints)
  const simplified = coords.filter((_, i) => i % step === 0)
  const last = coords[coords.length - 1]
  if (simplified[simplified.length - 1] !== last) simplified.push(last)
  return simplified
}

// Inverse of encodePolyline: returns [lng, lat] pairs
export function decodePolyline(encoded: string, precision = 5): [number, number][] {
  const factor = Math.pow(10, precision)
  const coords: [number, number][] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0
      let shift = 0
      let byte: number
      do {
        byte = encoded.charCodeAt(index++) - 63
        result |= (byte & 0x1f) << shift
        shift += 5
      } while (byte >= 0x20)
      const delta = result & 1 ? ~(result >> 1) : result >> 1
      if (axis === 0) lat += delta
      else lng += delta
    }
    coords.push([lng / factor, lat / factor])
  }

  return coords
}
