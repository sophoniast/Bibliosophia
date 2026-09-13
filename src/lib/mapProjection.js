const DEFAULT_BOUNDS = {
  west: 20.2,
  east: 48.6,
  south: 16.8,
  north: 38.6,
}

/** Eastern Mediterranean and Fertile Crescent window used by the parchment atlas. */
export const ATLAS_BOUNDS = DEFAULT_BOUNDS
export const ATLAS_SIZE = { width: 1000, height: 640 }

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

export function decklePath(width = ATLAS_SIZE.width, height = ATLAS_SIZE.height) {
  const inset = 10
  const w = width - inset
  const h = height - inset
  return [
    `M ${inset + 6} ${inset + 4}`,
    `C ${width * 0.18} ${inset - 2}, ${width * 0.36} ${inset + 8}, ${width * 0.52} ${inset + 1}`,
    `C ${width * 0.68} ${inset - 3}, ${width * 0.84} ${inset + 7}, ${w - 2} ${inset + 6}`,
    `C ${w + 4} ${height * 0.22}, ${w - 6} ${height * 0.4}, ${w + 1} ${height * 0.58}`,
    `C ${w + 5} ${height * 0.74}, ${w - 4} ${height * 0.88}, ${w - 3} ${h - 3}`,
    `C ${width * 0.78} ${h + 4}, ${width * 0.58} ${h - 5}, ${width * 0.4} ${h + 1}`,
    `C ${width * 0.24} ${h + 5}, ${width * 0.12} ${h - 4}, ${inset + 5} ${h - 2}`,
    `C ${inset - 4} ${height * 0.78}, ${inset + 6} ${height * 0.58}, ${inset - 1} ${height * 0.4}`,
    `C ${inset - 5} ${height * 0.24}, ${inset + 4} ${height * 0.12}, ${inset + 6} ${inset + 4}`,
    'Z',
  ].join(' ')
}
