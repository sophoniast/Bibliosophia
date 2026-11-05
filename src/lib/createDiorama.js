import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { REGION_LABELS, SEA_LABELS } from './mapAtlasFeatures'
import {
  BIOME,
  WORLD,
  hashUnit,
  latLonToWorld,
  sampleCell,
} from './geoWorld'
import { createTerrainPalette, pickSwatch } from './themeTerrain'
import { computePathDistances } from './mapGeometry'
import { getModernName } from '../data/historicalGeography'

const HOME = new THREE.Vector3(10, 62, 13)
const SUN = new THREE.Vector3(-20, 52, 14)
const REDUCE_MOTION = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function material(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.86,
    metalness: 0.02,
    ...extras,
  })
}

function attachWaterWaves(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = { value: 0 }
    mat.userData.waterShader = shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vWaterWorldPosition;`,
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
vWaterWorldPosition = worldPosition.xyz;`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
varying vec3 vWaterWorldPosition;
uniform float uWaterTime;
float waterHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float waterNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = waterHash(i);
  float b = waterHash(i + vec2(1.0, 0.0));
  float c = waterHash(i + vec2(0.0, 1.0));
  float d = waterHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float waterWave(vec2 p) {
  return waterNoise(p * 0.16 + vec2(uWaterTime * 0.09, -uWaterTime * 0.06)) * 0.7
    + waterNoise(p * 0.34 + vec2(-uWaterTime * 0.14, uWaterTime * 0.11)) * 0.3;
}`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
vec2 waterPoint = vWaterWorldPosition.xz;
float epsilon = 0.16;
float slopeX = (waterWave(waterPoint + vec2(epsilon, 0.0)) - waterWave(waterPoint - vec2(epsilon, 0.0))) * 0.55;
float slopeZ = (waterWave(waterPoint + vec2(0.0, epsilon)) - waterWave(waterPoint - vec2(0.0, epsilon))) * 0.55;
normal = normalize(mix(normal, normalize(mat3(viewMatrix) * vec3(-slopeX, 1.0, -slopeZ)), 0.85));`,
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `float shine = pow(max(dot(normal, normalize(normalize(-vViewPosition) + vec3(0.15, 0.82, 0.22))), 0.0), 64.0);
outgoingLight += vec3(0.42, 0.55, 0.5) * shine;
#include <opaque_fragment>`,
    )
  }
  mat.customProgramCacheKey = () => 'journey-water-waves'
  mat.needsUpdate = true
}

function biomeColor(biome, height, unit, colors) {
  if (biome === BIOME.desert) return pickSwatch(colors.sand, unit).clone()
  if (biome === BIOME.alpine) {
    const color = pickSwatch(colors.alpine, unit).clone()
    if (height > 1.8) color.lerp(colors.stone, Math.min(0.55, (height - 1.8) * 0.28))
    return color
  }
  if (biome === BIOME.wetland) return pickSwatch(colors.wetland, unit).clone()
  if (biome === BIOME.shore) return colors.shore.clone()
  const color = pickSwatch(colors.grass, unit).clone()
  if (height < 1.1) color.lerp(colors.shore, 1 - THREE.MathUtils.smoothstep(height, 0.5, 1.15))
  return color
}

