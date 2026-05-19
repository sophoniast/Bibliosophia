import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BookOpen, ChevronRight, Crosshair, Minus, Plus, Ruler, Sparkles } from 'lucide-react'
import SiteFrame from '../components/SiteFrame'
import { getJourneys } from '../lib/api'

const DEFAULT_MAP_CENTER = [31.7683, 35.2137]
const DEFAULT_ZOOM = 6

function haversineDistance(lat1, lon1, lat2, lon2) {
  const radius = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function computePathDistances(path) {
  if (!Array.isArray(path) || path.length < 2) return { distances: [0], total: 0 }

  let total = 0
  const distances = [0]

  for (let index = 1; index < path.length; index += 1) {
    total += haversineDistance(path[index - 1][0], path[index - 1][1], path[index][0], path[index][1])
    distances.push(total)
  }

  return { distances, total }
}

function polygonCenter(points) {
  if (!Array.isArray(points) || points.length === 0) return DEFAULT_MAP_CENTER
  const [lat, lon] = points.reduce(
    (accumulator, point) => [accumulator[0] + point[0], accumulator[1] + point[1]],
    [0, 0],
  )
  return [lat / points.length, lon / points.length]
}

function getPointLatLng(point) {
  return [Number(point.lat), Number(point.lon)]
}

function getValidPath(journey) {
  const path = Array.isArray(journey?.path)
    ? journey.path
      .map((coordinate) => [Number(coordinate?.[0]), Number(coordinate?.[1])])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))
    : []

  if (path.length >= 2) return path

  return (journey?.points || [])
    .map(getPointLatLng)
    .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))
}

