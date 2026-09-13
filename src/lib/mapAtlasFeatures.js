export const LANDS = [
  {
    id: 'anatolia',
    name: 'Anatolia',
    tone: 'highland',
    points: [
      [39.2, 25.6], [39.2, 36.8], [38.6, 39.8], [37.6, 41.2], [36.8, 40.4],
      [36.4, 36.6], [36.15, 34.2], [36.05, 32.2], [36.25, 30.4], [36.55, 28.2],
      [36.9, 27.0], [37.8, 26.2], [38.6, 25.7],
    ],
  },
  {
    id: 'cyprus',
    name: 'Cyprus',
    tone: 'levant',
    points: [
      [35.70, 32.28], [35.68, 33.05], [35.60, 34.00], [35.18, 34.58],
      [34.88, 34.10], [34.62, 33.05], [34.66, 32.42], [35.12, 32.26],
    ],
  },
  {
    id: 'levant',
    name: 'Levant',
    tone: 'levant',
    points: [
      [36.85, 36.15], [36.35, 36.05], [35.55, 35.92], [34.70, 35.82],
      [33.90, 35.52], [33.15, 35.22], [32.45, 34.88], [31.85, 34.62],
      [31.38, 34.28], [31.20, 34.55], [31.55, 35.55], [32.20, 36.55],
      [33.10, 37.35], [34.40, 38.15], [35.70, 38.55], [36.70, 38.05],
      [36.95, 36.85],
    ],
  },
  {
    id: 'egypt',
    name: 'Egypt',
    tone: 'africa',
    points: [
      [31.55, 25.6], [31.48, 27.4], [31.55, 29.2], [31.52, 30.2],
      [31.40, 31.4], [31.28, 32.35], [30.85, 32.55], [29.90, 32.58],
      [28.40, 32.95], [26.60, 33.55], [24.20, 34.55], [21.20, 35.40],
      [20.80, 32.40], [21.40, 29.20], [23.80, 27.20], [26.80, 26.10],
      [29.40, 25.70],
    ],
  },
  {
    id: 'sinai',
    name: 'Sinai',
    tone: 'desert',
    points: [
      [31.15, 32.45], [31.20, 33.80], [31.05, 34.35], [29.55, 34.92],
      [28.20, 34.55], [27.70, 33.95], [27.95, 33.35], [29.10, 32.78],
      [30.05, 32.52],
    ],
  },
  {
    id: 'arabia',
    name: 'Arabia',
    tone: 'desert',
    points: [
      [29.85, 35.05], [31.10, 36.05], [31.40, 37.80], [30.70, 41.40],
      [29.40, 45.20], [27.60, 48.60], [25.40, 50.40], [22.40, 50.20],
      [20.80, 47.20], [20.80, 40.40], [22.60, 37.60], [25.20, 35.90],
      [27.60, 35.20],
    ],
  },
  {
    id: 'mesopotamia',
    name: 'Mesopotamia',
    tone: 'levant',
    points: [
      [37.40, 38.20], [37.70, 40.80], [37.10, 43.60], [35.80, 46.20],
      [34.20, 47.60], [32.20, 48.10], [30.70, 47.80], [30.40, 45.80],
      [31.80, 43.60], [33.60, 41.20], [35.20, 39.10], [36.40, 38.20],
    ],
  },
  {
    id: 'persia',
    name: 'Persia',
    tone: 'highland',
    points: [
      [36.80, 45.80], [37.20, 48.80], [35.60, 50.80], [32.80, 50.80],
      [30.60, 50.40], [30.20, 48.40], [32.20, 47.40], [34.40, 46.60],
    ],
  },
]

export const SEAS = [
  {
    id: 'mediterranean',
    label: 'Mediterranean Sea',
    points: [
      [38.80, 25.6], [38.80, 35.40], [37.20, 36.10], [36.40, 36.05],
      [35.50, 35.90], [34.55, 35.78], [33.70, 35.48], [32.90, 35.12],
      [32.20, 34.78], [31.65, 34.50], [31.22, 34.15], [31.18, 32.90],
      [31.32, 31.60], [31.48, 30.15], [31.40, 28.20], [31.20, 26.20],
      [31.35, 25.6],
    ],
  },
  {
    id: 'red-sea',
    label: 'Red Sea',
    points: [
      [29.92, 32.55], [28.70, 33.05], [27.10, 33.85], [25.40, 34.85],
      [23.60, 36.05], [21.70, 37.55], [21.10, 38.55], [21.40, 37.35],
      [23.20, 35.70], [25.30, 34.45], [27.20, 33.55], [28.55, 32.95],
    ],
  },
  {
    id: 'aqaba',
    label: 'Gulf of Aqaba',
    points: [
      [29.52, 34.97], [28.70, 34.78], [27.95, 34.48], [27.85, 34.22],
      [28.65, 34.42], [29.48, 34.70],
    ],
  },
  {
    id: 'dead-sea',
    label: 'Dead Sea',
    points: [
      [31.76, 35.37], [31.70, 35.54], [31.22, 35.52], [31.28, 35.32],
    ],
  },
  {
    id: 'persian-gulf',
    label: 'Persian Gulf',
    points: [
      [30.40, 47.90], [29.60, 50.10], [28.00, 50.80], [26.40, 50.40],
      [26.80, 48.80], [28.60, 47.90],
    ],
  },
]

