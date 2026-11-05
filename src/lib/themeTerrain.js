import * as THREE from 'three'

function hslOf(color) {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  return hsl
}

function fromHsl(h, s, l) {
  return new THREE.Color().setHSL(
    (h + 1) % 1,
    THREE.MathUtils.clamp(s, 0, 1),
    THREE.MathUtils.clamp(l, 0.04, 0.96),
  )
}

export function createTerrainPalette(palette, mode = 'night') {
  const bg = new THREE.Color(palette.bg)
  const text = new THREE.Color(palette.text)
  const accent = new THREE.Color(palette.accent)
  const night = mode === 'night'
  const accentHsl = hslOf(accent)
  const bgHsl = hslOf(bg)

  const grassHue = accentHsl.h * 0.38 + 0.28 * 0.62
  const sandHue = accentHsl.h * 0.55 + 0.1 * 0.45
  const waterHue = accentHsl.h * 0.22 + 0.52 * 0.78

  return {
    night,
    bg,
    text,
    accent,
    sky: bg.clone(),
    grass: [
      fromHsl(grassHue, 0.34 + accentHsl.s * 0.2, night ? 0.34 : 0.5),
      fromHsl(grassHue + 0.02, 0.3, night ? 0.3 : 0.46),
      fromHsl(grassHue - 0.03, 0.28, night ? 0.38 : 0.54),
    ],
    sand: [
      fromHsl(sandHue, 0.28, night ? 0.42 : 0.7),
      fromHsl(sandHue + 0.02, 0.22, night ? 0.38 : 0.64),
      fromHsl(sandHue - 0.02, 0.32, night ? 0.46 : 0.74),
    ],
    alpine: [
      fromHsl(bgHsl.h, 0.08, night ? 0.32 : 0.58),
      fromHsl(accentHsl.h, 0.1, night ? 0.36 : 0.62),
    ],
    wetland: [
      fromHsl(grassHue - 0.04, 0.28, night ? 0.3 : 0.44),
      fromHsl(waterHue, 0.22, night ? 0.28 : 0.4),
    ],
    shore: fromHsl(sandHue, 0.2, night ? 0.48 : 0.72),
    stone: fromHsl(bgHsl.h, 0.06, night ? 0.28 : 0.5),
    strata: [
      fromHsl(sandHue, 0.16, night ? 0.22 : 0.42),
      fromHsl(sandHue + 0.03, 0.14, night ? 0.18 : 0.36),
      fromHsl(bgHsl.h, 0.08, night ? 0.14 : 0.28),
    ],
    water: bg.clone().lerp(fromHsl(waterHue, 0.28 + accentHsl.s * 0.12, night ? 0.22 : 0.46), night ? 0.55 : 0.72),
    waterFall: fromHsl(waterHue, 0.3, night ? 0.48 : 0.66),
    trunk: fromHsl(accentHsl.h, 0.28, night ? 0.22 : 0.32),
    canopy: [
      fromHsl(grassHue, 0.4, night ? 0.28 : 0.42),
      fromHsl(grassHue + 0.04, 0.36, night ? 0.32 : 0.48),
      fromHsl(grassHue - 0.05, 0.32, night ? 0.24 : 0.38),
    ],
    cloud: fromHsl(bgHsl.h, 0.04, night ? 0.78 : 0.96),
    hemiSky: fromHsl(bgHsl.h, 0.08, night ? 0.72 : 0.94),
    hemiGround: fromHsl(accentHsl.h, 0.18, night ? 0.18 : 0.32),
    sun: fromHsl(accentHsl.h, 0.22, night ? 0.86 : 0.96),
  }
}

export function pickSwatch(list, unit) {
  return list[Math.floor(unit * list.length) % list.length]
}
