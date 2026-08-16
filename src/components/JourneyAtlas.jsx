import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, createScope, createTimeline, svg } from 'animejs'
import { computePathDistances, getPointAlongPath, prefersReducedMotion } from '../lib/mapGeometry'
import { ATLAS_BOUNDS, ATLAS_SIZE, pointsToPath, projectPoint } from '../lib/mapProjection'

const { width: W, height: H } = ATLAS_SIZE

const WATERS = [
  {
    id: 'mediterranean',
    label: 'Mediterranean Sea',
    points: [
      [43.8, 8.2], [44.2, 12.5], [43.1, 15.8], [41.8, 18.4], [40.6, 22.1],
      [40.2, 26.4], [36.8, 29.8], [33.4, 32.2], [32.6, 34.1], [31.4, 33.2],
      [31.2, 31.4], [31.6, 29.6], [32.8, 27.2], [33.6, 24.8], [34.2, 21.4],
      [35.4, 18.6], [37.2, 15.2], [38.6, 12.4], [40.8, 9.6], [42.4, 8.4],
    ],
  },
  {
    id: 'black-sea',
    label: 'Black Sea',
    points: [
      [41.4, 28.2], [42.8, 31.6], [43.4, 35.4], [43.1, 38.8], [41.8, 40.6],
      [40.8, 39.2], [41.1, 36.4], [41.2, 32.8], [41.0, 29.4],
    ],
  },
  {
    id: 'red-sea',
    label: 'Red Sea',
    points: [
      [30.2, 32.4], [28.4, 33.8], [26.2, 35.2], [24.1, 36.6], [22.6, 38.2],
      [22.4, 37.1], [24.6, 35.4], [27.2, 33.8], [29.4, 32.6],
    ],
  },
  {
    id: 'persian-gulf',
    label: 'Persian Gulf',
    points: [
      [30.4, 48.0], [29.8, 50.6], [27.6, 52.8], [26.2, 51.4], [26.8, 48.8], [28.6, 47.6],
    ],
  },
  {
    id: 'dead-sea',
    label: 'Dead Sea',
    points: [
      [31.8, 35.3], [31.7, 35.55], [31.2, 35.52], [31.25, 35.28],
    ],
  },
  {
    id: 'caspian',
    label: 'Caspian Sea',
    points: [
      [42.6, 47.8], [44.2, 50.4], [43.6, 52.8], [40.8, 53.2], [38.4, 51.6],
      [38.8, 49.2], [40.6, 47.6],
    ],
  },
]

const RIVERS = [
  { id: 'nile', label: 'Nile', points: [[22.4, 32.6], [24.8, 32.5], [27.2, 32.4], [29.4, 31.6], [30.8, 31.2], [31.3, 30.4]] },
  { id: 'jordan', label: 'Jordan', points: [[33.2, 35.7], [32.6, 35.6], [32.0, 35.5], [31.5, 35.4]] },
  { id: 'euphrates', label: 'Euphrates', points: [[37.8, 38.4], [36.8, 39.6], [36.2, 40.8], [35.2, 42.6], [33.6, 44.4], [32.2, 46.2], [31.0, 47.4]] },
  { id: 'tigris', label: 'Tigris', points: [[37.6, 41.2], [36.4, 43.0], [35.2, 44.6], [33.8, 45.8], [32.4, 47.0], [31.2, 47.8]] },
]

const LAND_TINT = [
  [44.8, 8.5], [45.4, 14.2], [44.6, 20.6], [43.2, 26.8], [42.8, 32.4],
  [42.4, 38.2], [41.8, 44.6], [40.2, 50.8], [36.4, 53.4], [31.2, 52.2],
  [27.4, 48.6], [26.8, 43.2], [24.6, 38.4], [23.2, 34.8], [23.6, 31.2],
  [26.8, 28.6], [29.6, 26.4], [31.8, 22.8], [33.6, 18.4], [36.2, 13.6],
  [39.4, 10.2], [42.2, 8.8],
]

const SEA_LABELS = [
  { name: 'Mediterranean Sea', lat: 35.6, lon: 20.4 },
  { name: 'Red Sea', lat: 25.2, lon: 35.8 },
  { name: 'Persian Gulf', lat: 27.6, lon: 50.4 },
  { name: 'Black Sea', lat: 42.6, lon: 34.8 },
  { name: 'Nile', lat: 27.8, lon: 30.2 },
  { name: 'Euphrates', lat: 34.4, lon: 42.8 },
]

