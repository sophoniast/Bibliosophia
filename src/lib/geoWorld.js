import { LANDS, MOUNTAINS, RIVERS, SEAS } from './mapAtlasFeatures'
import { ATLAS_BOUNDS } from './mapProjection'

export const WORLD = {
  sizeX: 72,
  sizeZ: 38,
  halfX: 36,
  halfZ: 19,
  water: 0.42,
  bottom: -5.6,
  grid: 72,
  bounds: ATLAS_BOUNDS,
}

export const BIOME = {
  water: 0,
  shore: 1,
  grass: 2,
  desert: 3,
  alpine: 4,
  wetland: 5,
}

export function lonLatToWorld(lon, lat) {
  const { west, east, south, north } = WORLD.bounds
  const x = ((lon - west) / (east - west)) * WORLD.sizeX - WORLD.halfX
  const z = ((north - lat) / (north - south)) * WORLD.sizeZ - WORLD.halfZ
  return [x, z]
}

export function latLonToWorld(lat, lon) {
  return lonLatToWorld(lon, lat)
}

export function worldToLonLat(x, z) {
  const { west, east, south, north } = WORLD.bounds
  const lon = west + ((x + WORLD.halfX) / WORLD.sizeX) * (east - west)
  const lat = north - ((z + WORLD.halfZ) / WORLD.sizeZ) * (north - south)
  return [lon, lat]
}

function projectRing(points) {
  return points.map(([lat, lon]) => lonLatToWorld(lon, lat))
}

function pointInRing(x, z, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i]
    const [xj, zj] = ring[j]
    const crosses = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi + 1e-9) + xi
    if (crosses) inside = !inside
  }
  return inside
}

function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax
  const dz = bz - az
  const length = dx * dx + dz * dz
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / length))
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t))
}

function distToPolyline(x, z, line) {
  let best = Number.POSITIVE_INFINITY
  for (let i = 1; i < line.length; i += 1) {
    best = Math.min(best, distToSegment(x, z, line[i - 1][0], line[i - 1][1], line[i][0], line[i][1]))
  }
  return best
}

const LAND_RINGS = LANDS.map((land) => ({ id: land.id, tone: land.tone, ring: projectRing(land.points) }))
const SEA_RINGS = SEAS.map((sea) => ({ id: sea.id, ring: projectRing(sea.points) }))
const RIVER_LINES = RIVERS.map((river) => ({ id: river.id, line: projectRing(river.points) }))
const RIDGES = MOUNTAINS.map((ridge) => ({ id: ridge.id, line: projectRing(ridge.points) }))

function hash2(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x, z) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const u = fx * fx * (3 - 2 * fx)
  const v = fz * fz * (3 - 2 * fz)
  const a = hash2(ix, iz)
  const b = hash2(ix + 1, iz)
  const c = hash2(ix, iz + 1)
  const d = hash2(ix + 1, iz + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbm(x, z) {
  return (
    valueNoise(x, z) * 0.52 +
    valueNoise(x * 2.03, z * 2.03) * 0.28 +
    valueNoise(x * 4.11, z * 4.11) * 0.14 +
    valueNoise(x * 8.27, z * 8.27) * 0.06
  )
}

function landAt(x, z) {
  for (const land of LAND_RINGS) {
    if (pointInRing(x, z, land.ring)) return land
  }
  return null
}

function seaAt(x, z) {
  for (const sea of SEA_RINGS) {
    if (pointInRing(x, z, sea.ring)) return sea
  }
  return null
}

function ridgeLift(x, z) {
  let lift = 0
  for (const ridge of RIDGES) {
    const distance = distToPolyline(x, z, ridge.line)
    const reach = ridge.id === 'sinai' || ridge.id === 'lebanon' ? 2.4 : 3.6
    const peak = ridge.id === 'zagros' || ridge.id === 'taurus' ? 6.4 : 5.2
    lift = Math.max(lift, peak * Math.exp(-(distance * distance) / (reach * reach)))
  }
  return lift
}

function riverDistance(x, z) {
  let best = Number.POSITIVE_INFINITY
  for (const river of RIVER_LINES) {
    best = Math.min(best, distToPolyline(x, z, river.line))
  }
  return best
}

export function sampleCell(x, z) {
  const sea = seaAt(x, z)
  const land = landAt(x, z)
  const river = riverDistance(x, z)
  const mountains = ridgeLift(x, z)
  const noise = (fbm(x * 0.18, z * 0.18) - 0.46) * 1.15
  const wet = Boolean(sea) || (!land && !sea)

  let height = 0.08
  let biome = BIOME.water

  if (!wet) {
    height = 0.72 + noise
    if (land?.tone === 'highland') height += 1.55
    if (land?.tone === 'desert') height += 0.55
    if (land?.tone === 'africa') height += 0.35
    if (land?.id === 'fertile-crescent') height += 0.18
    height += mountains
    if (river < 0.72) {
      height = Math.min(height, WORLD.water - 0.08 + river * 0.55)
      biome = BIOME.wetland
    } else if (mountains > 3.2) {
      biome = BIOME.alpine
    } else if (land?.tone === 'desert') {
      biome = BIOME.desert
    } else if (land?.tone === 'africa') {
      biome = river < 2.6 ? BIOME.grass : BIOME.desert
    } else if (land?.tone === 'levant' || land?.id === 'fertile-crescent') {
      biome = BIOME.grass
    } else {
      biome = land?.tone === 'highland' ? BIOME.alpine : BIOME.grass
    }
    if (height < WORLD.water + 0.22 && biome !== BIOME.wetland) biome = BIOME.shore
    height = Math.max(WORLD.water + 0.08, height)
  }

  // Dead Sea basin sits below the water plane so the inland sea reads.
  const [deadX, deadZ] = lonLatToWorld(35.5, 31.5)
  const dead = Math.hypot(x - deadX, z - deadZ)
  if (dead < 1.15) {
    height = 0.06
    biome = BIOME.water
  }

  return { height, biome, land, wet: height < WORLD.water || biome === BIOME.water }
}

export function hashUnit(x, z, salt = 0) {
  return hash2(Math.floor(x * 3.1 + salt), Math.floor(z * 3.1 - salt))
}
