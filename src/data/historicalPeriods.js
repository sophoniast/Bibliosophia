/**
 * Period extents for the journey diorama.
 * Bounds are geographic (degrees). Climate biases vegetation and relief
 * so neighboring Levant journeys still read as different worlds without
 * inventing coastline. Original data — not derived from third-party maps.
 */

export const HISTORICAL_PERIODS = {
  patriarchal: {
    id: 'patriarchal',
    era: 'Patriarchal age',
    label: 'Fertile Crescent',
    years: 'c. 2000 BCE',
    bounds: { west: 32.2, east: 48.4, south: 29.4, north: 38.2 },
    climate: { desert: 0.42, forest: 0.22, relief: 0.92, vegetation: 0.48, river: 0.28, seed: 11 },
    labels: ['Canaan', 'Mesopotamia', 'Egypt', 'Euphrates'],
  },
  exodus: {
    id: 'exodus',
    era: 'Late Bronze',
    label: 'Egypt & Sinai',
    years: 'c. 13th c. BCE',
    bounds: { west: 29.4, east: 36.8, south: 27.0, north: 32.8 },
    climate: { desert: 0.78, forest: 0.08, relief: 0.7, vegetation: 0.22, river: 0.38, seed: 23 },
    labels: ['Egypt', 'Sinai', 'Nile', 'Red Sea'],
  },
  conquest: {
    id: 'conquest',
    era: 'Settlement',
    label: 'Canaan',
    years: 'c. 13th–12th c. BCE',
    bounds: { west: 34.15, east: 36.85, south: 30.55, north: 33.55 },
    climate: { desert: 0.28, forest: 0.46, relief: 1.18, vegetation: 0.62, river: 0.2, seed: 31 },
    labels: ['Canaan', 'Jordan', 'Sinai'],
  },
  unitedMonarchy: {
    id: 'unitedMonarchy',
    era: 'United monarchy',
    label: 'Israel',
    years: 'c. 10th c. BCE',
    bounds: { west: 34.25, east: 36.55, south: 30.85, north: 33.45 },
    climate: { desert: 0.22, forest: 0.58, relief: 1.08, vegetation: 0.72, river: 0.18, seed: 41 },
    labels: ['Canaan', 'Jordan'],
  },
  dividedKingdom: {
    id: 'dividedKingdom',
    era: 'Divided kingdoms',
    label: 'Israel & Judah',
    years: 'c. 9th–8th c. BCE',
    bounds: { west: 34.2, east: 36.7, south: 30.75, north: 33.65 },
    climate: { desert: 0.36, forest: 0.4, relief: 1.12, vegetation: 0.55, river: 0.2, seed: 47 },
    labels: ['Canaan', 'Jordan'],
  },
  northernProphets: {
    id: 'northernProphets',
    era: 'Omride–Jehu',
    label: 'Northern kingdom',
    years: 'c. 9th c. BCE',
    bounds: { west: 34.55, east: 36.95, south: 31.35, north: 33.85 },
    climate: { desert: 0.18, forest: 0.62, relief: 1.22, vegetation: 0.78, river: 0.22, seed: 53 },
    labels: ['Canaan', 'Jordan'],
  },
  assyrian: {
    id: 'assyrian',
    era: 'Assyrian crisis',
    label: 'Levant to Assyria',
    years: 'c. 8th–7th c. BCE',
    bounds: { west: 34.0, east: 44.6, south: 31.0, north: 37.4 },
    climate: { desert: 0.48, forest: 0.24, relief: 1.05, vegetation: 0.4, river: 0.26, seed: 59 },
    labels: ['Canaan', 'Mesopotamia', 'Anatolia', 'Euphrates'],
  },
  exile: {
    id: 'exile',
    era: 'Exile & return',
    label: 'Judah to Babylon',
    years: 'c. 6th–5th c. BCE',
    bounds: { west: 34.2, east: 47.2, south: 30.4, north: 36.6 },
    climate: { desert: 0.58, forest: 0.16, relief: 0.88, vegetation: 0.32, river: 0.3, seed: 67 },
    labels: ['Canaan', 'Mesopotamia', 'Arabia', 'Euphrates'],
  },
  herodian: {
    id: 'herodian',
    era: 'Herodian Judea',
    label: 'Galilee & Judea',
    years: 'c. 4 BCE–33 CE',
    bounds: { west: 34.45, east: 36.05, south: 31.15, north: 33.15 },
    climate: { desert: 0.16, forest: 0.7, relief: 1.15, vegetation: 0.86, river: 0.16, seed: 73 },
    labels: ['Canaan', 'Jordan'],
  },
  nativity: {
    id: 'nativity',
    era: 'Nativity',
    label: 'Judea to Egypt',
    years: 'c. 6–4 BCE',
    bounds: { west: 31.6, east: 36.1, south: 29.6, north: 33.0 },
    climate: { desert: 0.46, forest: 0.34, relief: 0.95, vegetation: 0.5, river: 0.24, seed: 71 },
    labels: ['Canaan', 'Egypt', 'Sinai', 'Nile'],
  },
  galilee: {
    id: 'galilee',
    era: 'Galilean ministry',
    label: 'Galilee',
    years: 'c. 27–30 CE',
    bounds: { west: 34.65, east: 35.95, south: 32.05, north: 33.25 },
    climate: { desert: 0.08, forest: 0.82, relief: 1.2, vegetation: 0.92, river: 0.14, seed: 74 },
    labels: ['Canaan', 'Jordan'],
  },
  passion: {
    id: 'passion',
    era: 'Passion week',
    label: 'Jerusalem',
    years: 'c. 30–33 CE',
    bounds: { west: 34.9, east: 35.55, south: 31.55, north: 32.12 },
    climate: { desert: 0.22, forest: 0.48, relief: 1.05, vegetation: 0.64, river: 0.12, seed: 76 },
    labels: ['Canaan', 'Jordan'],
  },
  paulCyprus: {
    id: 'paulCyprus',
    era: 'First missionary journey',
    label: 'Cyprus & Galatia',
    years: 'c. 46–48 CE',
    bounds: { west: 29.2, east: 35.8, south: 33.6, north: 38.6 },
    climate: { desert: 0.14, forest: 0.52, relief: 1.25, vegetation: 0.68, river: 0.14, seed: 79 },
    labels: ['Anatolia', 'Cyprus', 'Mediterranean Sea'],
  },
  paulAegean: {
    id: 'paulAegean',
    era: 'Second & third journeys',
    label: 'Aegean world',
    years: 'c. 49–57 CE',
    bounds: { west: 21.8, east: 36.8, south: 35.0, north: 41.8 },
    climate: { desert: 0.04, forest: 0.78, relief: 1.32, vegetation: 0.9, river: 0.12, seed: 83 },
    labels: ['Greece', 'Aegean', 'Anatolia', 'Mediterranean Sea'],
  },
  paulRome: {
    id: 'paulRome',
    era: 'Voyage to Rome',
    label: 'Central Mediterranean',
    years: 'c. 59–62 CE',
    bounds: { west: 12.2, east: 36.4, south: 31.2, north: 42.4 },
    climate: { desert: 0.12, forest: 0.5, relief: 1.1, vegetation: 0.58, river: 0.12, seed: 89 },
    labels: ['Italy', 'Greece', 'Crete', 'Mediterranean Sea', 'Aegean'],
  },
  asiaMinor: {
    id: 'asiaMinor',
    era: 'Seven churches',
    label: 'Western Asia Minor',
    years: 'c. late 1st c. CE',
    bounds: { west: 26.2, east: 30.6, south: 36.9, north: 39.9 },
    climate: { desert: 0.08, forest: 0.66, relief: 1.28, vegetation: 0.82, river: 0.12, seed: 97 },
    labels: ['Anatolia', 'Aegean', 'Mediterranean Sea'],
  },
}

