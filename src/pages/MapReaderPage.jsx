import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Layers,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import JourneyAtlas from '../components/JourneyAtlas'
import { useTheme } from '../context/ThemeContext'
import { getJourneys } from '../lib/api'
import {
  computePathDistances,
  formatMiles,
  getValidPath,
  getWaypointDistances,
  getWaypointIndexForDistance,
} from '../lib/mapGeometry'

const PLAYBACK_SPEEDS = [1, 2, 4]

function MapReaderPage() {
  const { mode, palette } = useTheme()
  const playbackRef = useRef({ lastTs: 0, speed: 1 })

  const [journeys, setJourneys] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeJourneyId, setActiveJourneyId] = useState(null)
  const [mapEngaged, setMapEngaged] = useState(false)
  const [hoveredWaypoint, setHoveredWaypoint] = useState(null)
  const [hoveredCivilization, setHoveredCivilization] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLoreExpanded, setIsLoreExpanded] = useState(false)
  const [showRegions, setShowRegions] = useState(true)
  const [selectedCivilization, setSelectedCivilization] = useState(null)
  const [atlasZoom, setAtlasZoom] = useState(1)
  const [atlasPan, setAtlasPan] = useState({ x: 0, y: 0 })

  useEffect(() => {
    let isCancelled = false

    getJourneys()
      .then((nextJourneys) => {
        if (isCancelled || !Array.isArray(nextJourneys) || nextJourneys.length === 0) {
          if (!isCancelled) setIsLoaded(true)
          return
        }
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
    () => journeys.find((journey) => journey.id === activeJourneyId) || null,
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

  const selectedWaypoint = getWaypointIndexForDistance(waypointDistances, total * progress)
  const currentPoint = activeJourney?.points?.[selectedWaypoint] || activeJourney?.points?.[0]
  const currentDistance = total * progress
  const nextPoint = activeJourney?.points?.[Math.min((activeJourney?.points?.length || 1) - 1, selectedWaypoint + 1)]
  const reliefActive = Boolean(activeJourney && (mapEngaged || isPlaying))
  const enRoute = Boolean(activeJourney && (isPlaying || (progress > 0.02 && progress < 0.98)))

  useEffect(() => {
    playbackRef.current.speed = playbackSpeed
  }, [playbackSpeed])

  useEffect(() => {
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

  const resetView = useCallback(() => {
    setAtlasZoom(1)
    setAtlasPan({ x: 0, y: 0 })
  }, [])

  const engageMap = useCallback(() => {
    setMapEngaged(true)
  }, [])

  const selectWaypoint = useCallback((index, { expandLore = true } = {}) => {
    if (!activeJourney?.points?.[index]) return
    setIsPlaying(false)
    setMapEngaged(true)
    setProgress(total > 0 ? (waypointDistances[index] || 0) / total : 0)
    if (expandLore) setIsLoreExpanded(true)
  }, [activeJourney, total, waypointDistances])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (!activeJourney?.points?.length) return

      if (event.key === ' ') {
        event.preventDefault()
        engageMap()
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
        setIsPlaying(false)
        setMapEngaged(false)
        setProgress(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeJourney, engageMap, selectWaypoint, selectedWaypoint])

  const handleZoomIn = () => setAtlasZoom((current) => Math.min(2.4, Number((current + 0.18).toFixed(2))))
  const handleZoomOut = () => setAtlasZoom((current) => Math.max(0.72, Number((current - 0.18).toFixed(2))))
  const handleReset = () => {
    setIsPlaying(false)
    setProgress(0)
    setSelectedCivilization(null)
    setMapEngaged(false)
    setIsLoreExpanded(false)
    resetView()
  }
  const handleScrub = (value) => {
    setIsPlaying(false)
    setMapEngaged(true)
    setProgress(Number(value))
  }
  const handleJourneyChange = (journeyId) => {
    setActiveJourneyId(journeyId || null)
    setProgress(0)
    setIsPlaying(false)
    setIsLoreExpanded(false)
    setSelectedCivilization(null)
    setMapEngaged(false)
    resetView()
  }

  const checkpointTitle = !activeJourney
    ? 'Select a journey'
    : enRoute && nextPoint && nextPoint !== currentPoint
      ? `En route to ${nextPoint.name}`
      : currentPoint?.name || 'Select a journey'

  const checkpointCopy = !activeJourney
    ? 'Choose a biblical route from the rail to raise the terrain and begin.'
    : enRoute && currentPoint
      ? `Mid-journey near ${currentPoint.name}.`
      : currentPoint?.history || ''

  return (
    <section className="map-page map-page-split is-fullbleed" data-mode={mode} data-relief={reliefActive ? 'on' : 'off'}>
      <aside className="map-rail glass-panel" aria-label="Cartography controls">
        <header className="map-rail-header">
          <div className="section-kicker">Geospatial Viewer</div>
          <h1 className="map-rail-title">Cartography Engine</h1>
        </header>

        <label className="map-journey-picker">
          <span className="visually-hidden">Biblical journeys</span>
          <select
            aria-label="Biblical journeys"
            className="map-journey-select"
            onChange={(event) => handleJourneyChange(event.target.value || null)}
            value={activeJourneyId || ''}
          >
            <option value="">Select a journey</option>
            {journeys.map((journey) => (
              <option key={journey.id} value={journey.id}>
                {journey.title}
              </option>
            ))}
          </select>
        </label>

        {activeJourney ? (
          <div className="map-journey-meta">
            <span>{activeJourney.books}</span>
            <span>{formatMiles(total)} mi · {total.toFixed(0)} km</span>
          </div>
        ) : (
          <div className="map-journey-meta">
            <span>{isLoaded ? 'Awaiting route' : 'Loading routes…'}</span>
          </div>
        )}

        <div className="map-rail-section">
          <div className="section-kicker">Waypoints</div>
          <div className="map-waypoint-stack" role="list">
            {activeJourney?.points?.length ? (
              activeJourney.points.map((point, index) => (
                <button
                  key={`${point.name}-${index}`}
                  className={`map-waypoint-card${index === selectedWaypoint && mapEngaged ? ' active' : ''}${index === hoveredWaypoint ? ' hovered' : ''}`}
                  onClick={() => selectWaypoint(index)}
                  onMouseEnter={() => setHoveredWaypoint(index)}
                  onMouseLeave={() => setHoveredWaypoint((current) => (current === index ? null : current))}
                  type="button"
                  role="listitem"
                >
                  <span className="waypoint-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="waypoint-copy">
                    <strong>{point.name}</strong>
                    <span>{point.history}</span>
                  </span>
                </button>
              ))
            ) : (
              <p className="map-rail-empty">Journey waypoints appear here once a route is chosen.</p>
            )}
          </div>
        </div>

        {activeJourney?.books ? (
          <Link className="map-reader-link" to={`/reader?book=${encodeURIComponent(String(activeJourney.books).split(/[,·]/)[0].trim())}`}>
            <BookOpen size={16} />
            Open in Reader
          </Link>
        ) : null}
      </aside>

      <div className="map-stage map-stage-split">
        <div className="map-tilt-wrapper">
          <div className="map-tilt-plane">
            <JourneyAtlas
              accent={palette.accent}
              activeWaypointIndex={mapEngaged ? selectedWaypoint : -1}
              hoveredCivilization={hoveredCivilization}
              journey={activeJourney}
              mode={mode}
              onHoverCivilization={setHoveredCivilization}
              onPanChange={setAtlasPan}
              onSelectCivilization={(civ) => {
                engageMap()
                setSelectedCivilization(civ)
              }}
              onSelectWaypoint={selectWaypoint}
              pan={atlasPan}
              path={activePath}
              progress={mapEngaged ? progress : 0}
              reliefActive={reliefActive}
              selectedCivilization={selectedCivilization}
              showRegions={showRegions}
              zoom={atlasZoom}
            />
          </div>
        </div>

        {!isLoaded ? (
          <div className="map-empty map-empty-overlay">Loading journey data…</div>
        ) : null}

        <div className="map-controls map-controls-stack">
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
          <button className="map-control-button" onClick={resetView} title="Recenter atlas" type="button">
            <Crosshair size={18} />
          </button>
        </div>

        <article className="map-detail-card glass-panel">
          <div className="map-detail-top">
            <div className="map-checkpoint-kicker">
              Checkpoint {activeJourney ? `${selectedWaypoint + 1} / ${activeJourney.points.length}` : '—'}
            </div>
            <div className="map-transport-buttons">
              <button
                className="map-control-button"
                disabled={!activeJourney}
                onClick={() => selectWaypoint(Math.max(0, selectedWaypoint - 1), { expandLore: false })}
                title="Previous waypoint"
                type="button"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="map-control-button map-play-button"
                disabled={!activeJourney}
                onClick={() => {
                  engageMap()
                  setIsPlaying((current) => !current)
                }}
                title={isPlaying ? 'Pause journey' : 'Play journey'}
                type="button"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                className="map-control-button"
                disabled={!activeJourney}
                onClick={() => selectWaypoint(Math.min((activeJourney?.points.length || 1) - 1, selectedWaypoint + 1), { expandLore: false })}
                title="Next waypoint"
                type="button"
              >
                <ChevronRight size={18} />
              </button>
              <button className="map-control-button" onClick={handleReset} title="Reset to idle flat map" type="button">
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
          </div>

          <div className="map-detail-copy">
            <h2>{checkpointTitle}</h2>
            <p>{checkpointCopy}</p>
          </div>

          {activeJourney ? (
            <label className="map-scrubber">
              <span className="visually-hidden">Journey progress</span>
              <input
                aria-label="Scrub journey progress"
                max="1"
                min="0"
                onChange={(event) => handleScrub(event.target.value)}
                step="0.001"
                type="range"
                value={mapEngaged ? progress : 0}
              />
              <span className="map-scrubber-track" style={{ '--map-progress': `${(mapEngaged ? progress : 0) * 100}%` }} />
            </label>
          ) : null}

          {isLoreExpanded && currentPoint?.lore ? (
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

          {selectedCivilization ? (
            <div className="map-region-inline">
              <div className="section-kicker">Region</div>
              <strong>{selectedCivilization.name}</strong>
              <p>{selectedCivilization.area}</p>
              <button className="map-text-button" onClick={() => setSelectedCivilization(null)} type="button">
                Dismiss
              </button>
            </div>
          ) : null}

          {activeJourney && currentPoint ? (
            <div className="map-detail-actions">
              <button
                className={`map-text-button${isLoreExpanded ? ' active' : ''}`}
                onClick={() => {
                  engageMap()
                  setIsLoreExpanded((current) => !current)
                }}
                type="button"
              >
                {isLoreExpanded ? 'Hide lore' : 'View lore'}
              </button>
              <Link className="map-text-button" to="/reader">
                <BookOpen size={14} />
                Reader
              </Link>
              <div className="map-distance">
                <strong>{formatMiles(currentDistance)} mi</strong>
                <span>{currentDistance.toFixed(0)} km</span>
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default MapReaderPage
