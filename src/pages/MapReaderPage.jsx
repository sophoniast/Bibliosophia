import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  BookOpen,
  ChevronRight,
  Crosshair,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Ruler,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react'
import SiteFrame from '../components/SiteFrame'
import { useTheme } from '../context/ThemeContext'
import { getJourneys } from '../lib/api'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  computePathDistances,
  formatMiles,
  getPointAlongPath,
  getTraveledPath,
  getValidPath,
  getWaypointDistances,
  getWaypointIndexForDistance,
  polygonCenter,
  prefersReducedMotion,
} from '../lib/mapGeometry'

const TILE_URLS = {
  night: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  day: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
}
const OSM_FALLBACK = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const PLAYBACK_SPEEDS = [1, 2, 4]

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return alpha == null ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function createPinIcon(point, index, { isActive, isHovered, isVisited }) {
  const stateClass = [
    isActive ? 'is-active' : '',
    isHovered ? 'is-hovered' : '',
    isVisited && !isActive ? 'is-visited' : '',
  ].filter(Boolean).join(' ')

  return L.divIcon({
    className: 'map-pin-icon',
    html: `
      <button class="map-pin ${stateClass}" type="button" aria-label="${escapeHtml(point.name)}">
        <span class="map-pin-orb">${index + 1}</span>
        <span class="map-pin-stem"></span>
        <span class="map-pin-label">${escapeHtml(point.name)}</span>
      </button>
    `,
    iconAnchor: [18, 46],
    iconSize: [36, 52],
  })
}

function createTravelerIcon() {
  return L.divIcon({
    className: 'map-traveler-icon',
    html: '<div class="map-traveler" aria-hidden="true"><span></span></div>',
    iconAnchor: [14, 14],
    iconSize: [28, 28],
  })
}

