import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  Crosshair,
  Minus,
  Pause,
  Play,
  Moon,
  Plus,
  RotateCcw,
  Ruler,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
} from 'lucide-react'
import JourneyMap from '../components/JourneyMap'
import SiteFrame from '../components/SiteFrame'
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

const BASE_LAYERS = [
  { id: 'map', label: 'Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
]

function MapReaderPage() {
  const { mode, palette, toggleMode } = useTheme()
  const playbackRef = useRef({ lastTs: 0, speed: 1 })
  const mapControlsRef = useRef(null)

  const [journeys, setJourneys] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeJourneyId, setActiveJourneyId] = useState(null)
  const [hoveredWaypoint, setHoveredWaypoint] = useState(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLoreExpanded, setIsLoreExpanded] = useState(false)
  const [baseLayer, setBaseLayer] = useState('satellite')

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

  const selectedWaypoint = getWaypointIndexForDistance(waypointDistances, total * progress)
  const currentPoint = activeJourney?.points?.[selectedWaypoint] || activeJourney?.points?.[0]
  const currentDistance = total * progress

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
    mapControlsRef.current?.fitRoute()
  }, [])

  const selectWaypoint = useCallback((index, { expandLore = true } = {}) => {
    if (!activeJourney?.points?.[index]) return
    setIsPlaying(false)
    setProgress(total > 0 ? (waypointDistances[index] || 0) / total : 0)
    if (expandLore) setIsLoreExpanded(true)
  }, [activeJourney, total, waypointDistances])

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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeJourney, selectWaypoint, selectedWaypoint])

  const handleZoomIn = () => mapControlsRef.current?.zoomIn()
  const handleZoomOut = () => mapControlsRef.current?.zoomOut()
  const handleReset = () => {
    setIsPlaying(false)
    setProgress(0)
    resetView()
  }
  const handleScrub = (value) => {
    setIsPlaying(false)
    setProgress(Number(value))
  }

  return (
    <SiteFrame fullBleed eyebrow="Geospatial Viewer" title="Cartography Engine">
      <section className="map-page is-fullbleed">
        <div className="map-stage is-fullbleed">
          <div className="map-canvas">
            {activeJourney ? (
              <JourneyMap
                accent={palette.accent}
                activeWaypointIndex={selectedWaypoint}
                baseLayer={baseLayer}
                journey={activeJourney}
                mode={mode}
                onReady={(controls) => { mapControlsRef.current = controls }}
                onSelectWaypoint={selectWaypoint}
                path={activePath}
                progress={progress}
              />
            ) : (
              <div className="journey-atlas journey-atlas-placeholder" data-mode={mode} />
            )}
          </div>

          {!activeJourney ? (
            <div className="map-empty map-empty-overlay">
              {isLoaded
                ? 'No journeys are available from the server yet.'
                : 'Loading journey data from the server...'}
            </div>
          ) : null}

          {activeJourney ? (
          <div className="map-hud">
            <div className="map-hud-top">
              <article className="map-journey-card map-hud-panel">
                <label className="map-journey-picker">
                  <span className="section-kicker">Journey</span>
                  <select
                    aria-label="Biblical journeys"
                    className="map-journey-select"
                    onChange={(event) => {
                      setActiveJourneyId(event.target.value)
                      setProgress(0)
                      setIsPlaying(false)
                      setIsLoreExpanded(false)
                    }}
                    value={activeJourneyId || activeJourney.id}
                  >
                    {journeys.map((journey) => (
                      <option key={journey.id} value={journey.id}>
                        {journey.title}
                      </option>
                    ))}
                  </select>
                </label>
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
              </article>
            </div>

            <div className="map-hud-middle">
              <div className="map-controls">
                <button className="map-control-button" onClick={resetView} title="Fit route" type="button">
                  <Crosshair size={18} />
                </button>
                <button className="map-control-button" onClick={handleZoomIn} title="Zoom in" type="button">
                  <Plus size={18} />
                </button>
                <button className="map-control-button" onClick={handleZoomOut} title="Zoom out" type="button">
                  <Minus size={18} />
                </button>
                <button
                  className="map-control-button"
                  onClick={toggleMode}
                  title={mode === 'night' ? 'Switch to light theme' : 'Switch to dark theme'}
                  type="button"
                >
                  {mode === 'night' ? <Sun size={18} /> : <Moon size={18} />}
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

              <div className="map-basemap-toggle map-hud-panel" role="group" aria-label="Basemap">
                {BASE_LAYERS.map((layer) => (
                  <button
                    key={layer.id}
                    className={`map-speed-button${baseLayer === layer.id ? ' active' : ''}`}
                    onClick={() => setBaseLayer(layer.id)}
                    type="button"
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="map-hud-bottom">
              <article className="map-context-card map-hud-panel">
                <div className="map-now-playing">
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

                  <div className="map-now-copy">
                    <div className="map-checkpoint-kicker">
                      Checkpoint {selectedWaypoint + 1} / {activeJourney.points.length}
                    </div>
                    <h2>{currentPoint?.name}</h2>
                    <p>{currentPoint?.history}</p>
                  </div>

                  <div className="map-distance">
                    <strong>{formatMiles(currentDistance)} mi</strong>
                    <span>{currentDistance.toFixed(0)} km</span>
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
                    className={`journey-button${isLoreExpanded ? ' active' : ''}`}
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
                      <strong>{point.name}</strong>
                    </button>
                  ))}
                </div>

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
              </article>
            </div>
          </div>
          ) : null}
        </div>
      </section>
    </SiteFrame>
  )
}

export default MapReaderPage
