import { LANDS, MOUNTAINS, RIVERS, SEAS } from './mapAtlasFeatures'

export const SLAB = 56
export const GRID = 68
export const WATER = 0.55
export const BOTTOM = -6.4

export const WORLD = {
  sizeX: SLAB,
  sizeZ: SLAB,
  halfX: SLAB / 2,
  halfZ: SLAB / 2,
  water: WATER,
  bottom: BOTTOM,
  grid: GRID,
}

export const BIOME = {
  water: 0,
  shore: 1,
  grass: 2,
  desert: 3,
  alpine: 4,
  wetland: 5,
}

const LAND_POLYS = LANDS.map((land) => ({ id: land.id, tone: land.tone, ring: land.points }))
const SEA_POLYS = SEAS.map((sea) => ({ id: sea.id, ring: sea.points }))
const RIVER_PATHS = RIVERS.map((river) => ({ id: river.id, line: river.points }))
const RIDGE_PATHS = MOUNTAINS.map((ridge) => ({ id: ridge.id, line: ridge.points }))

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

function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i]
    const [latJ, lonJ] = ring[j]
    const crosses = latI > lat !== latJ > lat
      && lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI + 1e-9) + lonI
    if (crosses) inside = !inside
  }
  return inside
}

function distToSegment(lon, lat, aLon, aLat, bLon, bLat) {
  const dx = bLon - aLon
  const dy = bLat - aLat
  const length = dx * dx + dy * dy
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((lon - aLon) * dx + (lat - aLat) * dy) / length))
  return Math.hypot(lon - (aLon + dx * t), lat - (aLat + dy * t))
}

function distToPolyline(lon, lat, line) {
  let best = Number.POSITIVE_INFINITY
  for (let i = 1; i < line.length; i += 1) {
    const [latA, lonA] = line[i - 1]
    const [latB, lonB] = line[i]
    best = Math.min(best, distToSegment(lon, lat, lonA, latA, lonB, latB))
  }
  return best
}

function landAt(lon, lat) {
  for (const land of LAND_POLYS) {
    if (pointInRing(lon, lat, land.ring)) return land
  }
  return null
}

function seaAt(lon, lat) {
  for (const sea of SEA_POLYS) {
    if (pointInRing(lon, lat, sea.ring)) return sea
  }
  return null
}

export function squareBounds(bounds, pad = 0.14) {
  const lonSpan = Math.max(0.4, bounds.east - bounds.west)
  const latSpan = Math.max(0.4, bounds.north - bounds.south)
  let west = bounds.west - lonSpan * pad
  let east = bounds.east + lonSpan * pad
  let south = bounds.south - latSpan * pad
  let north = bounds.north + latSpan * pad
  const width = east - west
  const height = north - south
  if (width > height) {
    const extra = (width - height) / 2
    south -= extra
    north += extra
  } else {
    const extra = (height - width) / 2
    west -= extra
    east += extra
  }
  return { west, east, south, north }
}

