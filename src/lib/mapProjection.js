const DEFAULT_BOUNDS = {
  west: 8,
  east: 54,
  south: 22,
  north: 46,
}

export const ATLAS_BOUNDS = DEFAULT_BOUNDS
export const ATLAS_SIZE = { width: 1000, height: 620 }

export function projectPoint(lat, lon, width = ATLAS_SIZE.width, height = ATLAS_SIZE.height, bounds = DEFAULT_BOUNDS) {
  const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * width
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * height
  return [x, y]
}

export function pointsToPath(points, width = ATLAS_SIZE.width, height = ATLAS_SIZE.height, bounds = DEFAULT_BOUNDS, close = false) {
  if (!points?.length) return ''
  const projected = points.map(([lat, lon]) => projectPoint(lat, lon, width, height, bounds))
  const [first, ...rest] = projected
  const d = [`M ${first[0].toFixed(2)} ${first[1].toFixed(2)}`, ...rest.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`)]
  if (close) d.push('Z')
  return d.join(' ')
}

export function resamplePolygon(points, count = 24) {
  if (!points?.length) return []
  const closed = [...points]
  const first = closed[0]
  const last = closed[closed.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) closed.push(first)

  const segments = []
  let total = 0
  for (let i = 1; i < closed.length; i += 1) {
    const dx = closed[i][0] - closed[i - 1][0]
    const dy = closed[i][1] - closed[i - 1][1]
    const len = Math.hypot(dx, dy)
    segments.push({ from: closed[i - 1], to: closed[i], len })
    total += len
  }
  if (total === 0) return Array.from({ length: count }, () => closed[0])

  const out = []
  for (let i = 0; i < count; i += 1) {
    let target = (i / count) * total
    for (const segment of segments) {
      if (target <= segment.len) {
        const t = segment.len === 0 ? 0 : target / segment.len
        out.push([
          segment.from[0] + (segment.to[0] - segment.from[0]) * t,
          segment.from[1] + (segment.to[1] - segment.from[1]) * t,
        ])
        break
      }
      target -= segment.len
    }
  }
  return out
}
