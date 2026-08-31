import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, createScope, createTimeline, svg } from 'animejs'
import { computePathDistances, getPointAlongPath, prefersReducedMotion } from '../lib/mapGeometry'
import {
  LANDS,
  LAND_TONES,
  MOUNTAINS,
  REGION_LABELS,
  RIVERS,
  SEAS,
  SEA_LABELS,
} from '../lib/mapAtlasFeatures'
import { ATLAS_BOUNDS, ATLAS_SIZE, pointsToPath, projectPoint } from '../lib/mapProjection'

const { width: W, height: H } = ATLAS_SIZE
const EXTRUDE_STEPS = [5, 4, 3, 2, 1]

function pathD(points, close = false) {
  return pointsToPath(points, W, H, ATLAS_BOUNDS, close)
}

function civKey(civilization) {
  return civilization.id || civilization.name
}

function landFill(tone, night) {
  return LAND_TONES[tone]?.[night ? 'night' : 'day'] || LAND_TONES.levant[night ? 'night' : 'day']
}

export default function JourneyAtlas({
  journey,
  path,
  progress,
  accent,
  mode,
  tilt = true,
  zoom = 1,
  pan = { x: 0, y: 0 },
  showRegions = true,
  activeWaypointIndex,
  hoveredCivilization,
  selectedCivilization,
  onSelectWaypoint,
  onHoverCivilization,
  onSelectCivilization,
  onPanChange,
}) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef(null)
  const drawPathRef = useRef(null)
  const travelerRef = useRef(null)
  const morphRef = useRef(null)
  const morphTargetRef = useRef(null)
  const timelineRef = useRef(null)
  const progressRef = useRef(progress)
  const lastMorphKey = useRef('')
  const dragRef = useRef(null)
  const fallbackRef = useRef(null)
  const reduceMotionRef = useRef(prefersReducedMotion())

  const distances = useMemo(() => computePathDistances(path), [path])
  const routeD = useMemo(() => (path?.length >= 2 ? pathD(path, false) : ''), [path])
  const landPaths = useMemo(
    () => LANDS.map((land) => ({ ...land, d: pathD(land.points, true) })),
    [],
  )
  const inlandSeas = useMemo(
    () => SEAS
      .filter((sea) => sea.id === 'caspian' || sea.id === 'dead-sea')
      .map((sea) => ({ ...sea, d: pathD(sea.points, true) })),
    [],
  )
  const riverPaths = useMemo(
    () => RIVERS.map((river) => ({ ...river, d: pathD(river.points, false) })),
    [],
  )
  const mountainPaths = useMemo(
    () => MOUNTAINS.map((ridge) => ({ ...ridge, d: pathD(ridge.points, false) })),
    [],
  )
  const civPaths = useMemo(
    () => (journey?.civilizations || [])
      .filter((civ) => Array.isArray(civ.bounds) && civ.bounds.length >= 3)
      .map((civ) => ({
        ...civ,
        id: civKey(civ),
        d: pathD(civ.bounds, true),
      })),
    [journey],
  )
  const pins = useMemo(
    () => (journey?.points || [])
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      .map((waypoint, index) => {
        const [x, y] = projectPoint(waypoint.lat, waypoint.lon, W, H, ATLAS_BOUNDS)
        return { x, y, waypoint, index }
      }),
    [journey],
  )
  const travelerPoint = useMemo(
    () => getPointAlongPath(path, distances.distances || distances, progress * (distances.total || 0)),
    [path, distances, progress],
  )
  const [travelerX, travelerY] = travelerPoint
    ? projectPoint(travelerPoint[0], travelerPoint[1], W, H, ATLAS_BOUNDS)
    : [W / 2, H / 2]

  const night = mode === 'night'
  const ocean = night ? '#15242c' : '#7ea8b0'
  const ink = night ? 'rgba(236, 228, 208, 0.92)' : 'rgba(42, 34, 22, 0.88)'
  const muted = night ? 'rgba(214, 201, 168, 0.55)' : 'rgba(72, 60, 40, 0.5)'
  const selectedCivId = selectedCivilization ? civKey(selectedCivilization) : null
  const morphActive = Boolean(hoveredCivilization || selectedCivId)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    const scope = createScope({
      mediaQueries: {
        reduce: '(prefers-reduced-motion: reduce)',
      },
    })
    scope.add((self) => {
      reduceMotionRef.current = Boolean(self.matches.reduce)
    })
    return () => scope.revert()
  }, [])

  useEffect(() => {
    const drawEl = drawPathRef.current
    const travelerEl = travelerRef.current
    const fallbackEl = fallbackRef.current
    if (!drawEl || !travelerEl || !routeD) return undefined

    timelineRef.current?.revert?.()
    if (fallbackEl) fallbackEl.style.visibility = 'visible'
    travelerEl.style.visibility = 'hidden'

    let tl
    try {
      const drawable = svg.createDrawable(drawEl)
      const motion = svg.createMotionPath(drawEl)
      if (!motion) return undefined

      tl = createTimeline({
        autoplay: false,
        defaults: { ease: 'linear', duration: 1000 },
      })
      tl.add(drawable, { draw: reduceMotionRef.current ? '0 1' : ['0 0', '0 1'] }, 0)
      tl.add(travelerEl, { ...motion, ease: 'linear' }, 0)
      timelineRef.current = tl
      tl.pause()
      tl.seek((progressRef.current || 0) * (tl.duration || 1000))
      travelerEl.style.visibility = 'visible'
      if (fallbackEl) fallbackEl.style.visibility = 'hidden'
    } catch {
      timelineRef.current = null
    }

    return () => {
      tl?.revert?.()
      timelineRef.current = null
    }
  }, [routeD])

  useEffect(() => {
    const tl = timelineRef.current
    if (!tl) return
    tl.pause()
    tl.seek((progress || 0) * (tl.duration || 1000))
  }, [progress])

  useEffect(() => {
    const morphEl = morphRef.current
    const targetEl = morphTargetRef.current
    const target = civPaths.find((civ) => civ.id === (hoveredCivilization || selectedCivId))
    if (!morphEl || !targetEl || !target) {
      lastMorphKey.current = ''
      return undefined
    }

    targetEl.setAttribute('d', target.d)
    const key = `${journey?.id || 'journey'}:${target.id}`
    if (lastMorphKey.current === key) return undefined
    const fromKey = lastMorphKey.current
    lastMorphKey.current = key

    if (!fromKey || reduceMotionRef.current) {
      morphEl.setAttribute('d', target.d)
      return undefined
    }

    const animation = animate(morphEl, {
      d: svg.morphTo(targetEl, 0.68),
      duration: 720,
      ease: 'inOut(3)',
    })
    return () => animation?.revert?.()
  }, [civPaths, hoveredCivilization, selectedCivId, journey?.id])

  useEffect(() => {
    if (reduceMotionRef.current) return undefined
    const root = svgRef.current
    if (!root) return undefined
    const animations = riverPaths.map((river, index) => {
      const el = root.querySelector(`[data-river="${river.id}"]`)
      if (!el) return null
      return animate(svg.createDrawable(el), {
        draw: ['0 0', '0 1'],
        duration: 1400,
        delay: 160 + index * 110,
        ease: 'inOut(2)',
      })
    })
    return () => animations.forEach((animation) => animation?.revert?.())
  }, [riverPaths, uid])

  const handlePointerDown = (event) => {
    if (!onPanChange) return
    if (event.target.closest('.journey-atlas-pin, .journey-atlas-civ, .atlas-pin-3d')) return
    dragRef.current = {
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
      pointerId: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragRef.current || !onPanChange) return
    onPanChange({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    })
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  return (
    <div
      className="journey-atlas"
      data-mode={mode}
      data-tilt={tilt ? 'on' : 'off'}
      style={{
        '--atlas-zoom': zoom,
        '--atlas-x': `${pan.x}px`,
        '--atlas-y': `${pan.y}px`,
        '--atlas-pitch': tilt ? '56deg' : '0deg',
      }}
    >
      <div
        className="journey-atlas-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="journey-atlas-horizon" aria-hidden="true" />
        <div className="journey-atlas-zoom">
          <div className="journey-atlas-tilt">
            <div className="atlas-slab">
              <div className="atlas-slab-edge" aria-hidden="true" />
              <svg
                ref={svgRef}
                className="journey-atlas-svg"
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={`${journey?.title || 'Biblical'} atlas of the eastern Mediterranean`}
              >
                <defs>
                  <linearGradient id={`${uid}-ocean`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={night ? '#0d1c24' : '#8fb6bd'} />
                    <stop offset="100%" stopColor={ocean} />
                  </linearGradient>
                  <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </radialGradient>
                  <pattern id={`${uid}-grid`} width="80" height="80" patternUnits="userSpaceOnUse">
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke={accent} strokeOpacity="0.08" strokeWidth="0.8" />
                  </pattern>
                  <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="1.1" />
                  </filter>
                </defs>

                <rect width={W} height={H} fill={`url(#${uid}-ocean)`} />
                <rect width={W} height={H} fill={`url(#${uid}-grid)`} />

                {landPaths.map((land) => (
                  <g key={`${land.id}-extrude`} className="atlas-land-extrude">
                    {EXTRUDE_STEPS.map((step) => (
                      <path
                        key={`${land.id}-${step}`}
                        d={land.d}
                        transform={`translate(0 ${step * 1.5})`}
                        fill={night ? '#2a2216' : '#8a7348'}
                      />
                    ))}
                  </g>
                ))}

                {landPaths.map((land) => (
                  <path
                    key={land.id}
                    d={land.d}
                    fill={landFill(land.tone, night)}
                    stroke={night ? 'rgba(236, 228, 208, 0.18)' : 'rgba(72, 56, 28, 0.28)'}
                    strokeWidth="1.2"
                  >
                    <title>{land.name}</title>
                  </path>
                ))}

                {inlandSeas.map((sea) => (
                  <path key={sea.id} d={sea.d} fill={ocean} stroke={accent} strokeOpacity="0.16" strokeWidth="0.8">
                    <title>{sea.label}</title>
                  </path>
                ))}

                {mountainPaths.map((ridge) => (
                  <path
                    key={ridge.id}
                    d={ridge.d}
                    fill="none"
                    stroke={night ? 'rgba(48, 36, 20, 0.7)' : 'rgba(92, 68, 32, 0.45)'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <title>{ridge.label}</title>
                  </path>
                ))}

                {riverPaths.map((river) => (
                  <path
                    key={river.id}
                    data-river={river.id}
                    d={river.d}
                    fill="none"
                    stroke={night ? '#7aa8b0' : '#3f7380'}
                    strokeOpacity="0.85"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <title>{river.label}</title>
                  </path>
                ))}

                {showRegions
                  ? civPaths.map((civ) => {
                    const active = hoveredCivilization === civ.id || selectedCivId === civ.id
                    return (
                      <path
                        key={civ.id}
                        className="journey-atlas-civ"
                        d={civ.d}
                        fill={active ? `${civ.color || accent}55` : `${civ.color || accent}22`}
                        stroke={civ.color || accent}
                        strokeOpacity={active ? 0.9 : 0.4}
                        strokeWidth={active ? 2.4 : 1.2}
                        onMouseEnter={() => onHoverCivilization?.(civ.id)}
                        onMouseLeave={() => onHoverCivilization?.(null)}
                        onClick={() => onSelectCivilization?.(civ)}
                      >
                        <title>{civ.name}</title>
                      </path>
                    )
                  })
                  : null}

                <path ref={morphTargetRef} d={civPaths[0]?.d || landPaths[0]?.d} fill="none" opacity="0" pointerEvents="none" />
                <path
                  ref={morphRef}
                  className="journey-atlas-morph"
                  d={civPaths[0]?.d || landPaths[0]?.d}
                  fill="none"
                  stroke={accent}
                  strokeWidth="2.6"
                  strokeDasharray="6 8"
                  opacity={morphActive ? 0.8 : 0}
                  pointerEvents="none"
                />

                {routeD ? (
                  <path
                    d={routeD}
                    fill="none"
                    stroke={muted}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="8 10"
                    opacity="0.55"
                  />
                ) : null}
                {routeD ? (
                  <path
                    ref={drawPathRef}
                    d={routeD}
                    fill="none"
                    stroke={accent}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uid}-soft)`}
                  />
                ) : null}

                <g
                  ref={travelerRef}
                  className="journey-atlas-traveler"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center', visibility: 'hidden' }}
                >
                  <circle r="16" fill={`url(#${uid}-glow)`} />
                  <circle r="5.5" fill={accent} stroke={ink} strokeWidth="1.2" />
                  <polygon points="0,-13 4,-2 -4,-2" fill={accent} />
                </g>
                <g
                  ref={fallbackRef}
                  className="journey-atlas-traveler-fallback"
                  transform={`translate(${travelerX} ${travelerY})`}
                >
                  <circle r="16" fill={`url(#${uid}-glow)`} />
                  <circle r="5.5" fill={accent} stroke={ink} strokeWidth="1.2" />
                </g>

                {REGION_LABELS.map((label) => {
                  const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                  return (
                    <text
                      key={label.name}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill={ink}
                      fontSize="13"
                      letterSpacing="2"
                      fontFamily="var(--f-serif)"
                      opacity="0.72"
                    >
                      {label.name}
                    </text>
                  )
                })}

                {SEA_LABELS.map((label) => {
                  const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                  return (
                    <text
                      key={label.name}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill={night ? 'rgba(186, 214, 220, 0.55)' : 'rgba(28, 52, 58, 0.45)'}
                      fontSize="11"
                      letterSpacing="1.8"
                      fontFamily="var(--f-mono)"
                    >
                      {label.name.toUpperCase()}
                    </text>
                  )
                })}
              </svg>

              <div className="atlas-pin-layer">
                {pins.map((pin) => {
                  const active = pin.index === activeWaypointIndex
                  return (
                    <button
                      key={`${pin.waypoint.name}-${pin.index}`}
                      className={`atlas-pin-3d${active ? ' is-active' : ''}`}
                      onClick={() => onSelectWaypoint?.(pin.index)}
                      style={{
                        left: `${(pin.x / W) * 100}%`,
                        top: `${(pin.y / H) * 100}%`,
                      }}
                      type="button"
                    >
                      <span className="atlas-pin-stem" />
                      <span className="atlas-pin-head">{pin.index + 1}</span>
                      <span className="atlas-pin-name">{pin.waypoint.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