export function createGeoWorld(bounds, climate = {}) {
  const view = squareBounds(bounds)
  const half = SLAB / 2
  const seed = climate.seed ?? 0
  const desertBias = climate.desert ?? 0.25
  const forestBias = climate.forest ?? 0.35
  const relief = climate.relief ?? 1
  const riverWidth = climate.river ?? 0.22
  const field = {
    heights: null,
    biomes: null,
    ready: false,
  }

  function lonLatToWorld(lon, lat) {
    const x = ((lon - view.west) / (view.east - view.west)) * SLAB - half
    const z = ((view.north - lat) / (view.north - view.south)) * SLAB - half
    return [x, z]
  }

  function latLonToWorld(lat, lon) {
    return lonLatToWorld(lon, lat)
  }

  function worldToLonLat(x, z) {
    const lon = view.west + ((x + half) / SLAB) * (view.east - view.west)
    const lat = view.north - ((z + half) / SLAB) * (view.north - view.south)
    return [lon, lat]
  }

  function containsLatLon(lat, lon) {
    return lon >= view.west && lon <= view.east && lat >= view.south && lat <= view.north
  }

  function ridgeLift(lon, lat) {
    let lift = 0
    for (const ridge of RIDGE_PATHS) {
      const distance = distToPolyline(lon, lat, ridge.line)
      const reach = ridge.id === 'sinai' || ridge.id === 'lebanon' ? 0.55 : 0.95
      const peak = ridge.id === 'zagros' || ridge.id === 'taurus' ? 2.15 : 1.65
      lift = Math.max(lift, peak * Math.exp(-(distance * distance) / (reach * reach)))
    }
    return lift * relief
  }

  function riverDistance(lon, lat) {
    let best = Number.POSITIVE_INFINITY
    for (const river of RIVER_PATHS) {
      best = Math.min(best, distToPolyline(lon, lat, river.line))
    }
    return best
  }

  function sampleRaw(x, z) {
    const [lon, lat] = worldToLonLat(x, z)
    const sea = seaAt(lon, lat)
    const land = landAt(lon, lat)
    const river = riverDistance(lon, lat)
    const mountains = ridgeLift(lon, lat)
    const noise = (fbm(lon * 0.42 + seed * 0.13, lat * 0.42 - seed * 0.07) - 0.46) * 1.22
    const wet = Boolean(sea) || (!land && !sea)

    let height = 0.08
    let biome = BIOME.water

    if (!wet) {
      height = 0.68 + noise * 0.62
      if (land?.tone === 'highland') height += 0.58
      if (land?.tone === 'desert') height += 0.2
      if (land?.tone === 'africa') height += 0.14
      if (land?.id === 'fertile-crescent') height += 0.12
      height += mountains
      const desertRoll = hash2(Math.floor(lon * 8 + seed), Math.floor(lat * 8 - seed))

      if (river < riverWidth) {
        height = Math.min(height, WATER - 0.06 + (river / riverWidth) * 0.48)
        biome = BIOME.wetland
      } else if (mountains > 1.05) {
        biome = BIOME.alpine
      } else if (land?.tone === 'desert' || (desertBias > 0.55 && desertRoll < desertBias)) {
        biome = BIOME.desert
      } else if (land?.tone === 'africa') {
        biome = river < riverWidth * 8 || desertRoll > desertBias ? BIOME.grass : BIOME.desert
      } else if (land?.tone === 'levant' || land?.id === 'fertile-crescent') {
        biome = desertRoll < desertBias * 0.55 ? BIOME.desert : BIOME.grass
      } else if (land?.tone === 'highland') {
        biome = forestBias > 0.45 ? BIOME.grass : BIOME.alpine
      } else {
        biome = desertRoll < desertBias * 0.35 ? BIOME.desert : BIOME.grass
      }

      if (forestBias > 0.5 && biome === BIOME.desert && desertRoll > 0.62) biome = BIOME.grass
      if (height < WATER + 0.24 && biome !== BIOME.wetland) biome = BIOME.shore
      height = Math.max(WATER + 0.08, height)
    }

    const dead = Math.hypot(lon - 35.5, lat - 31.5)
    if (dead < 0.38) {
      height = 0.06
      biome = BIOME.water
    }

    return { height, biome, land, wet: height < WATER || biome === BIOME.water }
  }

  function indexOf(x, z) {
    const n = GRID + 1
    const ix = Math.max(0, Math.min(GRID, Math.round((x + half) / (SLAB / GRID))))
    const iz = Math.max(0, Math.min(GRID, Math.round((z + half) / (SLAB / GRID))))
    return iz * n + ix
  }

  function buildField() {
    const n = GRID + 1
    const step = SLAB / GRID
    const rawHeights = new Float32Array(n * n)
    const biomes = new Uint8Array(n * n)
    for (let z = 0; z < n; z += 1) {
      for (let x = 0; x < n; x += 1) {
        const wx = -half + x * step
        const wz = -half + z * step
        const sample = sampleRaw(wx, wz)
        const i = z * n + x
        rawHeights[i] = sample.height
        biomes[i] = sample.biome
      }
    }

    const heights = new Float32Array(n * n)
    for (let z = 0; z < n; z += 1) {
      for (let x = 0; x < n; x += 1) {
        let sum = 0
        let count = 0
        for (let dz = -1; dz <= 1; dz += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = x + dx
            const nz = z + dz
            if (nx < 0 || nz < 0 || nx >= n || nz >= n) continue
            sum += rawHeights[nz * n + nx]
            count += 1
          }
        }
        const i = z * n + x
        heights[i] = sum / count
        if (biomes[i] === BIOME.water && heights[i] > WATER + 0.12) biomes[i] = BIOME.shore
        if (biomes[i] !== BIOME.water && heights[i] < WATER + 0.1) biomes[i] = BIOME.shore
      }
    }

    field.heights = heights
    field.biomes = biomes
    field.ready = true
  }

  function sampleField(x, z) {
    if (!field.ready) return sampleRaw(x, z)
    const n = GRID + 1
    const step = SLAB / GRID
    const fx = (x + half) / step
    const fz = (z + half) / step
    const x0 = Math.max(0, Math.min(GRID, Math.floor(fx)))
    const z0 = Math.max(0, Math.min(GRID, Math.floor(fz)))
    const x1 = Math.min(GRID, x0 + 1)
    const z1 = Math.min(GRID, z0 + 1)
    const tx = fx - x0
    const tz = fz - z0
    const h00 = field.heights[z0 * n + x0]
    const h10 = field.heights[z0 * n + x1]
    const h01 = field.heights[z1 * n + x0]
    const h11 = field.heights[z1 * n + x1]
    const height = h00 * (1 - tx) * (1 - tz) + h10 * tx * (1 - tz) + h01 * (1 - tx) * tz + h11 * tx * tz
    const biome = field.biomes[indexOf(x, z)]
    return { height, biome, wet: height < WATER || biome === BIOME.water }
  }

  function hashUnit(x, z, salt = 0) {
    return hash2(Math.floor(x * 3.1 + salt + seed), Math.floor(z * 3.1 - salt - seed))
  }

  return {
    view,
    climate,
    lonLatToWorld,
    latLonToWorld,
    worldToLonLat,
    containsLatLon,
    sampleRaw,
    sampleCell: sampleField,
    buildField,
    hashUnit,
  }
}

const fallback = createGeoWorld(
  { west: 8, east: 54, south: 22, north: 46 },
  { desert: 0.3, forest: 0.3, relief: 1, vegetation: 0.45, seed: 1 },
)
fallback.buildField()

export const lonLatToWorld = fallback.lonLatToWorld
export const latLonToWorld = fallback.latLonToWorld
export const worldToLonLat = fallback.worldToLonLat
export const sampleCell = fallback.sampleCell
export const hashUnit = fallback.hashUnit