const JOURNEY_PERIODS = {
  abram: 'patriarchal',
  exodus: 'exodus',
  'conquest-allotment': 'conquest',
  'united-monarchy': 'unitedMonarchy',
  kingdoms: 'dividedKingdom',
  'elijah-elisha': 'northernProphets',
  'assyrian-crisis': 'assyrian',
  'exile-return': 'exile',
  'nativity-early-life': 'nativity',
  'galilee-ministry': 'galilee',
  'passion-resurrection': 'passion',
  'paul-first-journey': 'paulCyprus',
  'paul-second-third-journeys': 'paulAegean',
  'paul-to-rome': 'paulRome',
  'seven-churches': 'asiaMinor',
}

export function getPeriodForJourney(journeyId) {
  const key = JOURNEY_PERIODS[journeyId] || 'patriarchal'
  return HISTORICAL_PERIODS[key]
}

export function boundsForJourney(period, journey) {
  const box = { ...period.bounds }
  const add = (lat, lon) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
    box.west = Math.min(box.west, lon)
    box.east = Math.max(box.east, lon)
    box.south = Math.min(box.south, lat)
    box.north = Math.max(box.north, lat)
  }
  for (const point of journey?.points || []) add(point.lat, point.lon)
  for (const step of journey?.path || []) add(step[0], step[1])
  return box
}
