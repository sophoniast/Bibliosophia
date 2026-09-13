import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, createScope, createTimeline, svg } from 'animejs'
import { computePathDistances, getPointAlongPath, prefersReducedMotion } from '../lib/mapGeometry'
import {
  DECORATIONS,
  MOUNTAINS,
  REGION_LABELS,
  RIVERS,
  SEAS,
  SEA_LABELS,
  mountainHatches,
} from '../lib/mapAtlasFeatures'
import { ATLAS_BOUNDS, ATLAS_SIZE, pointsToPath, projectPoint } from '../lib/mapProjection'

const { width: W, height: H } = ATLAS_SIZE

function pathD(points, close = false) {
  return pointsToPath(points, W, H, ATLAS_BOUNDS, close)
}

function civKey(civilization) {
  return civilization.id || civilization.name
}

function themeColors(mode, accent) {
  const night = mode === 'night'
  return {
    night,
    paper: night ? '#1b1710' : '#f3e4c4',
    paperAlt: night ? '#241e14' : '#ead6ae',
    sea: night ? '#2d4a52' : '#b9cfd4',
    seaEdge: night ? 'rgba(186, 214, 220, 0.28)' : 'rgba(72, 96, 104, 0.28)',
    ink: night ? 'rgba(236, 228, 208, 0.88)' : 'rgba(58, 42, 26, 0.82)',
    muted: night ? 'rgba(214, 201, 168, 0.48)' : 'rgba(92, 72, 48, 0.42)',
    hatch: night ? 'rgba(92, 74, 48, 0.7)' : 'rgba(110, 84, 52, 0.38)',
    river: night ? '#7ea8b0' : '#6a8f96',
    routeRemain: night ? 'rgba(236, 228, 208, 0.28)' : 'rgba(72, 56, 36, 0.22)',
    pinFill: night ? '#1b1710' : '#f7edd6',
    accent,
  }
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
  const colors = themeColors(mode, accent)

  const distances = useMemo(() => computePathDistances(path), [path])
  const routeD = useMemo(() => (path?.length >= 2 ? pathD(path, false) : ''), [path])
  const seaPaths = useMemo(
    () => SEAS.map((sea) => ({ ...sea, d: pathD(sea.points, true) })),
    [],
  )
  const riverPaths = useMemo(
    () => RIVERS.map((river) => ({ ...river, d: pathD(river.points, false) })),
    [],
  )
  const hatches = useMemo(() => mountainHatches(MOUNTAINS), [])
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
        duration: 1600,
        delay: 180 + index * 120,
        ease: 'inOut(2)',
      })
    })
    return () => animations.forEach((animation) => animation?.revert?.())
  }, [riverPaths, uid])

  const handlePointerDown = (event) => {
    if (!onPanChange) return
    if (event.target.closest('.parchment-pin, .journey-atlas-civ')) return
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

  const [compassX, compassY] = projectPoint(DECORATIONS.compass.lat, DECORATIONS.compass.lon, W, H, ATLAS_BOUNDS)
  const [boatX, boatY] = projectPoint(DECORATIONS.boat.lat, DECORATIONS.boat.lon, W, H, ATLAS_BOUNDS)

  return (
    <div
      className="journey-atlas parchment-atlas"
      data-mode={mode}
      data-tilt={tilt ? 'on' : 'off'}
      style={{
        '--atlas-zoom': zoom,
        '--atlas-x': `${pan.x}px`,
        '--atlas-y': `${pan.y}px`,
        '--atlas-pitch': tilt ? '32deg' : '0deg',
        '--atlas-accent': accent,
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
            <div className="parchment-sheet">
              <svg
                ref={svgRef}
                className="journey-atlas-svg"
                viewBox={`0 0 ${W} ${H}`}
                role="img"
                aria-label={`${journey?.title || 'Biblical'} parchment atlas`}
              >
                <defs>
                  <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.paper} />
                    <stop offset="55%" stopColor={colors.paperAlt} />
                    <stop offset="100%" stopColor={colors.paper} />
                  </linearGradient>
                  <radialGradient id={`${uid}-sea`} cx="40%" cy="35%" r="75%">
                    <stop offset="0%" stopColor={colors.sea} stopOpacity="0.92" />
                    <stop offset="100%" stopColor={colors.sea} stopOpacity="0.72" />
                  </radialGradient>
                  <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </radialGradient>
                  <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" result="noise" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncA type="table" tableValues="0 0.18" />
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" mode="multiply" />
                  </filter>
                  <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="1.4" />
                  </filter>
                </defs>

                <rect width={W} height={H} fill={`url(#${uid}-paper)`} filter={`url(#${uid}-grain)`} />

                <text
                  x={W * 0.62}
                  y={H * 0.72}
                  textAnchor="middle"
                  fill={colors.ink}
                  fontFamily="var(--f-serif)"
                  fontSize="92"
                  letterSpacing="18"
                  opacity="0.06"
                >
                  BIBLIOSOPHIA
                </text>

                {seaPaths.map((sea) => (
                  <path
                    key={sea.id}
                    d={sea.d}
                    fill={`url(#${uid}-sea)`}
                    stroke={colors.seaEdge}
                    strokeWidth="1.1"
                  >
                    <title>{sea.label}</title>
                  </path>
                ))}

                {hatches.map((mark) => {
                  const [x, y] = projectPoint(mark.lat, mark.lon, W, H, ATLAS_BOUNDS)
                  return (
                    <path
                      key={mark.id}
                      d={`M ${x - 4} ${y + 3} L ${x} ${y - 5} L ${x + 4} ${y + 3}`}
                      fill="none"
                      stroke={colors.hatch}
                      strokeWidth="1.1"
                      strokeLinecap="round"
                    />
                  )
                })}

                {riverPaths.map((river) => (
                  <path
                    key={river.id}
                    data-river={river.id}
                    d={river.d}
                    fill="none"
                    stroke={colors.river}
                    strokeWidth="1.5"
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
                        fill={active ? `${civ.color || accent}33` : `${civ.color || accent}12`}
                        stroke={civ.color || accent}
                        strokeOpacity={active ? 0.55 : 0.18}
                        strokeWidth={active ? 1.6 : 0.9}
                        onMouseEnter={() => onHoverCivilization?.(civ.id)}
                        onMouseLeave={() => onHoverCivilization?.(null)}
                        onClick={() => onSelectCivilization?.(civ)}
                      >
                        <title>{civ.name}</title>
                      </path>
                    )
                  })
                  : null}

                <path ref={morphTargetRef} d={civPaths[0]?.d || seaPaths[0]?.d} fill="none" opacity="0" pointerEvents="none" />
                <path
                  ref={morphRef}
                  className="journey-atlas-morph"
                  d={civPaths[0]?.d || seaPaths[0]?.d}
                  fill="none"
                  stroke={accent}
                  strokeWidth="1.8"
                  strokeDasharray="5 7"
                  opacity={morphActive ? 0.55 : 0}
                  pointerEvents="none"
                />

                {routeD ? (
                  <path
                    d={routeD}
                    fill="none"
                    stroke={colors.routeRemain}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="3 7"
                  />
                ) : null}
                {routeD ? (
                  <path
                    ref={drawPathRef}
                    d={routeD}
                    fill="none"
                    stroke={accent}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${uid}-soft)`}
                  />
                ) : null}

                <g className="parchment-boat" transform={`translate(${boatX} ${boatY})`} opacity="0.55">
                  <path d="M -14 4 L 14 4 L 8 10 L -8 10 Z" fill={colors.ink} />
                  <path d="M 0 4 L 0 -12 L 10 -2 Z" fill={colors.pinFill} stroke={colors.ink} strokeWidth="1" />
                </g>

                <g className="parchment-compass" transform={`translate(${compassX} ${compassY})`} opacity="0.62">
                  <circle r="18" fill="none" stroke={colors.ink} strokeWidth="1" />
                  <circle r="3" fill={colors.ink} />
                  <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill={accent} opacity="0.85" />
                  <path d="M -16 0 L 0 -4 L 16 0 L 0 4 Z" fill={colors.ink} opacity="0.45" />
                  <text y="-22" textAnchor="middle" fill={colors.ink} fontSize="8" fontFamily="var(--f-mono)">N</text>
                </g>

                {REGION_LABELS.map((label) => {
                  const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                  return (
                    <text
                      key={label.name}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      fill={colors.ink}
                      fontSize="14"
                      letterSpacing="2.2"
                      fontFamily="var(--f-serif)"
                      opacity="0.55"
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
                      fill={colors.muted}
                      fontSize="11"
                      letterSpacing="2.4"
                      fontFamily="var(--f-serif)"
                      fontStyle="italic"
                    >
                      {label.name}
                    </text>
                  )
                })}

                {pins.map((pin) => {
                  const active = pin.index === activeWaypointIndex
                  return (
                    <g
                      key={`${pin.waypoint.name}-${pin.index}`}
                      className={`parchment-pin${active ? ' is-active' : ''}`}
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
                      <circle r={active ? 7 : 4.5} fill={active ? colors.pinFill : colors.ink} stroke={active ? accent : colors.ink} strokeWidth={active ? 2.4 : 1} />
                      <text y="-12" textAnchor="middle" fill={colors.ink} fontSize="13" fontFamily="var(--f-serif)">
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
                  <circle r="18" fill={`url(#${uid}-glow)`} />
                  <circle r="5" fill={colors.pinFill} stroke={accent} strokeWidth="2.2" />
                </g>
                <g
                  ref={fallbackRef}
                  className="journey-atlas-traveler-fallback"
                  transform={`translate(${travelerX} ${travelerY})`}
                >
                  <circle r="18" fill={`url(#${uid}-glow)`} />
                  <circle r="5" fill={colors.pinFill} stroke={accent} strokeWidth="2.2" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