export const RIVERS = [
  {
    id: 'nile',
    label: 'Nile',
    points: [
      [20.9, 32.70], [22.8, 32.85], [24.8, 32.95], [26.6, 32.70],
      [28.4, 31.85], [29.6, 31.25], [30.5, 31.15], [31.15, 30.45],
    ],
  },
  {
    id: 'nile-rosetta',
    label: 'Rosetta',
    points: [[31.15, 30.45], [31.48, 30.35]],
  },
  {
    id: 'nile-damietta',
    label: 'Damietta',
    points: [[31.15, 30.45], [31.42, 31.75]],
  },
  {
    id: 'jordan',
    label: 'Jordan',
    points: [[33.15, 35.68], [32.55, 35.58], [31.95, 35.52], [31.55, 35.45]],
  },
  {
    id: 'euphrates',
    label: 'Euphrates',
    points: [
      [37.15, 38.15], [36.70, 39.20], [36.05, 40.55], [35.15, 42.45],
      [33.80, 44.20], [32.40, 46.00], [31.05, 47.45],
    ],
  },
  {
    id: 'tigris',
    label: 'Tigris',
    points: [
      [37.25, 40.85], [36.20, 43.05], [35.00, 44.55], [33.60, 45.85],
      [32.20, 47.05], [31.10, 47.65],
    ],
  },
]

export const MOUNTAINS = [
  { id: 'taurus', label: 'Taurus', points: [[37.05, 30.80], [37.35, 33.20], [37.65, 35.60], [37.85, 38.20]] },
  { id: 'lebanon', label: 'Lebanon', points: [[34.70, 36.05], [33.95, 35.82], [33.25, 35.58]] },
  { id: 'judean', label: 'Judean Hills', points: [[32.10, 35.25], [31.70, 35.18], [31.35, 35.12]] },
  { id: 'sinai', label: 'Sinai', points: [[29.10, 33.85], [28.55, 34.05], [28.05, 34.25], [27.70, 33.90]] },
  { id: 'hijaz', label: 'Hijaz', points: [[27.40, 36.40], [26.20, 37.60], [24.80, 38.80], [23.40, 40.10]] },
  { id: 'zagros', label: 'Zagros', points: [[35.90, 46.10], [34.50, 47.20], [32.90, 48.35], [31.40, 49.40]] },
]

export const REGION_LABELS = [
  { name: 'Canaan', lat: 32.15, lon: 35.85 },
  { name: 'Egypt', lat: 26.80, lon: 29.40 },
  { name: 'Sinai', lat: 28.85, lon: 33.55 },
  { name: 'Mesopotamia', lat: 34.40, lon: 43.60 },
]

export const BANNER_LABELS = [
  { name: 'A R A B I A', lat: 25.70, lon: 41.10, size: 26, tracking: 10 },
]

export const CITY_LABELS = [
  { name: 'Jerusalem', lat: 31.78, lon: 35.22 },
  { name: 'Alexandria', lat: 31.20, lon: 29.92 },
  { name: 'Babylon', lat: 32.54, lon: 44.42 },
  { name: 'Mount Sinai', lat: 28.54, lon: 33.98 },
  { name: 'Cyprus', lat: 35.05, lon: 33.25 },
]

export const SEA_LABELS = [
  { name: 'Mediterranean Sea', lat: 33.85, lon: 29.40 },
  { name: 'Red Sea', lat: 24.60, lon: 35.85 },
  { name: 'Nile', lat: 26.20, lon: 31.55 },
  { name: 'Euphrates', lat: 35.05, lon: 41.85 },
  { name: 'Tigris', lat: 34.70, lon: 45.35 },
]

export const LAND_TONES = {
  europe: { day: '#e7d3a6', night: '#4a3f2e' },
  highland: { day: '#ddc48f', night: '#45392a' },
  levant: { day: '#e8d2a0', night: '#4d4030' },
  africa: { day: '#edd8a8', night: '#524533' },
  desert: { day: '#f3e2b4', night: '#5a4b36' },
}

export const DECORATIONS = {
  compass: { lat: 25.15, lon: 30.85 },
  boat: { lat: 33.55, lon: 29.85 },
  palm: { lat: 26.35, lon: 43.40 },
  ziggurat: { lat: 32.85, lon: 45.35 },
}

export function mountainHatches(ridges) {
  return ridges.flatMap((ridge) => {
    const marks = []
    for (let i = 0; i < ridge.points.length - 1; i += 1) {
      const [lat1, lon1] = ridge.points[i]
      const [lat2, lon2] = ridge.points[i + 1]
      const steps = 7
      for (let step = 0; step < steps; step += 1) {
        const t = (step + 0.28) / steps
        const jitter = ((i * 7 + step * 3) % 5) * 0.035
        marks.push({
          id: `${ridge.id}-${i}-${step}`,
          lat: lat1 + (lat2 - lat1) * t + jitter * 0.16,
          lon: lon1 + (lon2 - lon1) * t + (step % 2 ? 0.09 : -0.07),
          size: 2.1 + (step % 3) * 0.7,
        })
      }
    }
    return marks
  })
}

export function desertStipple() {
  const marks = []
  for (let i = 0; i < 36; i += 1) {
    marks.push({
      id: `stipple-${i}`,
      lat: 23.4 + (i % 6) * 0.72 + ((i * 3) % 5) * 0.06,
      lon: 38.2 + Math.floor(i / 6) * 1.35 + ((i * 5) % 4) * 0.08,
    })
  }
  return marks
}