function pathD(points, close = false) {
  return pointsToPath(points, W, H, ATLAS_BOUNDS, close)
}

function civKey(civilization) {
  return civilization.id || civilization.name
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
  const landD = useMemo(() => pathD(LAND_TINT, true), [])
  const waterPaths = useMemo(
    () => WATERS.map((water) => ({ ...water, d: pathD(water.points, true) })),
    [],
  )
  const riverPaths = useMemo(
    () => RIVERS.map((river) => ({ ...river, d: pathD(river.points, false) })),
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
  const parchment = night ? 'rgba(18, 16, 12, 0.42)' : 'rgba(248, 241, 226, 0.55)'
  const landFill = night ? 'rgba(86, 72, 42, 0.34)' : 'rgba(196, 168, 104, 0.28)'
  const waterFill = night ? 'rgba(42, 78, 92, 0.48)' : 'rgba(122, 168, 176, 0.42)'
  const ink = night ? 'rgba(236, 228, 208, 0.88)' : 'rgba(48, 40, 28, 0.82)'
  const muted = night ? 'rgba(214, 201, 168, 0.5)' : 'rgba(92, 78, 52, 0.48)'
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
    if (event.target.closest('.journey-atlas-pin, .journey-atlas-civ')) return
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
      }}
    >
      <div
        className="journey-atlas-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="journey-atlas-zoom">
          <div className="journey-atlas-tilt">
            <svg
              ref={svgRef}
              className="journey-atlas-svg"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`${journey?.title || 'Biblical'} atlas`}
            >
              <defs>
                <linearGradient id={`${uid}-parchment`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={night ? '#1a1710' : '#f7eed8'} />
                  <stop offset="55%" stopColor={night ? '#14110c' : '#efe2c4'} />
                  <stop offset="100%" stopColor={night ? '#0e0c09' : '#e7d6b0'} />
                </linearGradient>
                <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
                <pattern id={`${uid}-grid`} width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke={accent} strokeOpacity="0.1" strokeWidth="0.8" />
                </pattern>
                <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.1" />
                </filter>
              </defs>

              <rect width={W} height={H} fill={`url(#${uid}-parchment)`} />
              <rect width={W} height={H} fill={parchment} />
              <path d={landD} fill={landFill} stroke={accent} strokeOpacity="0.14" strokeWidth="1.2" />
              <rect width={W} height={H} fill={`url(#${uid}-grid)`} />

              {waterPaths.map((water) => (
                <path
                  key={water.id}
                  d={water.d}
                  fill={waterFill}
                  stroke={accent}
                  strokeOpacity="0.2"
                  strokeWidth="1"
                >
                  <title>{water.label}</title>
                </path>
              ))}

              {riverPaths.map((river) => (
                <path
                  key={river.id}
                  data-river={river.id}
                  d={river.d}
                  fill="none"
                  stroke={night ? '#7aa8b0' : '#4f7f88'}
                  strokeOpacity="0.7"
                  strokeWidth="1.7"
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

              <path ref={morphTargetRef} d={civPaths[0]?.d || landD} fill="none" opacity="0" pointerEvents="none" />
              <path
                ref={morphRef}
                className="journey-atlas-morph"
                d={civPaths[0]?.d || landD}
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

              {pins.map((pin) => {
                const active = pin.index === activeWaypointIndex
                return (
                  <g
                    key={`${pin.waypoint.name}-${pin.index}`}
                    className="journey-atlas-pin"
                    transform={`translate(${pin.x} ${pin.y})`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectWaypoint?.(pin.index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelectWaypoint?.(pin.index)
                      }
                    }}
                  >
                    <circle r={active ? 9 : 6.2} fill={active ? accent : parchment} stroke={accent} strokeWidth="2" />
                    <text y="-14" textAnchor="middle" fill={ink} fontSize="12" fontFamily="var(--f-serif)">
                      {pin.waypoint.name}
                    </text>
                  </g>
                )
              })}

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

              {SEA_LABELS.map((label) => {
                const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                return (
                  <text
                    key={label.name}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill={muted}
                    fontSize="12"
                    letterSpacing="1.6"
                    fontFamily="var(--f-mono)"
                  >
                    {label.name.toUpperCase()}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
