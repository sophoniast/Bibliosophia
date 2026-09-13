import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { computePathDistances, getPointAlongPath, getTraveledPath } from '../lib/mapGeometry'
import { HISTORICAL_REGIONS, HISTORICAL_WATERS, getModernName } from '../data/historicalGeography'

// Esri raster basemaps (imagery is theme-independent) plus a place-labels overlay.
const ESRI_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
    labels: true,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Terrain &copy; Esri, USGS, NOAA',
    maxZoom: 13,
    labels: true,
  },
}

// Vector "Map" basemap that follows the app light/dark theme (CARTO Positron / Dark Matter).
// The label-free variants are used so modern place names don't compete with the
// biblical-era labels drawn on top; modern names appear only as secondary references.
const VECTOR_LAYERS = {
  day: {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
  night: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors, &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20,
  },
}

function historicalIcon(entry, variant) {
  return L.divIcon({
    className: 'journey-map-region-icon',
    html: `<div class="hist-label ${variant}"><span class="hist">${entry.name}</span><span class="modern">${entry.modern}</span></div>`,
    iconSize: null,
  })
}

const LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'

// Leave room for the header overlay (top) and the timeline/HUD panel (bottom) so
// the first/last waypoint labels aren't hidden behind the chrome.
const FIT_OPTIONS = { paddingTopLeft: [40, 120], paddingBottomRight: [40, 210] }

export default function JourneyMap({
  journey,
  path,
  progress = 0,
  accent = '#c9a84c',
  baseLayer = 'satellite',
  mode = 'night',
  activeWaypointIndex = 0,
  onSelectWaypoint,
  onReady,
}) {
  const night = mode === 'night'
  // Overlay colors adapt for contrast on light vs dark basemaps.
  const routeBase = night ? 'rgba(255, 255, 255, 0.55)' : 'rgba(33, 35, 46, 0.6)'
  const markerFill = night ? '#0b0b12' : '#f7f4ec'
  const markerStroke = night ? '#0b0b12' : '#f7f4ec'
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const baseLayerRef = useRef(null)
  const labelsLayerRef = useRef(null)
  const routeLineRef = useRef(null)
  const traveledLineRef = useRef(null)
  const travelerRef = useRef(null)
  const markersRef = useRef([])
  const historicalLayerRef = useRef(null)
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
        if (boundsRef.current) map.fitBounds(boundsRef.current, FIT_OPTIONS)
      },
    })

    // Persistent biblical-era geography: ancient region/"country" and water names
    // as the primary labels, with the modern name as a secondary reference.
    const historical = L.layerGroup().addTo(map)
    historicalLayerRef.current = historical
    HISTORICAL_REGIONS.forEach((region) => {
      L.marker([region.lat, region.lon], {
        interactive: false,
        keyboard: false,
        icon: historicalIcon(region, 'region'),
      }).addTo(historical)
    })
    HISTORICAL_WATERS.forEach((water) => {
      L.marker([water.lat, water.lon], {
        interactive: false,
        keyboard: false,
        icon: historicalIcon(water, 'water'),
      }).addTo(historical)
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
      historicalLayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Swap base tiles (and place labels) when the basemap or theme changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const isVector = baseLayer === 'map'
    const config = isVector
      ? VECTOR_LAYERS[night ? 'night' : 'day']
      : ESRI_LAYERS[baseLayer] || ESRI_LAYERS.satellite

    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current)
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current)
      labelsLayerRef.current = null
    }

    baseLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
      subdomains: config.subdomains || 'abc',
    }).addTo(map)
    baseLayerRef.current.bringToBack()

    // The CARTO vector basemaps already carry labels; only Esri imagery needs the overlay.
    if (!isVector && config.labels) {
      labelsLayerRef.current = L.tileLayer(LABELS_URL, {
        maxZoom: config.maxZoom,
        opacity: 0.9,
      }).addTo(map)
    }
  }, [baseLayer, night])

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
      color: routeBase,
      weight: 3,
      opacity: 0.7,
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
        const modern = getModernName(point.name)
        const tooltipHtml = `<span class="hist">${point.name}</span>${
          modern ? `<span class="modern">${modern}</span>` : ''
        }`
        const marker = L.circleMarker([point.lat, point.lon], {
          radius: 7,
          color: accent,
          weight: 2.5,
          fillColor: markerFill,
          fillOpacity: 0.9,
        })
          .bindTooltip(tooltipHtml, {
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
      color: markerStroke,
      weight: 2,
      fillColor: accent,
      fillOpacity: 1,
      className: 'journey-map-traveler',
    }).addTo(map)

    boundsRef.current = L.latLngBounds(path)
    map.fitBounds(boundsRef.current, FIT_OPTIONS)
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

  // Re-color the route/markers for the active waypoint and the light/dark theme.
  useEffect(() => {
    if (routeLineRef.current) routeLineRef.current.setStyle({ color: routeBase })
    if (traveledLineRef.current) traveledLineRef.current.setStyle({ color: accent })
    if (travelerRef.current) travelerRef.current.setStyle({ fillColor: accent, color: markerStroke })
    markersRef.current.forEach((marker, index) => {
      const active = index === activeWaypointIndex
      marker.setStyle({
        radius: active ? 10 : 7,
        color: accent,
        weight: active ? 3 : 2.5,
        fillColor: active ? accent : markerFill,
        fillOpacity: 0.9,
      })
      if (active) marker.bringToFront()
    })
  }, [activeWaypointIndex, accent, routeBase, markerFill, markerStroke])

  return <div ref={containerRef} className="journey-map" aria-label={`${journey?.title || 'Biblical'} route map`} />
}
