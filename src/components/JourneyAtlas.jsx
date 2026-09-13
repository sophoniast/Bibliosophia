import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, createScope, createTimeline, svg } from 'animejs'
import { computePathDistances, getPointAlongPath, prefersReducedMotion } from '../lib/mapGeometry'
import {
  BANNER_LABELS,
  CITY_LABELS,
  DECORATIONS,
  LANDS,
  LAND_TONES,
  MOUNTAINS,
  REGION_LABELS,
  RIVERS,
  SEAS,
  SEA_LABELS,
  desertStipple,
  mountainHatches,
} from '../lib/mapAtlasFeatures'
import { ATLAS_BOUNDS, ATLAS_SIZE, decklePath, pointsToPath, projectPoint } from '../lib/mapProjection'

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
    paper: night ? '#3a3124' : '#f4e7c8',
    paperAlt: night ? '#4a3f2e' : '#ead8b0',
    stain: night ? 'rgba(0, 0, 0, 0.28)' : 'rgba(124, 86, 42, 0.12)',
    sea: night ? '#3d6570' : '#8fb4bc',
    seaDeep: night ? '#2d4f58' : '#7aa3ad',
    seaEdge: night ? 'rgba(214, 230, 232, 0.4)' : 'rgba(52, 76, 82, 0.32)',
    coast: night ? 'rgba(230, 214, 180, 0.45)' : 'rgba(86, 64, 38, 0.38)',
    ink: 'rgb(var(--c-text))',
    muted: 'rgba(var(--c-text-muted), 0.62)',
    hatch: night ? 'rgba(210, 180, 120, 0.62)' : 'rgba(96, 72, 42, 0.5)',
    river: night ? '#8fb6bc' : '#6a8d93',
    routeRemain: 'rgba(var(--c-accent), 0.28)',
    pinFill: night ? '#32291d' : '#f7edd6',
    wash: night ? 0.1 : 0.06,
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
  const sheetClip = useMemo(() => decklePath(W, H), [])

  const distances = useMemo(() => computePathDistances(path), [path])
  const routeD = useMemo(() => (path?.length >= 2 ? pathD(path, false) : ''), [path])
  const seaPaths = useMemo(
    () => SEAS.map((sea) => ({ ...sea, d: pathD(sea.points, true) })),
    [],
  )
  const landFills = useMemo(
    () => LANDS.map((land) => ({ ...land, d: pathD(land.points, true) })),
    [],
  )
  const riverPaths = useMemo(
    () => RIVERS.map((river) => ({ ...river, d: pathD(river.points, false) })),
    [],
  )
  const hatches = useMemo(() => mountainHatches(MOUNTAINS), [])
  const stipple = useMemo(() => desertStipple(), [])
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
  const [palmX, palmY] = projectPoint(DECORATIONS.palm.lat, DECORATIONS.palm.lon, W, H, ATLAS_BOUNDS)
  const [zigX, zigY] = projectPoint(DECORATIONS.ziggurat.lat, DECORATIONS.ziggurat.lon, W, H, ATLAS_BOUNDS)
  const toneKey = colors.night ? 'night' : 'day'

  return (
    <div
      className="journey-atlas parchment-atlas"
      data-mode={mode}
      data-tilt={tilt ? 'on' : 'off'}
      style={{
        '--atlas-zoom': zoom,
        '--atlas-x': `${pan.x}px`,
        '--atlas-y': `${pan.y}px`,
        '--atlas-pitch': tilt ? '18deg' : '0deg',
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
                  <clipPath id={`${uid}-deckle`}>
                    <path d={sheetClip} />
                  </clipPath>
                  <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={colors.paper} />
                    <stop offset="48%" stopColor={colors.paperAlt} />
                    <stop offset="100%" stopColor={colors.paper} />
                  </linearGradient>
                  <radialGradient id={`${uid}-sea`} cx="38%" cy="32%" r="78%">
                    <stop offset="0%" stopColor={colors.sea} stopOpacity="0.96" />
                    <stop offset="100%" stopColor={colors.seaDeep} stopOpacity="0.88" />
                  </radialGradient>
                  <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </radialGradient>
                  <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="3" result="noise" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                      <feFuncA type="table" tableValues="0 0.26" />
                    </feComponentTransfer>
                    <feBlend in="SourceGraphic" mode="multiply" />
                  </filter>
                  <filter id={`${uid}-wash`} x="-8%" y="-8%" width="116%" height="116%">
                    <feGaussianBlur stdDeviation="2.6" />
                  </filter>
                  <filter id={`${uid}-soft`} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="1.8" />
                  </filter>
                </defs>

                <g clipPath={`url(#${uid}-deckle)`}>
                  <rect width={W} height={H} fill={`url(#${uid}-paper)`} filter={`url(#${uid}-grain)`} />
                  <rect width={W} height={H} fill={accent} opacity={colors.wash} />
                  <ellipse cx={W * 0.18} cy={H * 0.22} rx="130" ry="70" fill={colors.stain} />
                  <ellipse cx={W * 0.78} cy={H * 0.7} rx="160" ry="90" fill={colors.stain} />

                  {seaPaths.map((sea) => (
                    <path
                      key={`${sea.id}-wash`}
                      d={sea.d}
                      fill={`url(#${uid}-sea)`}
                      opacity="0.72"
                      filter={`url(#${uid}-wash)`}
                    />
                  ))}
                  {seaPaths.map((sea) => (
                    <path
                      key={sea.id}
                      d={sea.d}
                      fill={`url(#${uid}-sea)`}
                      stroke={colors.seaEdge}
                      strokeWidth="0.9"
                    >
                      <title>{sea.label}</title>
                    </path>
                  ))}

                  {landFills.map((land) => (
                    <path
                      key={land.id}
                      d={land.d}
                      fill={LAND_TONES[land.tone][toneKey]}
                      stroke="none"
                    />
                  ))}
                  {landFills.map((land) => (
                    <path
                      key={`coast-${land.id}`}
                      d={land.d}
                      fill="none"
                      stroke={colors.coast}
                      strokeWidth="1.35"
                      strokeLinejoin="round"
                    />
                  ))}

                  <text
                    x={W * 0.62}
                    y={H * 0.58}
                    textAnchor="middle"
                    fill={colors.ink}
                    fontFamily="var(--f-serif)"
                    fontSize="78"
                    letterSpacing="16"
                    opacity="0.055"
                  >
                    BIBLIOSOPHIA
                  </text>

                  {hatches.map((mark) => {
                    const [x, y] = projectPoint(mark.lat, mark.lon, W, H, ATLAS_BOUNDS)
                    const size = mark.size || 3
                    return (
                      <path
                        key={mark.id}
                        d={`M ${x - size} ${y + size * 0.55} L ${x} ${y - size} L ${x + size} ${y + size * 0.55}`}
                        fill="none"
                        stroke={colors.hatch}
                        strokeWidth="0.85"
                        strokeLinecap="round"
                      />
                    )
                  })}

                  {stipple.map((mark) => {
                    const [x, y] = projectPoint(mark.lat, mark.lon, W, H, ATLAS_BOUNDS)
                    return <circle key={mark.id} cx={x} cy={y} r="0.7" fill={colors.hatch} opacity="0.45" />
                  })}

                  {riverPaths.map((river) => (
                    <path
                      key={river.id}
                      data-river={river.id}
                      d={river.d}
                      fill="none"
                      stroke={colors.river}
                      strokeWidth={river.id === 'nile' || river.id === 'euphrates' ? 1.7 : 1.15}
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
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="2 8"
                    />
                  ) : null}
                  {routeD ? (
                    <path
                      ref={drawPathRef}
                      d={routeD}
                      fill="none"
                      stroke={accent}
                      strokeWidth="3.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter={`url(#${uid}-soft)`}
                    />
                  ) : null}

                  <g className="parchment-boat" transform={`translate(${boatX} ${boatY})`} opacity="0.58">
                    <path d="M -13 5 L 13 5 L 8 10 L -8 10 Z" fill={colors.ink} />
                    <path d="M -1 5 L -1 -13 L 10 -1 Z" fill={colors.pinFill} stroke={colors.ink} strokeWidth="1" />
                  </g>

                  <g className="parchment-palm" transform={`translate(${palmX} ${palmY})`} opacity="0.42">
                    <path d="M 0 12 L 0 -2" stroke={colors.ink} strokeWidth="1.2" />
                    <path d="M 0 -2 C -8 -8 -11 -1 -6 2" fill="none" stroke={colors.ink} strokeWidth="1" />
                    <path d="M 0 -2 C 8 -8 11 -1 6 2" fill="none" stroke={colors.ink} strokeWidth="1" />
                    <path d="M 0 -2 C -2 -12 4 -12 2 -3" fill="none" stroke={colors.ink} strokeWidth="1" />
                  </g>

                  <g className="parchment-ziggurat" transform={`translate(${zigX} ${zigY})`} opacity="0.4">
                    <path d="M -11 8 H 11 L 7 3 H -7 Z" fill={colors.ink} />
                    <path d="M -7 3 H 7 L 4 -1 H -4 Z" fill={colors.pinFill} stroke={colors.ink} strokeWidth="0.8" />
                    <path d="M -3 -1 H 3 L 1.4 -4 H -1.4 Z" fill={colors.ink} />
                  </g>

                  <g className="parchment-compass" transform={`translate(${compassX} ${compassY})`} opacity="0.7">
                    <circle r="20" fill="none" stroke={colors.ink} strokeWidth="0.85" />
                    <circle r="11" fill="none" stroke={colors.ink} strokeWidth="0.55" />
                    <path d="M 0 -17 L 3.2 0 L 0 17 L -3.2 0 Z" fill={accent} opacity="0.9" />
                    <path d="M -17 0 L 0 -3.2 L 17 0 L 0 3.2 Z" fill={colors.ink} opacity="0.4" />
                    <circle r="2.2" fill={colors.ink} />
                    <text y="-24" textAnchor="middle" fill={colors.ink} fontSize="8" fontFamily="var(--f-mono)">N</text>
                  </g>

                  {BANNER_LABELS.map((label) => {
                    const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                    return (
                      <text
                        key={label.name}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fill={colors.ink}
                        fontSize={label.size}
                        letterSpacing={label.tracking}
                        fontFamily="var(--f-serif)"
                        opacity="0.2"
                      >
                        {label.name}
                      </text>
                    )
                  })}

                  {REGION_LABELS.map((label) => {
                    const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                    return (
                      <text
                        key={label.name}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fill={colors.ink}
                        fontSize="13"
                        letterSpacing="2.4"
                        fontFamily="var(--f-serif)"
                        opacity="0.48"
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
                        letterSpacing="2.2"
                        fontFamily="var(--f-serif)"
                        fontStyle="italic"
                      >
                        {label.name}
                      </text>
                    )
                  })}

                  {CITY_LABELS.map((label) => {
                    const [x, y] = projectPoint(label.lat, label.lon, W, H, ATLAS_BOUNDS)
                    return (
                      <text
                        key={label.name}
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        fill={colors.ink}
                        fontSize="13"
                        fontFamily="var(--f-serif)"
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
                        <circle
                          r={active ? 6.5 : 3.2}
                          fill={active ? colors.pinFill : colors.ink}
                          stroke={active ? accent : colors.ink}
                          strokeWidth={active ? 2.2 : 1}
                        />
                        {active ? (
                          <text y="-13" textAnchor="middle" fill={colors.ink} fontSize="12" fontFamily="var(--f-serif)">
                            {pin.waypoint.name}
                          </text>
                        ) : null}
                      </g>
                    )
                  })}

                  <g
                    ref={travelerRef}
                    className="journey-atlas-traveler"
                    style={{ transformBox: 'fill-box', transformOrigin: 'center', visibility: 'hidden' }}
                  >
                    <circle r="20" fill={`url(#${uid}-glow)`} />
                    <circle r="5.2" fill={colors.pinFill} stroke={accent} strokeWidth="2.3" />
                  </g>
                  <g
                    ref={fallbackRef}
                    className="journey-atlas-traveler-fallback"
                    transform={`translate(${travelerX} ${travelerY})`}
                  >
                    <circle r="20" fill={`url(#${uid}-glow)`} />
                    <circle r="5.2" fill={colors.pinFill} stroke={accent} strokeWidth="2.3" />
                  </g>
                </g>

                <path
                  d={sheetClip}
                  fill="none"
                  stroke={colors.coast}
                  strokeWidth="2.4"
                  opacity="0.55"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
