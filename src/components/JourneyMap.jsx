import { useEffect, useRef } from 'react'
import { createDiorama } from '../lib/createDiorama'

export default function JourneyMap({
  journey,
  path,
  progress = 0,
  palette,
  mode = 'night',
  follow = false,
  activeWaypointIndex = 0,
  onSelectWaypoint,
  onReady,
}) {
  const containerRef = useRef(null)
  const engineRef = useRef(null)
  const selectRef = useRef(onSelectWaypoint)
  const readyRef = useRef(onReady)

  useEffect(() => {
    selectRef.current = onSelectWaypoint
  }, [onSelectWaypoint])

  useEffect(() => {
    readyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const engine = createDiorama(container, {
      onSelectWaypoint: (index) => selectRef.current?.(index),
    })
    engineRef.current = engine
    readyRef.current?.({
      zoomIn: () => engine.zoomIn(),
      zoomOut: () => engine.zoomOut(),
      fitRoute: () => engine.fitRoute(),
    })

    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!palette) return
    engineRef.current?.applyTheme(palette, mode)
  }, [palette, mode])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.setJourney(journey, path)
    engine.fitRoute()
  }, [journey?.id, path])

  useEffect(() => {
    engineRef.current?.setProgress(progress, { follow })
  }, [progress, follow])

  useEffect(() => {
    engineRef.current?.setActiveWaypoint(activeWaypointIndex)
  }, [activeWaypointIndex])

  return (
    <div
      ref={containerRef}
      className="journey-map"
      aria-label={`${journey?.title || 'Biblical'} route map`}
    />
  )
}
