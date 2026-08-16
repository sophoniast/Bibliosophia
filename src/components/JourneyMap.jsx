import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computePathDistances, getPointAlongPath, getTraveledPath } from '../lib/mapGeometry'

const BASE_LAYERS = {
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    labels: true,
  },
  terrain: {
    label: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Terrain &copy; Esri, USGS, NOAA',
    maxZoom: 13,
    labels: true,
  },
}

const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

export default function JourneyMap({
  journey,
  path,
  progress = 0,
  accent = '#c9a84c',
  baseLayer = 'satellite',
  activeWaypointIndex = 0,
  onSelectWaypoint,
  onReady,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const baseLayerRef = useRef(null)
  const labelsLayerRef = useRef(null)
  const routeLineRef = useRef(null)
  const traveledLineRef = useRef(null)
  const travelerRef = useRef(null)
  const markersRef = useRef([])
  const boundsRef = useRef(null)
  const selectRef = useRef(onSelectWaypoint)

  useEffect(() => {
    selectRef.current = onSelectWaypoint
  }, [onSelectWaypoint])

  const distances = useMemo(() => computePathDistances(path), [path])
  const total = distances.total || 0

  // Create the map once.
  useEffect(() => {
    const container = containerRef.current
    if (!container || mapRef.current) return undefined

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
      minZoom: 2,
    }).setView([33, 40], 5)
    mapRef.current = map

    onReady?.({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      fitRoute: () => {
        if (boundsRef.current) map.fitBounds(boundsRef.current, { padding: [60, 60] })
      },
    })

    // Leaflet needs a sizing nudge once it is laid out inside the flex panel.
    const invalidate = () => map.invalidateSize()
    const raf = window.requestAnimationFrame(invalidate)
    window.addEventListener('resize', invalidate)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', invalidate)
      map.remove()
      mapRef.current = null
      baseLayerRef.current = null
      labelsLayerRef.current = null
      routeLineRef.current = null
      traveledLineRef.current = null
      travelerRef.current = null
      markersRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap base tiles (and place labels) when the chosen basemap changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const config = BASE_LAYERS[baseLayer] || BASE_LAYERS.satellite

    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current)
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current)
      labelsLayerRef.current = null
    }

    baseLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map)

    if (config.labels) {
      labelsLayerRef.current = L.tileLayer(LABELS_URL, {
        maxZoom: config.maxZoom,
        opacity: 0.9,
      }).addTo(map)
    }
  }, [baseLayer])

  // Draw the route and waypoint markers whenever the journey changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (routeLineRef.current) map.removeLayer(routeLineRef.current)
    if (traveledLineRef.current) map.removeLayer(traveledLineRef.current)
    if (travelerRef.current) map.removeLayer(travelerRef.current)
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    if (!Array.isArray(path) || path.length < 2) return

    routeLineRef.current = L.polyline(path, {
      color: '#ffffff',
      weight: 3,
      opacity: 0.55,
      dashArray: '2 9',
      lineCap: 'round',
    }).addTo(map)

    traveledLineRef.current = L.polyline([], {
      color: accent,
      weight: 4.5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map)

    const points = journey?.points || []
    markersRef.current = points
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
      .map((point, index) => {
        const marker = L.circleMarker([point.lat, point.lon], {
          radius: 7,
          color: accent,
          weight: 2.5,
          fillColor: '#0b0b12',
          fillOpacity: 0.9,
        })
          .bindTooltip(point.name, {
            permanent: true,
            direction: 'top',
            offset: [0, -8],
            className: 'journey-map-label',
          })
          .addTo(map)
        marker.on('click', () => selectRef.current?.(index))
        return marker
      })

    travelerRef.current = L.circleMarker(path[0], {
      radius: 8,
      color: '#0b0b12',
      weight: 2,
      fillColor: accent,
      fillOpacity: 1,
      className: 'journey-map-traveler',
    }).addTo(map)

    boundsRef.current = L.latLngBounds(path)
    map.fitBounds(boundsRef.current, { padding: [60, 60] })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey?.id, path, accent])

  // Advance the traveled polyline + traveler dot as progress changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !Array.isArray(path) || path.length < 2) return

    const target = total * progress
    const traveled = getTraveledPath(path, distances.distances || [], target)
    if (traveledLineRef.current) traveledLineRef.current.setLatLngs(traveled)

    const head = getPointAlongPath(path, distances.distances || [], target)
    if (travelerRef.current && head) travelerRef.current.setLatLng(head)
  }, [progress, path, distances, total])

  // Emphasize the active waypoint marker.
  useEffect(() => {
    markersRef.current.forEach((marker, index) => {
      const active = index === activeWaypointIndex
      marker.setStyle({
        radius: active ? 10 : 7,
        fillColor: active ? accent : '#0b0b12',
        weight: active ? 3 : 2.5,
      })
      if (active) marker.bringToFront()
    })
  }, [activeWaypointIndex, accent])

  return <div ref={containerRef} className="journey-map" aria-label={`${journey?.title || 'Biblical'} route map`} />
}