export function createDiorama(container, { onSelectWaypoint } = {}) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-50, 50, 34, -34, 0.1, 400)
  camera.position.copy(HOME)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.18
  renderer.setClearColor(0x111315, 1)
  renderer.domElement.className = 'journey-map-canvas'
  renderer.domElement.setAttribute('aria-hidden', 'true')
  container.appendChild(renderer.domElement)

  const labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = 'journey-map-labels'
  container.appendChild(labelRenderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 1.6, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.enableRotate = false
  controls.enablePan = true
  controls.screenSpacePanning = true
  controls.minZoom = 0.55
  controls.maxZoom = 4.2
  controls.mouseButtons.LEFT = THREE.MOUSE.PAN
  controls.mouseButtons.RIGHT = THREE.MOUSE.PAN
  controls.touches.ONE = THREE.TOUCH.PAN
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN
  controls.update()

  const hemi = new THREE.HemisphereLight(0xf4f5e5, 0x647b66, 2.2)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffedcf, 2.8)
  sun.position.copy(SUN)
  sun.castShadow = true
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 32, bottom: -32, near: 1, far: 140 })
  sun.shadow.mapSize.set(1024, 1024)
  scene.add(sun)

  const slabGroup = new THREE.Group()
  scene.add(slabGroup)

  const { sizeX, sizeZ, halfX, halfZ, grid, bottom, water } = WORLD
  const stepX = sizeX / grid
  const stepZ = sizeZ / grid

  const terrainGeometry = new THREE.BufferGeometry()
  const sideGeometry = new THREE.BufferGeometry()
  const vertexCount = grid * grid * 6
  const groundPositions = new Float32Array(vertexCount * 3)
  const groundColors = new Float32Array(vertexCount * 3)
  const groundBiomes = new Uint8Array(vertexCount)
  const groundUnits = new Float32Array(vertexCount)
  const groundHeights = new Float32Array(vertexCount)
  terrainGeometry.setAttribute('position', new THREE.BufferAttribute(groundPositions, 3))
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(groundColors, 3))
  const terrain = new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.02,
  }))
  terrain.receiveShadow = true
  terrain.castShadow = true
  slabGroup.add(terrain)

  const sidePositions = new Float32Array(grid * 4 * 3 * 6 * 3)
  const sideColors = new Float32Array(sidePositions.length)
  sideGeometry.setAttribute('position', new THREE.BufferAttribute(sidePositions, 3))
  sideGeometry.setAttribute('color', new THREE.BufferAttribute(sideColors, 3))
  const sides = new THREE.Mesh(sideGeometry, new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0,
  }))
  sides.receiveShadow = true
  slabGroup.add(sides)

  const base = new THREE.Mesh(new THREE.BoxGeometry(sizeX, 0.16, sizeZ), material(0x716358))
  base.position.y = bottom - 0.08
  slabGroup.add(base)

  const waterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sizeX, sizeZ, 48, 28).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x71bfc1,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    }),
  )
  waterMesh.position.y = water
  waterMesh.receiveShadow = true
  attachWaterWaves(waterMesh.material)
  slabGroup.add(waterMesh)

  const dummy = new THREE.Object3D()
  const instances = []
  function batch(geometry, color, max) {
    const mesh = new THREE.InstancedMesh(geometry, material(color), max)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.count = 0
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    slabGroup.add(mesh)
    instances.push(mesh)
    return mesh
  }
  function place(mesh, x, y, z, sx, sy = sx, sz = sx, rotation = 0) {
    if (mesh.count >= mesh.instanceMatrix.count) return
    dummy.position.set(x, y, z)
    dummy.scale.set(sx, sy, sz)
    dummy.rotation.set(0, rotation, 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(mesh.count, dummy.matrix)
    mesh.count += 1
  }

  const trunks = batch(new THREE.CylinderGeometry(0.12, 0.17, 1, 5), 0x7a6548, 420)
  const pines = [
    batch(new THREE.ConeGeometry(0.85, 1, 6), 0x3f7350, 280),
    batch(new THREE.ConeGeometry(0.85, 1, 6), 0x518456, 280),
    batch(new THREE.ConeGeometry(0.85, 1, 6), 0x64905c, 280),
  ]
  const canopy = batch(new THREE.IcosahedronGeometry(1, 1), 0x78a35a, 360)
  const rocks = batch(new THREE.IcosahedronGeometry(1, 0), 0xa5ad99, 260)
  const desertPlants = batch(new THREE.CylinderGeometry(0.09, 0.14, 1, 5), 0x71894f, 180)

  const clouds = []
  const cloudMaterial = material(0xf8f6ed, { roughness: 1, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
  for (let i = 0; i < 5; i += 1) {
    const group = new THREE.Group()
    const puffs = 3 + (i % 2)
    for (let p = 0; p < puffs; p += 1) {
      const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), cloudMaterial)
      puff.position.set((p - puffs / 2) * 1.1, (p % 2) * 0.28, ((p * 1.4) % 2.4) - 0.8)
      puff.scale.setScalar(0.55 + (p % 3) * 0.18)
      group.add(puff)
    }
    group.position.set(-halfX + 10 + i * 13, 17.8 + (i % 3) * 1.1, -halfZ + 8 + (i * 9) % 22)
    group.userData.speed = 0.28 + (i % 4) * 0.1
    slabGroup.add(group)
    clouds.push(group)
  }

  const routeGroup = new THREE.Group()
  slabGroup.add(routeGroup)
  let routePending = null
  const crumbMaterial = new THREE.MeshStandardMaterial({
    color: 0xc9a84c,
    emissive: 0xc9a84c,
    emissiveIntensity: 0.45,
    roughness: 0.38,
  })
  const crumbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 8), crumbMaterial, 360)
  crumbs.count = 0
  crumbs.frustumCulled = false
  crumbs.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  routeGroup.add(crumbs)

  function disposeRoute(mesh) {
    if (!mesh) return
    routeGroup.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
  }

  function makeTube(points, radius, color, extra = {}) {
    if (!points || points.length < 2) return null
    try {
      const curve = new THREE.CatmullRomCurve3(points)
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(24, Math.min(160, points.length * 4)), radius, 5, false),
        new THREE.MeshStandardMaterial({
          color,
          emissive: extra.emissive || color,
          emissiveIntensity: extra.emissiveIntensity || 0.08,
          roughness: 0.42,
          metalness: 0.08,
          transparent: true,
          opacity: extra.opacity ?? 1,
        }),
      )
      mesh.castShadow = true
      mesh.frustumCulled = false
      routeGroup.add(mesh)
      return mesh
    } catch {
      return null
    }
  }

  const traveler = new THREE.Group()
  const travelerMast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xc9a84c, emissiveIntensity: 0.35, roughness: 0.4 }),
  )
  travelerMast.position.y = 0.9
  traveler.add(travelerMast)
  const travelerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xc9a84c, emissive: 0xc9a84c, emissiveIntensity: 0.9, roughness: 0.32 }),
  )
  travelerGlow.position.y = 1.55
  travelerGlow.castShadow = true
  traveler.add(travelerGlow)
  const travelerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.05, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }),
  )
  travelerRing.rotation.x = Math.PI / 2
  travelerRing.position.y = 0.12
  traveler.add(travelerRing)
  slabGroup.add(traveler)

  const labelRoot = new THREE.Group()
  slabGroup.add(labelRoot)
  const waypointMarkers = []
  const staticLabels = []

  REGION_LABELS.forEach((entry) => {
    const [x, z] = latLonToWorld(entry.lat, entry.lon)
    const sample = sampleCell(x, z)
    const node = document.createElement('div')
    node.className = 'hist-label region'
    node.innerHTML = `<span class="hist">${entry.name}</span>`
    const object = new CSS2DObject(node)
    object.position.set(x, sample.height + 0.55, z)
    object.userData.kind = 'region'
    labelRoot.add(object)
    staticLabels.push(object)
  })
  SEA_LABELS.forEach((entry) => {
    const [x, z] = latLonToWorld(entry.lat, entry.lon)
    const node = document.createElement('div')
    node.className = 'hist-label water'
    node.innerHTML = `<span class="hist">${entry.name}</span>`
    const object = new CSS2DObject(node)
    object.position.set(x, water + 0.4, z)
    object.userData.kind = 'water'
    labelRoot.add(object)
    staticLabels.push(object)
  })

  let colors = createTerrainPalette({ bg: '#111315', text: '#D0D3D4', accent: '#F1C40F' }, 'night')
  let currentPath = []
  let currentDistances = { distances: [0], total: 0 }
  let currentProgress = 0
  let frameId = 0
  let disposed = false
  let terrainReady = false
  let intro = REDUCE_MOTION ? 1 : 0
  let followMotion = false
  let sampledRoute = []
  const followOffset = HOME.clone()
  slabGroup.scale.setScalar(REDUCE_MOTION ? 1 : 0.97)

  function shade(color, x, z, height) {
    const light = SUN.clone().normalize()
    const epsilon = 0.4
    const slopeX = (sampleCell(x + epsilon, z).height - sampleCell(x - epsilon, z).height) / (2 * epsilon)
    const slopeZ = (sampleCell(x, z + epsilon).height - sampleCell(x, z - epsilon).height) / (2 * epsilon)
    const normal = new THREE.Vector3(-slopeX, 1, -slopeZ).normalize()
    const lit = 0.74 + Math.max(0, normal.dot(light)) * 0.26
    const variation = 0.96 + hashUnit(x, z, 4) * 0.08
    return color.clone().multiplyScalar(lit * variation)
  }

  function rebuildTerrain() {
    let pointer = 0
    const writeTri = (ax, az, bx, bz, cx, cz) => {
      const points = [[ax, az], [bx, bz], [cx, cz]]
      for (const [x, z] of points) {
        const sample = sampleCell(x, z)
        const unit = hashUnit(x, z, 5)
        const color = shade(biomeColor(sample.biome, sample.height, unit, colors), x, z, sample.height)
        groundPositions[pointer * 3] = x
        groundPositions[pointer * 3 + 1] = sample.height
        groundPositions[pointer * 3 + 2] = z
        groundColors[pointer * 3] = color.r
        groundColors[pointer * 3 + 1] = color.g
        groundColors[pointer * 3 + 2] = color.b
        groundBiomes[pointer] = sample.biome
        groundUnits[pointer] = unit
        groundHeights[pointer] = sample.height
        pointer += 1
      }
    }

    for (let z = 0; z < grid; z += 1) {
      for (let x = 0; x < grid; x += 1) {
        const x0 = -halfX + x * stepX
        const z0 = -halfZ + z * stepZ
        const x1 = x0 + stepX
        const z1 = z0 + stepZ
        writeTri(x0, z0, x0, z1, x1, z0)
        writeTri(x1, z0, x0, z1, x1, z1)
      }
    }
    terrainGeometry.computeVertexNormals()
    terrainGeometry.computeBoundingSphere()
    terrainGeometry.attributes.position.needsUpdate = true
    terrainGeometry.attributes.color.needsUpdate = true

    let sidePointer = 0
    const writeSide = (x1, z1, x2, z2) => {
      const h1 = sampleCell(x1, z1).height
      const h2 = sampleCell(x2, z2).height
      const layers = [
        [h1, h2],
        [-1.4, -1.4],
        [-3.6, -3.6],
        [bottom, bottom],
      ]
      for (let layer = 0; layer < 3; layer += 1) {
        const color = colors.strata[layer]
        const verts = [
          [x1, layers[layer][0], z1],
          [x1, layers[layer + 1][0], z1],
          [x2, layers[layer][1], z2],
          [x2, layers[layer][1], z2],
          [x1, layers[layer + 1][0], z1],
          [x2, layers[layer + 1][1], z2],
        ]
        for (const vertex of verts) {
          sidePositions[sidePointer] = vertex[0]
          sideColors[sidePointer] = color.r
          sidePointer += 1
          sidePositions[sidePointer] = vertex[1]
          sideColors[sidePointer] = color.g
          sidePointer += 1
          sidePositions[sidePointer] = vertex[2]
          sideColors[sidePointer] = color.b
          sidePointer += 1
        }
      }
    }
    for (let i = 0; i < grid; i += 1) {
      const a = -halfX + i * stepX
      const b = a + stepX
      const c = -halfZ + i * stepZ
      const d = c + stepZ
      writeSide(a, -halfZ, b, -halfZ)
      writeSide(a, halfZ, b, halfZ)
      writeSide(-halfX, c, -halfX, d)
      writeSide(halfX, c, halfX, d)
    }
    sideGeometry.setDrawRange(0, sidePointer / 3)
    sideGeometry.computeVertexNormals()
    sideGeometry.attributes.position.needsUpdate = true
    sideGeometry.attributes.color.needsUpdate = true

    instances.forEach((mesh) => { mesh.count = 0 })
    for (let z = 2; z < grid - 2; z += 2) {
      for (let x = 2; x < grid - 2; x += 2) {
        const wx = -halfX + (x + 0.5) * stepX
        const wz = -halfZ + (z + 0.5) * stepZ
        const sample = sampleCell(wx, wz)
        if (sample.wet || sample.height < water + 0.5 || sample.biome === BIOME.shore || sample.biome === BIOME.wetland) continue
        const unit = hashUnit(wx, wz, 9)
        if (sample.biome === BIOME.grass && unit > 0.62) {
          const tall = 1.1 + unit * 1.4
          place(trunks, wx, sample.height + tall * 0.35, wz, 0.7, tall, 0.7, unit * 6)
          place(canopy, wx, sample.height + tall * 0.95, wz, 0.85 + unit * 0.5, 0.7, 0.85 + unit * 0.4, unit * 4)
        } else if (sample.biome === BIOME.alpine && unit > 0.55 && sample.height > 1.3) {
          const pine = pines[Math.floor(unit * pines.length) % pines.length]
          const tall = 1.4 + unit * 1.8
          place(trunks, wx, sample.height + 0.45, wz, 0.55, 0.9, 0.55, unit * 5)
          place(pine, wx, sample.height + tall * 0.7, wz, 0.7 + unit * 0.3, tall, 0.7 + unit * 0.3, unit * 3)
        } else if (sample.biome === BIOME.desert && unit > 0.91) {
          place(desertPlants, wx, sample.height + 0.35, wz, 0.7, 0.55 + unit * 0.4, 0.7, unit * 8)
        } else if (sample.biome === BIOME.alpine && unit < 0.18) {
          place(rocks, wx, sample.height + 0.18, wz, 0.35 + unit, 0.28 + unit * 0.4, 0.35 + unit, unit * 5)
        }
      }
    }
    instances.forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true })
    terrainReady = true
  }

  function recolorTerrain() {
    for (let i = 0; i < groundBiomes.length; i += 1) {
      const x = groundPositions[i * 3]
      const z = groundPositions[i * 3 + 2]
      const color = shade(biomeColor(groundBiomes[i], groundHeights[i], groundUnits[i], colors), x, z, groundHeights[i])
      groundColors[i * 3] = color.r
      groundColors[i * 3 + 1] = color.g
      groundColors[i * 3 + 2] = color.b
    }
    terrainGeometry.attributes.color.needsUpdate = true
    let sidePointer = 0
    for (let i = 0; i < grid * 4; i += 1) {
      for (let layer = 0; layer < 3; layer += 1) {
        const color = colors.strata[layer]
        for (let v = 0; v < 6; v += 1) {
          sideColors[sidePointer] = color.r
          sideColors[sidePointer + 1] = color.g
          sideColors[sidePointer + 2] = color.b
          sidePointer += 3
        }
      }
    }
    sideGeometry.attributes.color.needsUpdate = true
  }

  function applyTheme(palette, mode) {
    colors = createTerrainPalette(palette, mode)
    renderer.setClearColor(colors.sky, 1)
    hemi.color.copy(colors.hemiSky)
    hemi.groundColor.copy(colors.hemiGround)
    sun.color.copy(colors.sun)
    sun.intensity = mode === 'night' ? 2.15 : 3.05
    waterMesh.material.color.copy(colors.water)
    cloudMaterial.color.copy(colors.cloud)
    base.material.color.copy(colors.strata[2])
    trunks.material.color.copy(colors.trunk)
    canopy.material.color.copy(colors.canopy[1])
    pines.forEach((mesh, index) => mesh.material.color.copy(colors.canopy[index % colors.canopy.length]))
    rocks.material.color.copy(colors.stone)
    desertPlants.material.color.copy(colors.canopy[2])
    travelerGlow.material.color.copy(colors.accent)
    travelerGlow.material.emissive.copy(colors.accent)
    travelerMast.material.emissive.copy(colors.accent)
    crumbMaterial.color.copy(colors.accent)
    crumbMaterial.emissive.copy(colors.accent)
    if (routePending) {
      const pending = mode === 'night' ? new THREE.Color(1, 1, 1) : colors.text.clone()
      routePending.material.color.copy(pending)
      routePending.material.emissive.copy(pending)
    }
    if (terrainReady) recolorTerrain()
    else rebuildTerrain()
  }

  function worldPoint(lat, lon, lift = 0.28) {
    const [x, z] = latLonToWorld(lat, lon)
    const sample = sampleCell(x, z)
    return new THREE.Vector3(x, Math.max(sample.height, water) + lift, z)
  }

  function densifyPath(path) {
    const points = []
    if (!Array.isArray(path) || path.length === 0) return points
    for (let index = 0; index < path.length; index += 1) {
      const [lat, lon] = path[index]
      if (index === 0) {
        points.push(worldPoint(lat, lon, 0.42))
        continue
      }
      const [prevLat, prevLon] = path[index - 1]
      const from = worldPoint(prevLat, prevLon, 0.42)
      const to = worldPoint(lat, lon, 0.42)
      const steps = Math.max(1, Math.ceil(from.distanceTo(to) / 0.34))
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps
        points.push(worldPoint(
          prevLat + (lat - prevLat) * t,
          prevLon + (lon - prevLon) * t,
          0.42,
        ))
      }
    }
    return points
  }

  function pointOnSampledRoute(progress) {
    if (sampledRoute.length === 0) return null
    if (sampledRoute.length === 1 || progress <= 0) return sampledRoute[0].clone()
    const max = sampledRoute.length - 1
    const exact = THREE.MathUtils.clamp(progress, 0, 1) * max
    const index = Math.floor(exact)
    const next = Math.min(max, index + 1)
    return sampledRoute[index].clone().lerp(sampledRoute[next], exact - index)
  }

  function replacePending(points) {
    disposeRoute(routePending)
    const pending = colors.night ? new THREE.Color(1, 1, 1) : colors.text.clone()
    routePending = makeTube(points, 0.08, pending, { emissiveIntensity: 0.05, opacity: 0.38 })
  }

  function layoutCrumbs(points) {
    const stride = Math.max(1, Math.ceil(points.length / crumbs.instanceMatrix.count))
    let count = 0
    dummy.scale.setScalar(1)
    dummy.rotation.set(0, 0, 0)
    for (let index = 0; index < points.length && count < crumbs.instanceMatrix.count; index += stride) {
      dummy.position.copy(points[index])
      dummy.updateMatrix()
      crumbs.setMatrixAt(count, dummy.matrix)
      count += 1
    }
    crumbs.userData.total = count
    crumbs.instanceMatrix.needsUpdate = true
    crumbs.count = 0
  }

  function clearWaypoints() {
    waypointMarkers.forEach((marker) => {
      labelRoot.remove(marker.label)
      slabGroup.remove(marker.mesh)
      marker.mesh.geometry.dispose()
      marker.mesh.material.dispose()
    })
    waypointMarkers.length = 0
  }

  function setJourney(journey, path) {
    currentPath = Array.isArray(path) ? path : []
    currentDistances = computePathDistances(currentPath)
    sampledRoute = densifyPath(currentPath)
    clearWaypoints()
    replacePending(sampledRoute)
    layoutCrumbs(sampledRoute)
    ;(journey?.points || []).forEach((point, index) => {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return
      const position = worldPoint(point.lat, point.lon, 0.48)
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 12),
        new THREE.MeshStandardMaterial({ color: colors.accent, roughness: 0.4, metalness: 0.08 }),
      )
      mesh.position.copy(position)
      mesh.castShadow = true
      mesh.userData.waypointIndex = index
      slabGroup.add(mesh)

      const modern = getModernName(point.name)
      const node = document.createElement('button')
      node.type = 'button'
      node.className = 'journey-map-label is-compact'
      node.dataset.name = point.name
      node.dataset.modern = modern || ''
      node.dataset.index = String(index + 1).padStart(2, '0')
      node.innerHTML = `<span class="hist">${node.dataset.index}</span>`
      node.addEventListener('click', (event) => {
        event.stopPropagation()
        onSelectWaypoint?.(index)
      })
      const label = new CSS2DObject(node)
      label.position.copy(position).add(new THREE.Vector3(0, 0.7, 0))
      labelRoot.add(label)
      waypointMarkers.push({ mesh, label, index, name: point.name, modern })
    })
    setProgress(currentProgress, { follow: followMotion })
  }

  function setProgress(progress, { follow = followMotion } = {}) {
    currentProgress = progress
    followMotion = Boolean(follow)
    if (sampledRoute.length < 2) return
    const totalCrumbs = crumbs.userData.total || 0
    crumbs.count = Math.max(1, Math.round(THREE.MathUtils.clamp(progress, 0, 1) * totalCrumbs))
    const position = pointOnSampledRoute(progress)
    if (position) traveler.position.copy(position)
  }

  function setActiveWaypoint(index) {
    waypointMarkers.forEach((marker) => {
      const active = marker.index === index
      marker.mesh.scale.setScalar(active ? 1.5 : 1)
      marker.mesh.material.emissive = active ? colors.accent : new THREE.Color(0x000000)
      marker.mesh.material.emissiveIntensity = active ? 0.45 : 0
      const node = marker.label.element
      node.classList.toggle('is-active', active)
      node.classList.toggle('is-compact', !active)
      if (active) {
        node.innerHTML = `<span class="hist">${marker.name}</span>${
          marker.modern ? `<span class="modern">${marker.modern}</span>` : ''
        }`
      } else {
        node.innerHTML = `<span class="hist">${node.dataset.index}</span>`
      }
    })
  }

  function fitRoute() {
    followMotion = false
    let target = new THREE.Vector3(0, 1.2, 0)
    if (sampledRoute.length >= 2) {
      const box = new THREE.Box3().setFromPoints(sampledRoute)
      const center = box.getCenter(new THREE.Vector3())
      target.set(center.x * 0.35, 1.2, center.z * 0.35)
    }
    controls.target.copy(target)
    camera.position.set(HOME.x + target.x, HOME.y, HOME.z + target.z)
    camera.zoom = 1.08
    camera.updateProjectionMatrix()
    controls.update()
  }

  function resize() {
    const width = container.clientWidth || 1
    const height = container.clientHeight || 1
    const aspect = width / height
    const halfHeight = 34
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
    labelRenderer.setSize(width, height)
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  function onClick(event) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(waypointMarkers.map((marker) => marker.mesh), false)
    if (hits[0]) onSelectWaypoint?.(hits[0].object.userData.waypointIndex)
  }
  renderer.domElement.addEventListener('click', onClick)

  const projected = new THREE.Vector3()
  function screenOf(object) {
    object.getWorldPosition(projected)
    projected.project(camera)
    return {
      x: (projected.x * 0.5 + 0.5) * (container.clientWidth || 1),
      y: (-projected.y * 0.5 + 0.5) * (container.clientHeight || 1),
    }
  }

  function declutterLabels() {
    const waypointScreens = waypointMarkers.map((marker) => ({
      active: marker.label.element.classList.contains('is-active'),
      ...screenOf(marker.label),
    }))
    staticLabels.forEach((label) => {
      const pos = screenOf(label)
      const blocked = waypointScreens.some((waypoint) => {
        const dx = waypoint.x - pos.x
        const dy = waypoint.y - pos.y
        const pad = waypoint.active ? 130 : 56
        return dx * dx + dy * dy < pad * pad
      })
      label.element.classList.toggle('is-occluded', blocked)
    })
  }

  const clock = new THREE.Clock()
  let labelPass = 0
  function tick() {
    if (disposed) return
    const elapsed = clock.getElapsedTime()
    if (followMotion && sampledRoute.length) {
      const target = traveler.position.clone()
      target.y = 1.15
      controls.target.lerp(target, 0.14)
      camera.position.lerp(target.clone().add(followOffset), 0.14)
    }
    controls.update()
    if (intro < 1) {
      intro = Math.min(1, intro + 0.02)
      const t = 1 - (1 - intro) ** 3
      slabGroup.scale.setScalar(0.97 + 0.03 * t)
    }
    if (!REDUCE_MOTION) {
      clouds.forEach((cloud, index) => {
        cloud.position.x += cloud.userData.speed * 0.012
        cloud.position.y += Math.sin(elapsed * 0.35 + index) * 0.003
        if (cloud.position.x > halfX + 8) cloud.position.x = -halfX - 8
      })
      travelerGlow.position.y = 1.55 + Math.sin(elapsed * 2.4) * 0.06
      travelerRing.rotation.z = elapsed * 0.6
      const shader = waterMesh.material.userData.waterShader
      if (shader) shader.uniforms.uWaterTime.value = elapsed
    }
    if ((labelPass += 1) % 4 === 0) declutterLabels()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
    frameId = window.requestAnimationFrame(tick)
  }

  rebuildTerrain()
  resize()
  tick()
  const observer = new ResizeObserver(resize)
  observer.observe(container)

  return {
    applyTheme,
    setJourney,
    setProgress,
    setActiveWaypoint,
    fitRoute,
    zoomIn() {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * 1.18, controls.minZoom, controls.maxZoom)
      camera.updateProjectionMatrix()
    },
    zoomOut() {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom / 1.18, controls.minZoom, controls.maxZoom)
      camera.updateProjectionMatrix()
    },
    resize,
    dispose() {
      disposed = true
      window.cancelAnimationFrame(frameId)
      observer.disconnect()
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      clearWaypoints()
      renderer.dispose()
      labelRenderer.domElement.remove()
      renderer.domElement.remove()
    },
  }
}
