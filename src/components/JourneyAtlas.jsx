import { useEffect, useId, useMemo, useRef } from 'react'
import { animate, createScope, createTimeline, svg } from 'animejs'
import { createReliefRenderer } from '../lib/mapReliefWebGL'
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
  reliefActive = false,
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
  const reliefCanvasRef = useRef(null)
  const reliefApiRef = useRef(null)
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
  const landPathStrings = useMemo(() => landPaths.map((land) => land.d), [landPaths])
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
  const mountainPathStrings = useMemo(() => mountainPaths.map((ridge) => ridge.d), [mountainPaths])
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
  const oceanDeep = night ? '#081018' : '#6a8f9a'
  const ink = night ? 'rgba(236, 228, 208, 0.92)' : 'rgba(42, 34, 22, 0.88)'
  const muted = night ? 'rgba(214, 201, 168, 0.45)' : 'rgba(72, 60, 40, 0.42)'
  const selectedCivId = selectedCivilization ? civKey(selectedCivilization) : null
  const morphActive = Boolean(hoveredCivilization || selectedCivId)
  const oceanTop = night ? '#0d1c24' : '#9ebfc8'
  const oceanBottom = night ? '#0f1c28' : '#7ea8b0'

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
    const canvas = reliefCanvasRef.current
    if (!canvas || landPathStrings.length === 0) return undefined

    const api = createReliefRenderer(canvas, {
      landPaths: landPathStrings,
      mountainPaths: mountainPathStrings,
    })
    if (!api) return undefined

    reliefApiRef.current = api
    api.setNight(night)
    api.setActive(reliefActive)
    api.start()

    return () => {
      api.destroy()
      reliefApiRef.current = null
    }
  }, [landPathStrings, mountainPathStrings])

  useEffect(() => {
    reliefApiRef.current?.setActive(reliefActive)
  }, [reliefActive])

  useEffect(() => {
    reliefApiRef.current?.setNight(night)
  }, [night])

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
    if (event.target.closest('.journey-atlas-pin, .journey-atlas-civ, .atlas-pin-flat')) return
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
      data-relief={reliefActive ? 'on' : 'off'}
      style={{
        '--atlas-zoom': zoom,
        '--atlas-x': `${pan.x}px`,
        '--atlas-y': `${pan.y}px`,
        '--atlas-ocean-top': oceanTop,
        '--atlas-ocean-bottom': oceanBottom,
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
          <div className="atlas-slab atlas-slab-flat">
            <svg
              ref={svgRef}
              className="journey-atlas-svg journey-atlas-svg-base"
              viewBox={`0 0 ${W} ${H}`}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id={`${uid}-ocean`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={oceanTop} />
                  <stop offset="100%" stopColor={oceanBottom} />
                </linearGradient>
                <pattern id={`${uid}-grid`} width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M 80 0 L 0 0 0 80" fill="none" stroke={accent} strokeOpacity="0.07" strokeWidth="0.8" />
                </pattern>
                <pattern id={`${uid}-ripple`} width="48" height="24" patternUnits="userSpaceOnUse">
                  <path
                    className="atlas-water-ripple-stroke"
                    d="M0 12 Q12 4 24 12 T48 12"
                    fill="none"
                    stroke={night ? 'rgba(160,200,220,0.22)' : 'rgba(255,255,255,0.35)'}
                    strokeWidth="1.2"
                  />
                  <path
                    className="atlas-water-ripple-stroke"
                    d="M0 18 Q12 10 24 18 T48 18"
                    fill="none"
                    stroke={night ? 'rgba(120,170,200,0.12)' : 'rgba(255,255,255,0.18)'}
                    strokeWidth="1"
                  />
                </pattern>
                <filter id={`${uid}-coast`} x="-8%" y="-8%" width="116%" height="116%">
                  <feDropShadow
                    dx="0"
                    dy="1.5"
                    stdDeviation="1.2"
                    floodColor={night ? '#000000' : '#3a2f1c'}
                    floodOpacity={reliefActive ? (night ? 0.55 : 0.28) : (night ? 0.22 : 0.12)}
                  />
                </filter>
              </defs>

              <rect width={W} height={H} fill={`url(#${uid}-ocean)`} />
              <rect
                className="atlas-water-shimmer"
                width={W}
                height={H}
                fill={`url(#${uid}-ripple)`}
                opacity={night ? 0.55 : 0.4}
              />
              <rect width={W} height={H} fill={`url(#${uid}-grid)`} />

              {landPaths.map((land) => (
                <path
                  key={land.id}
                  className="atlas-land-base"
                  d={land.d}
                  fill={landFill(land.tone, night)}
                  stroke={night ? 'rgba(236, 228, 208, 0.16)' : 'rgba(72, 56, 28, 0.22)'}
                  strokeWidth="1.1"
                  filter={`url(#${uid}-coast)`}
                  opacity={reliefActive ? 0.38 : 1}
                >
                  <title>{land.name}</title>
                </path>
              ))}

              {inlandSeas.map((sea) => (
                <path key={sea.id} d={sea.d} fill={oceanDeep} stroke={accent} strokeOpacity="0.14" strokeWidth="0.8">
                  <title>{sea.label}</title>
                </path>
              ))}

              {mountainPaths.map((ridge) => (
                <path
                  key={ridge.id}
                  className="atlas-ridge"
                  d={ridge.d}
                  fill="none"
                  stroke={night ? 'rgba(48, 36, 20, 0.55)' : 'rgba(92, 68, 32, 0.38)'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={reliefActive ? 0.28 : 0.7}
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
            </svg>

            <canvas ref={reliefCanvasRef} className="atlas-relief-canvas" aria-hidden="true" />

            <svg
              className="journey-atlas-svg journey-atlas-svg-overlay"
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-label={`${journey?.title || 'Biblical'} atlas of the eastern Mediterranean`}
            >
              <defs>
                <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
                <filter id={`${uid}-path-glow`} x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {showRegions
                ? civPaths.map((civ) => {
                  const active = hoveredCivilization === civ.id || selectedCivId === civ.id
                  return (
                    <path
                      key={civ.id}
                      className="journey-atlas-civ"
                      d={civ.d}
                      fill={active ? `${civ.color || accent}55` : `${civ.color || accent}18`}
                      stroke={civ.color || accent}
                      strokeOpacity={active ? 0.9 : 0.35}
                      strokeWidth={active ? 2.4 : 1.1}
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
                  stroke={accent}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="7 9"
                  opacity="0.55"
                />
              ) : null}
              {routeD ? (
                <path
                  ref={drawPathRef}
                  className="atlas-route-progress"
                  d={routeD}
                  fill="none"
                  stroke={accent}
                  strokeWidth="3.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${uid}-path-glow)`}
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
                    opacity="0.78"
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
                    fill={night ? 'rgba(186, 214, 220, 0.5)' : 'rgba(28, 52, 58, 0.42)'}
                    fontSize="11"
                    letterSpacing="2.2"
                    fontFamily="var(--f-mono)"
                  >
                    {label.name.toUpperCase()}
                  </text>
                )
              })}
            </svg>

            <div className="atlas-pin-layer atlas-pin-layer-flat">
              {pins.map((pin) => {
                const active = pin.index === activeWaypointIndex
                const visited = pin.index < activeWaypointIndex
                return (
                  <button
                    key={`${pin.waypoint.name}-${pin.index}`}
                    className={`atlas-pin-flat${active ? ' is-active' : ''}${visited ? ' is-visited' : ''}`}
                    onClick={() => onSelectWaypoint?.(pin.index)}
                    style={{
                      left: `${(pin.x / W) * 100}%`,
                      top: `${(pin.y / H) * 100}%`,
                    }}
                    type="button"
                    title={pin.waypoint.name}
                  >
                    <span className="atlas-pin-flat-mark" />
                    <span className="atlas-pin-flat-name">{pin.waypoint.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
