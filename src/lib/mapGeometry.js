export const DEFAULT_MAP_CENTER = [31.7683, 35.2137]
export const DEFAULT_ZOOM = 6

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const radius = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function computePathDistances(path) {
  if (!Array.isArray(path) || path.length < 2) return { distances: [0], total: 0 }

  let total = 0
  const distances = [0]

  for (let index = 1; index < path.length; index += 1) {
    total += haversineDistance(path[index - 1][0], path[index - 1][1], path[index][0], path[index][1])
    distances.push(total)
  }

  return { distances, total }
}

export function polygonCenter(points) {
  if (!Array.isArray(points) || points.length === 0) return DEFAULT_MAP_CENTER
  const [lat, lon] = points.reduce(
    (accumulator, point) => [accumulator[0] + point[0], accumulator[1] + point[1]],
    [0, 0],
  )
  return [lat / points.length, lon / points.length]
}

export function getPointLatLng(point) {
  return [Number(point.lat), Number(point.lon)]
}

export function getValidPath(journey) {
  const path = Array.isArray(journey?.path)
    ? journey.path
      .map((coordinate) => [Number(coordinate?.[0]), Number(coordinate?.[1])])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))
    : []

  if (path.length >= 2) return path

  return (journey?.points || [])
    .map(getPointLatLng)
    .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))
}

export function getPointAlongPath(path, distances, targetDistance) {
  if (!Array.isArray(path) || path.length === 0) return DEFAULT_MAP_CENTER
  if (path.length === 1 || targetDistance <= 0) return path[0]

  const total = distances[distances.length - 1] || 0
  if (targetDistance >= total) return path[path.length - 1]

  let index = 1
  while (index < distances.length && distances[index] < targetDistance) {
    index += 1
  }

  const previous = index - 1
  const span = distances[index] - distances[previous]
  const t = span === 0 ? 0 : (targetDistance - distances[previous]) / span

  return [
    path[previous][0] + (path[index][0] - path[previous][0]) * t,
    path[previous][1] + (path[index][1] - path[previous][1]) * t,
  ]
}

export function getTraveledPath(path, distances, targetDistance) {
  if (!Array.isArray(path) || path.length === 0) return []
  if (targetDistance <= 0) return [path[0]]

  const traveled = [path[0]]

  for (let index = 1; index < path.length; index += 1) {
    if (distances[index] < targetDistance) {
      traveled.push(path[index])
      continue
    }

    traveled.push(getPointAlongPath(path, distances, targetDistance))
    break
  }

  return traveled
}

export function getWaypointDistances(points, path, distances) {
  if (!Array.isArray(points) || points.length === 0) return [0]
  if (!Array.isArray(path) || path.length === 0) return points.map(() => 0)

  return points.map((point) => {
    let bestIndex = 0
    let bestDistance = Number.POSITIVE_INFINITY

    path.forEach((coordinate, index) => {
      const distance = haversineDistance(point.lat, point.lon, coordinate[0], coordinate[1])
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = index
      }
    })

    return distances[bestIndex] || 0
  })
}

export function getWaypointIndexForDistance(waypointDistances, targetDistance) {
  let selected = 0

  waypointDistances.forEach((distance, index) => {
    if (distance <= targetDistance + 0.5) selected = index
  })

  return selected
}

export function formatMiles(kilometers) {
  return (kilometers * 0.621371).toFixed(0)
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