function MapReaderPage() {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({ markers: [], labels: [], polygons: [], routes: [] })
  const [journeys, setJourneys] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeJourneyId, setActiveJourneyId] = useState(null)
  const [selectedWaypoint, setSelectedWaypoint] = useState(0)
  const [isLoreExpanded, setIsLoreExpanded] = useState(false)

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
    () => (activeJourney ? computePathDistances(activePath) : { distances: [0], total: 0 }),
    [activeJourney, activePath],
  )

  const currentPoint = activeJourney?.points?.[selectedWaypoint] || activeJourney?.points?.[0]
  const currentDistance = distances[selectedWaypoint] || 0

  useEffect(() => {
    if (!activeJourney?.points?.length) return
    if (selectedWaypoint > activeJourney.points.length - 1) {
      setSelectedWaypoint(0)
    }
  }, [activeJourney, selectedWaypoint])

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current || !activeJourney) return undefined

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView(DEFAULT_MAP_CENTER, DEFAULT_ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map)

    mapRef.current = map
    window.requestAnimationFrame(() => map.invalidateSize())

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [activeJourney])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeJourney) return

    const clearLayers = () => {
      layersRef.current.markers.forEach((layer) => map.removeLayer(layer))
      layersRef.current.labels.forEach((layer) => map.removeLayer(layer))
      layersRef.current.polygons.forEach((layer) => map.removeLayer(layer))
      layersRef.current.routes.forEach((layer) => map.removeLayer(layer))
      layersRef.current = { markers: [], labels: [], polygons: [], routes: [] }
    }

    clearLayers()

    ;(activeJourney.civilizations || []).forEach((civilization) => {
      if (!Array.isArray(civilization.bounds) || civilization.bounds.length < 3) return
      const polygon = L.polygon(civilization.bounds, {
        color: civilization.color,
        fillColor: civilization.color,
        fillOpacity: 0.18,
        weight: 2,
      }).addTo(map)

      const label = L.marker(polygonCenter(civilization.bounds), {
        icon: L.divIcon({
          className: '',
          html: `<div style="padding:.3rem .55rem;border-radius:999px;background:rgba(17,24,39,.82);color:white;font-size:.62rem;font-family:JetBrains Mono,monospace;letter-spacing:.12em;text-transform:uppercase;border:1px solid rgba(255,255,255,.12)">${civilization.name}</div>`,
        }),
        interactive: false,
      }).addTo(map)

      layersRef.current.polygons.push(polygon)
      layersRef.current.labels.push(label)
    })

    if (activePath.length >= 2) {
      const haloRoute = L.polyline(activePath, {
        color: '#f8fafc',
        weight: 7,
        opacity: 0.9,
      }).addTo(map)

      const route = L.polyline(activePath, {
        color: '#d97706',
        weight: 4,
        opacity: 0.92,
        dashArray: '12 10',
      }).addTo(map)

      layersRef.current.routes.push(haloRoute, route)
    }

    activeJourney.points.forEach((point, index) => {
      if (!Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return
      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          className: '',
          html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-18px)"><div style="width:18px;height:18px;border-radius:999px;background:${index === selectedWaypoint ? '#f59e0b' : '#ffffff'};border:3px solid rgba(17,24,39,.72);box-shadow:0 0 20px rgba(245,158,11,.45)"></div><div style="width:3px;height:42px;background:linear-gradient(180deg,rgba(255,255,255,.95),rgba(75,85,99,.75))"></div></div>`,
          iconAnchor: [9, 60],
        }),
      }).addTo(map)

      marker.on('click', () => {
        setSelectedWaypoint(index)
        setIsLoreExpanded(true)
      })

      layersRef.current.markers.push(marker)
    })

    const pathPoints = activePath
    if (pathPoints.length) {
      const bounds = L.latLngBounds(pathPoints.map(([lat, lon]) => [lat, lon]))
      window.requestAnimationFrame(() => {
        map.invalidateSize()
        map.fitBounds(bounds.pad(0.32))
      })
    }
  }, [activeJourney, activePath, selectedWaypoint])

  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()
  const handleRecenter = () => {
    if (!mapRef.current || !activeJourney) return
    const path = getValidPath(activeJourney)
    if (!path.length) return
    const bounds = L.latLngBounds(path.map(([lat, lon]) => [lat, lon]))
    mapRef.current.fitBounds(bounds.pad(0.32))
  }

  if (!activeJourney && !isLoaded) {
    return (
      <SiteFrame eyebrow="Geospatial Viewer" title="Cartography Engine">
        <section className="map-page">
          <div className="map-stage glass-panel" style={{ padding: '2rem' }}>
            Loading journey data from the server...
          </div>
        </section>
      </SiteFrame>
    )
  }

  if (!activeJourney && isLoaded) {
    return (
      <SiteFrame eyebrow="Geospatial Viewer" title="Cartography Engine">
        <section className="map-page">
          <div className="map-stage glass-panel" style={{ padding: '2rem' }}>
            No journeys are available from the server yet.
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

          <div className="map-overlay">
            <div className="glass-panel" style={{ padding: '1rem 1.2rem', borderRadius: '1.5rem' }}>
              <div className="section-kicker">Journey Selector</div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'end',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h1 style={{ margin: '0.55rem 0 0', fontFamily: 'var(--f-display)', fontSize: '2.1rem' }}>
                    Biblical Map Reader
                  </h1>
                  <p style={{ margin: '0.45rem 0 0', color: 'rgb(var(--c-text-muted))', lineHeight: 1.7 }}>
                    A canonical biblical atlas with local fallback data for the major routes of Scripture, built
                    for stable study on mobile and desktop.
                  </p>
                </div>
                <div className="journey-switcher">
                  {journeys.map((journey) => (
                    <button
                      key={journey.id}
                      className={`journey-button${journey.id === activeJourneyId ? ' active' : ''}`}
                      onClick={() => {
                        setActiveJourneyId(journey.id)
                        setSelectedWaypoint(0)
                        setIsLoreExpanded(false)
                      }}
                      type="button"
                    >
                      {journey.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="map-bottom-grid">
              <article className="map-context-card">
                <div className="map-statline">
                  <div>
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: '0.45rem',
                        alignItems: 'center',
                        color: '#b45309',
                        fontFamily: 'var(--f-mono)',
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                      }}
                    >
                      <BookOpen size={14} />
                      {activeJourney.books}
                    </div>
                    <h2 style={{ margin: '0.6rem 0 0.35rem', fontFamily: 'var(--f-serif)', fontSize: '2.2rem' }}>
                      {currentPoint.name}
                    </h2>
                    <p style={{ margin: 0, lineHeight: 1.75 }}>{currentPoint.history}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        color: '#6b7280',
                        fontFamily: 'var(--f-mono)',
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                      }}
                    >
                      Checkpoint Distance
                    </div>
                    <div style={{ marginTop: '0.35rem', fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                      {(currentDistance * 0.621371).toFixed(0)} mi
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.92rem' }}>
                      {currentDistance.toFixed(0)} km
                    </div>
                  </div>
                </div>

                {isLoreExpanded ? (
                  <div className="lore-grid">
                    <div className="lore-item">
                      <div className="section-kicker" style={{ color: '#2563eb' }}>
                        Political Climate
                      </div>
                      <p>{currentPoint.lore.political}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker" style={{ color: '#7c3aed' }}>
                        Religious Landscape
                      </div>
                      <p>{currentPoint.lore.religion}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker" style={{ color: '#d97706' }}>
                        Spiritual Significance
                      </div>
                      <p style={{ fontStyle: 'italic' }}>{currentPoint.lore.spiritual}</p>
                    </div>
                    <div className="lore-item">
                      <div className="section-kicker" style={{ color: '#059669' }}>
                        Did You Know
                      </div>
                      <p>{currentPoint.lore.funFact}</p>
                    </div>
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    marginTop: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      color: '#6b7280',
                      fontFamily: 'var(--f-mono)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    <Ruler size={14} />
                    Total Route {(total * 0.621371).toFixed(0)} mi
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

                <div className="waypoint-rail">
                  {activeJourney.points.map((point, index) => (
                    <button
                      key={point.name}
                      className={`waypoint-card${index === selectedWaypoint ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedWaypoint(index)
                        setIsLoreExpanded(true)
                        mapRef.current?.flyTo([point.lat, point.lon], 7, { duration: 1.1 })
                      }}
                      type="button"
                    >
                      <span style={{ textAlign: 'left' }}>
                        <strong style={{ display: 'block', color: '#111827' }}>{point.name}</strong>
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{point.history}</span>
                      </span>
                      <span
                        style={{
                          color: '#6b7280',
                          fontFamily: 'var(--f-mono)',
                          fontSize: '0.72rem',
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </article>

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
                  className="map-control-button"
                  onClick={() => setIsLoreExpanded((current) => !current)}
                  title="Toggle lore"
                  type="button"
                >
                  <Sparkles size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteFrame>
  )
}

export default MapReaderPage