function MapReaderPage() {
  const { mode, palette } = useTheme()
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const layersRef = useRef({ markers: [], labels: [], polygons: [], routes: [] })
  const travelerRef = useRef(null)
  const traveledRef = useRef(null)
  const remainingRef = useRef(null)
  const playbackRef = useRef({ lastTs: 0, speed: 1 })
  const followRef = useRef(false)
  const progressRef = useRef(0)
  const paletteRef = useRef(palette)
  const reduceMotionRef = useRef(false)
  paletteRef.current = palette
  reduceMotionRef.current = prefersReducedMotion()

  const [journeys, setJourneys] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeJourneyId, setActiveJourneyId] = useState(null)
  const [selectedWaypoint, setSelectedWaypoint] = useState(0)
  const [hoveredWaypoint, setHoveredWaypoint] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLoreExpanded, setIsLoreExpanded] = useState(false)
  const [showRegions, setShowRegions] = useState(true)
  const [selectedCivilization, setSelectedCivilization] = useState(null)

  useEffect(() => {
    let isCancelled = false

    getJourneys()
      .then((nextJourneys) => {
        if (isCancelled || !Array.isArray(nextJourneys) || nextJourneys.length === 0) return
        setJourneys(nextJourneys)
        setActiveJourneyId(nextJourneys[0].id)
        setIsLoaded(true)
      })
      .catch(() => {
        if (!isCancelled) setIsLoaded(true)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const activeJourney = useMemo(
    () => journeys.find((journey) => journey.id === activeJourneyId) || journeys[0],
    [activeJourneyId, journeys],
  )
  const activePath = useMemo(() => getValidPath(activeJourney), [activeJourney])
  const { distances, total } = useMemo(
    () => computePathDistances(activePath),
    [activePath],
  )
  const waypointDistances = useMemo(
    () => getWaypointDistances(activeJourney?.points || [], activePath, distances),
    [activeJourney, activePath, distances],
  )

  const currentPoint = activeJourney?.points?.[selectedWaypoint] || activeJourney?.points?.[0]
  const currentDistance = total * progress
  const reduceMotion = reduceMotionRef.current

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    if (!activeJourney?.points?.length) return
    if (selectedWaypoint > activeJourney.points.length - 1) {
      setSelectedWaypoint(0)
    }
  }, [activeJourney, selectedWaypoint])

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return undefined

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: true,
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_ZOOM)

    map.attributionControl.setPrefix('')
    mapRef.current = map
    window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      travelerRef.current = null
      traveledRef.current = null
      remainingRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const nextUrl = TILE_URLS[mode] || TILE_URLS.night
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(nextUrl)
      return
    }

    const tileLayer = L.tileLayer(nextUrl, {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map)

    let usedFallback = false
    tileLayer.on('tileerror', () => {
      if (usedFallback) return
      usedFallback = true
      tileLayer.setUrl(OSM_FALLBACK)
    })

    tileLayerRef.current = tileLayer
  }, [mode])

  useEffect(() => {
    const map = mapRef.current
    const container = mapContainerRef.current
    if (!map || !container || typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [activeJourney, isLoaded])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeJourney) return undefined

    const clearLayers = () => {
      layersRef.current.markers.forEach((layer) => map.removeLayer(layer))
      layersRef.current.labels.forEach((layer) => map.removeLayer(layer))
      layersRef.current.polygons.forEach((layer) => map.removeLayer(layer))
      layersRef.current.routes.forEach((layer) => map.removeLayer(layer))
      if (travelerRef.current) map.removeLayer(travelerRef.current)
      if (traveledRef.current) map.removeLayer(traveledRef.current)
      if (remainingRef.current) map.removeLayer(remainingRef.current)
      layersRef.current = { markers: [], labels: [], polygons: [], routes: [] }
      travelerRef.current = null
      traveledRef.current = null
      remainingRef.current = null
    }

    clearLayers()

    if (showRegions) {
      ;(activeJourney.civilizations || []).forEach((civilization) => {
        if (!Array.isArray(civilization.bounds) || civilization.bounds.length < 3) return

        const polygon = L.polygon(civilization.bounds, {
          color: civilization.color,
          fillColor: civilization.color,
          fillOpacity: 0.16,
          weight: 1.5,
          className: 'map-region',
        }).addTo(map)

        polygon.on('mouseover', () => {
          polygon.setStyle({ fillOpacity: 0.32, weight: 2.5 })
        })
        polygon.on('mouseout', () => {
          polygon.setStyle({ fillOpacity: 0.16, weight: 1.5 })
        })
        polygon.on('click', () => {
          setSelectedCivilization(civilization)
          map.flyTo(polygonCenter(civilization.bounds), Math.max(map.getZoom(), 6), {
            duration: reduceMotionRef.current ? 0 : 0.85,
          })
        })

        const label = L.marker(polygonCenter(civilization.bounds), {
          icon: L.divIcon({
            className: 'map-region-label-icon',
            html: `<div class="map-region-label">${escapeHtml(civilization.name)}</div>`,
          }),
          interactive: false,
        }).addTo(map)

        layersRef.current.polygons.push(polygon)
        layersRef.current.labels.push(label)
      })
    }

    if (activePath.length >= 2) {
      const remaining = L.polyline(activePath, {
        color: hexToRgba('#f8fafc', 0.28),
        weight: 3,
        opacity: 0.9,
        dashArray: '10 10',
        className: 'map-route-remaining',
      }).addTo(map)

      const traveled = L.polyline([activePath[0]], {
        color: paletteRef.current.accent,
        weight: 4,
        opacity: 0.95,
        className: 'map-route-traveled',
      }).addTo(map)

      remainingRef.current = remaining
      traveledRef.current = traveled
      layersRef.current.routes.push(remaining, traveled)
    }

    activeJourney.points.forEach((point, index) => {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return

      const marker = L.marker([point.lat, point.lon], {
        icon: createPinIcon(point, index, {
          isActive: index === 0,
          isHovered: false,
          isVisited: false,
        }),
        zIndexOffset: 400,
      }).addTo(map)

      marker.on('click', () => {
        setSelectedWaypoint(index)
        setIsLoreExpanded(true)
        setIsPlaying(false)
        const nextProgress = total > 0 ? (waypointDistances[index] || 0) / total : 0
        setProgress(nextProgress)
        map.flyTo([point.lat, point.lon], Math.max(map.getZoom(), 7), {
          duration: reduceMotionRef.current ? 0 : 1.05,
        })
      })
      marker.on('mouseover', () => setHoveredWaypoint(index))
      marker.on('mouseout', () => setHoveredWaypoint((current) => (current === index ? null : current)))

      layersRef.current.markers.push(marker)
    })

    const traveler = L.marker(activePath[0] || DEFAULT_MAP_CENTER, {
      icon: createTravelerIcon(),
      interactive: false,
      zIndexOffset: 800,
    }).addTo(map)
    travelerRef.current = traveler

    const initialDistance = total * progressRef.current
    const initialPosition = getPointAlongPath(activePath, distances, initialDistance)
    traveler.setLatLng(initialPosition)
    traveledRef.current?.setLatLngs(getTraveledPath(activePath, distances, initialDistance))

    return clearLayers
  }, [activeJourney, activePath, distances, showRegions, total, waypointDistances])

  useEffect(() => {
    remainingRef.current?.setStyle({
      color: hexToRgba(mode === 'night' ? '#f8fafc' : '#111827', 0.28),
    })
    traveledRef.current?.setStyle({ color: palette.accent })
  }, [mode, palette.accent])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activePath.length) return undefined

    const frameId = window.requestAnimationFrame(() => {
      map.invalidateSize()
      map.fitBounds(L.latLngBounds(activePath).pad(0.28), {
        animate: !reduceMotion,
        duration: 0.9,
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [activeJourney?.id, activePath, reduceMotion])

  useEffect(() => {
    const targetDistance = total * progress
    const traveledPoints = getTraveledPath(activePath, distances, targetDistance)
    const position = getPointAlongPath(activePath, distances, targetDistance)

    traveledRef.current?.setLatLngs(traveledPoints.length ? traveledPoints : [position])
    travelerRef.current?.setLatLng(position)

    if (followRef.current && mapRef.current && !reduceMotion) {
      mapRef.current.setView(position, mapRef.current.getZoom(), { animate: false })
    }

    const nextWaypoint = getWaypointIndexForDistance(waypointDistances, targetDistance)
    if (nextWaypoint !== selectedWaypoint) {
      setSelectedWaypoint(nextWaypoint)
    }
  }, [activePath, distances, progress, reduceMotion, selectedWaypoint, total, waypointDistances])

  useEffect(() => {
    layersRef.current.markers.forEach((marker, index) => {
      const point = activeJourney?.points?.[index]
      if (!point) return
      marker.setIcon(createPinIcon(point, index, {
        isActive: index === selectedWaypoint,
        isHovered: index === hoveredWaypoint,
        isVisited: index < selectedWaypoint,
      }))
      marker.setZIndexOffset(index === selectedWaypoint || index === hoveredWaypoint ? 700 : 400)
    })
  }, [activeJourney, hoveredWaypoint, selectedWaypoint])

  useEffect(() => {
    playbackRef.current.speed = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
    followRef.current = isPlaying
    if (!isPlaying) {
      playbackRef.current.lastTs = 0
      return undefined
    }

    let frameId = 0
    const duration = Math.min(32000, Math.max(10000, total * 14))

    const tick = (timestamp) => {
      if (!playbackRef.current.lastTs) playbackRef.current.lastTs = timestamp
      const delta = timestamp - playbackRef.current.lastTs
      playbackRef.current.lastTs = timestamp

      setProgress((current) => {
        const next = current + (delta / duration) * playbackRef.current.speed
        if (next >= 1) {
          setIsPlaying(false)
          return 1
        }
        return next
      })

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [isPlaying, total])

  const selectWaypoint = useCallback((index, { expandLore = true, fly = true } = {}) => {
    if (!activeJourney?.points?.[index]) return
    const point = activeJourney.points[index]
    setSelectedWaypoint(index)
    setIsPlaying(false)
    setProgress(total > 0 ? (waypointDistances[index] || 0) / total : 0)
    if (expandLore) setIsLoreExpanded(true)
    if (fly && mapRef.current) {
      mapRef.current.flyTo([point.lat, point.lon], Math.max(mapRef.current.getZoom(), 7), {
        duration: reduceMotion ? 0 : 1.05,
      })
    }
  }, [activeJourney, reduceMotion, total, waypointDistances])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (!activeJourney?.points?.length) return

      if (event.key === ' ') {
        event.preventDefault()
        setIsPlaying((current) => !current)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        selectWaypoint(Math.min(activeJourney.points.length - 1, selectedWaypoint + 1), { expandLore: false })
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        selectWaypoint(Math.max(0, selectedWaypoint - 1), { expandLore: false })
      } else if (event.key === 'Home') {
        event.preventDefault()
        selectWaypoint(0, { expandLore: false })
      } else if (event.key === 'End') {
        event.preventDefault()
        selectWaypoint(activeJourney.points.length - 1, { expandLore: false })
      } else if (event.key === 'Escape') {
        setIsLoreExpanded(false)
        setSelectedCivilization(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeJourney, selectWaypoint, selectedWaypoint])

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()
  const handleRecenter = () => {
    if (!mapRef.current || !activePath.length) return
    setIsPlaying(false)
    followRef.current = false
    mapRef.current.fitBounds(L.latLngBounds(activePath).pad(0.28), {
      animate: !reduceMotion,
      duration: 0.9,
    })
  }
  const handleReset = () => {
    setIsPlaying(false)
    setProgress(0)
    setSelectedWaypoint(0)
    setSelectedCivilization(null)
    handleRecenter()
  }
  const handleScrub = (value) => {
    const next = Number(value)
    setIsPlaying(false)
    setProgress(next)
    const position = getPointAlongPath(activePath, distances, total * next)
    mapRef.current?.panTo(position, { animate: !reduceMotion })
  }

  if (!activeJourney && !isLoaded) {
    return (
      <SiteFrame eyebrow="Geospatial Viewer" title="Cartography Engine">
        <section className="map-page">
          <div className="map-stage glass-panel">
            <div className="map-empty">Loading journey data from the server...</div>
          </div>
        </section>
      </SiteFrame>
    )
  }

  if (!activeJourney && isLoaded) {
    return (
      <SiteFrame eyebrow="Geospatial Viewer" title="Cartography Engine">
        <section className="map-page">
          <div className="map-stage glass-panel">
            <div className="map-empty">No journeys are available from the server yet.</div>
          </div>
        </section>
      </SiteFrame>
    )
  }

  return (
    <SiteFrame eyebrow="Geospatial Viewer" title="Cartography Engine">
      <section className="map-page">
        <div className="map-stage glass-panel">
          <div className="map-tilt-wrapper">
            <div className="map-tilt-plane">
              <div ref={mapContainerRef} className="map-canvas" />
            </div>
          </div>

          <div className="map-hud">
            <div className="map-hud-top">
              <article className="map-journey-card glass-panel">
                <div className="section-kicker">Journey Selector</div>
                <div className="map-journey-head">
                  <div>
                    <h1>Biblical Map Reader</h1>
                    <p>{activeJourney.description}</p>
                  </div>
                  <div className="map-journey-meta">
                    <span>
                      <BookOpen size={14} />
                      {activeJourney.books}
                    </span>
                    <span>
                      <Ruler size={14} />
                      {formatMiles(total)} mi · {total.toFixed(0)} km
                    </span>
                  </div>
                </div>
                <div className="journey-switcher" role="tablist" aria-label="Biblical journeys">
                  {journeys.map((journey) => (
                    <button
                      key={journey.id}
                      className={`journey-button${journey.id === activeJourneyId ? ' active' : ''}`}
                      onClick={() => {
                        setActiveJourneyId(journey.id)
                        setSelectedWaypoint(0)
                        setProgress(0)
                        setIsPlaying(false)
                        setIsLoreExpanded(false)
                        setSelectedCivilization(null)
                      }}
                      role="tab"
                      aria-selected={journey.id === activeJourneyId}
                      type="button"
                    >
                      {journey.title}
                    </button>
                  ))}
                </div>
              </article>
            </div>

            <div className="map-hud-middle">
              <div className="map-controls">
                <button className="map-control-button" onClick={handleRecenter} title="Recenter map" type="button">
                  <Crosshair size={18} />
                </button>
                <button className="map-control-button" onClick={handleZoomIn} title="Zoom in" type="button">
                  <Plus size={18} />
                </button>
                <button className="map-control-button" onClick={handleZoomOut} title="Zoom out" type="button">
                  <Minus size={18} />
                </button>
                <button
                  className={`map-control-button${showRegions ? ' active' : ''}`}
                  onClick={() => setShowRegions((current) => !current)}
                  title="Toggle regions"
                  type="button"
                >
                  <Layers size={18} />
                </button>
                <button
                  className={`map-control-button${isLoreExpanded ? ' active' : ''}`}
                  onClick={() => setIsLoreExpanded((current) => !current)}
                  title="Toggle lore"
                  type="button"
                >
                  <Sparkles size={18} />
                </button>
              </div>

              {selectedCivilization ? (
                <aside className="map-region-card glass-panel">
                  <div className="section-kicker">Region</div>
                  <strong>{selectedCivilization.name}</strong>
                  <p>{selectedCivilization.area}</p>
                  <button
                    className="map-text-button"
                    onClick={() => setSelectedCivilization(null)}
                    type="button"
                  >
                    Dismiss
                  </button>
                </aside>
              ) : null}
            </div>

            <div className="map-hud-bottom">
              <article className="map-context-card glass-panel">
                <div className="map-statline">
                  <div>
                    <div className="map-checkpoint-kicker">
                      Checkpoint {selectedWaypoint + 1} / {activeJourney.points.length}
                    </div>
                    <h2>{currentPoint.name}</h2>
                    <p>{currentPoint.history}</p>
                  </div>
                  <div className="map-distance">
                    <div className="map-checkpoint-kicker">Along the route</div>
                    <strong>{formatMiles(currentDistance)} mi</strong>
                    <span>{currentDistance.toFixed(0)} km</span>
                  </div>
                </div>

                <label className="map-scrubber">
                  <span className="visually-hidden">Journey progress</span>
                  <input
                    aria-label="Scrub journey progress"
                    max="1"
                    min="0"
                    onChange={(event) => handleScrub(event.target.value)}
                    step="0.001"
                    type="range"
                    value={progress}
                  />
                  <span className="map-scrubber-track" style={{ '--map-progress': `${progress * 100}%` }} />
                </label>

                <div className="map-transport">
                  <div className="map-transport-buttons">
                    <button
                      className="map-control-button"
                      onClick={() => selectWaypoint(Math.max(0, selectedWaypoint - 1), { expandLore: false })}
                      title="Previous waypoint"
                      type="button"
                    >
                      <SkipBack size={18} />
                    </button>
                    <button
                      className="map-control-button map-play-button"
                      onClick={() => setIsPlaying((current) => !current)}
                      title={isPlaying ? 'Pause journey' : 'Play journey'}
                      type="button"
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      className="map-control-button"
                      onClick={() => selectWaypoint(Math.min(activeJourney.points.length - 1, selectedWaypoint + 1), { expandLore: false })}
                      title="Next waypoint"
                      type="button"
                    >
                      <SkipForward size={18} />
                    </button>
                    <button className="map-control-button" onClick={handleReset} title="Reset journey" type="button">
                      <RotateCcw size={18} />
                    </button>
                  </div>

                  <div className="map-speed-toggle" role="group" aria-label="Playback speed">
                    {PLAYBACK_SPEEDS.map((speed) => (
                      <button
                        key={speed}
                        className={`map-speed-button${playbackSpeed === speed ? ' active' : ''}`}
                        onClick={() => setPlaybackSpeed(speed)}
                        type="button"
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <button
                    className="journey-button active"
                    onClick={() => setIsLoreExpanded((current) => !current)}
                    type="button"
                  >
                    {isLoreExpanded ? 'Close Lore' : 'View Lore'}
                    <ChevronRight
                      size={16}
                      style={{ marginLeft: '0.4rem', transform: isLoreExpanded ? 'rotate(90deg)' : 'none' }}
                    />
                  </button>
                </div>

                {isLoreExpanded ? (
                  <div className="lore-grid">
                    <div className="lore-item">
                      <div className="section-kicker lore-political">Political Climate</div>
                      <p>{currentPoint.lore.political}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker lore-religion">Religious Landscape</div>
                      <p>{currentPoint.lore.religion}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker lore-spiritual">Spiritual Significance</div>
                      <p>{currentPoint.lore.spiritual}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker lore-fact">Did You Know</div>
                      <p>{currentPoint.lore.funFact}</p>
                    </div>
                  </div>
                ) : null}

                <div className="waypoint-rail" role="list">
                  {activeJourney.points.map((point, index) => (
                    <button
                      key={`${point.name}-${index}`}
                      className={`waypoint-card${index === selectedWaypoint ? ' active' : ''}${index === hoveredWaypoint ? ' hovered' : ''}`}
                      onClick={() => selectWaypoint(index)}
                      onMouseEnter={() => setHoveredWaypoint(index)}
                      onMouseLeave={() => setHoveredWaypoint((current) => (current === index ? null : current))}
                      type="button"
                    >
                      <span className="waypoint-index">{String(index + 1).padStart(2, '0')}</span>
                      <span className="waypoint-copy">
                        <strong>{point.name}</strong>
                        <span>{point.history}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </SiteFrame>
  )
}

export default MapReaderPage
