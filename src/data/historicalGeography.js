// Biblical-era geography used as the PRIMARY labels on the map, with the
// present-day name kept only as a secondary "modern reference" so readers can
// relate the ancient world to today. Coordinates are approximate label anchors.

export const HISTORICAL_REGIONS = [
  { name: 'Canaan', modern: 'Israel & Palestine', lat: 31.9, lon: 35.0 },
  { name: 'Phoenicia', modern: 'Lebanon', lat: 34.1, lon: 35.7 },
  { name: 'Aram', modern: 'Syria', lat: 35.2, lon: 38.6 },
  { name: 'Padan-Aram', modern: 'Upper Mesopotamia', lat: 36.9, lon: 40.2 },
  { name: 'Mesopotamia', modern: 'Iraq', lat: 34.6, lon: 43.4 },
  { name: 'Assyria', modern: 'Northern Iraq', lat: 36.3, lon: 42.8 },
  { name: 'Babylonia (Chaldea)', modern: 'Southern Iraq', lat: 32.2, lon: 44.6 },
  { name: 'Elam (Persia)', modern: 'Iran', lat: 31.9, lon: 49.6 },
  { name: 'Media', modern: 'Northwest Iran', lat: 35.8, lon: 48.6 },
  { name: 'Egypt', modern: 'Egypt', lat: 27.3, lon: 30.9 },
  { name: 'Goshen', modern: 'Nile Delta, Egypt', lat: 30.8, lon: 31.8 },
  { name: 'Sinai', modern: 'Sinai Peninsula, Egypt', lat: 29.2, lon: 33.9 },
  { name: 'Midian', modern: 'Northwest Arabia', lat: 28.0, lon: 35.7 },
  { name: 'Edom', modern: 'Southern Jordan', lat: 30.4, lon: 35.5 },
  { name: 'Moab', modern: 'West-central Jordan', lat: 31.4, lon: 35.8 },
  { name: 'Ammon', modern: 'Amman, Jordan', lat: 32.0, lon: 36.0 },
  { name: 'Arabia', modern: 'Saudi Arabia', lat: 28.4, lon: 43.5 },
  { name: 'Asia Minor (Anatolia)', modern: 'Türkiye', lat: 39.2, lon: 33.2 },
  { name: 'Galatia', modern: 'Central Türkiye', lat: 39.5, lon: 34.2 },
  { name: 'Asia', modern: 'Western Türkiye', lat: 38.6, lon: 28.4 },
  { name: 'Cyprus', modern: 'Cyprus', lat: 35.0, lon: 33.2 },
  { name: 'Macedonia', modern: 'N. Greece', lat: 40.9, lon: 22.6 },
  { name: 'Achaia', modern: 'Greece', lat: 38.2, lon: 22.9 },
]

export const HISTORICAL_WATERS = [
  { name: 'The Great Sea', modern: 'Mediterranean Sea', lat: 34.4, lon: 32.4 },
  { name: 'Great Sea', modern: 'Mediterranean Sea', lat: 36.8, lon: 25.0 },
  { name: 'Salt Sea', modern: 'Dead Sea', lat: 31.5, lon: 35.5 },
  { name: 'Sea of Galilee', modern: 'Lake Tiberias', lat: 32.8, lon: 35.6 },
  { name: 'River Euphrates', modern: 'Euphrates', lat: 34.6, lon: 41.2 },
  { name: 'River Tigris (Hiddekel)', modern: 'Tigris', lat: 34.2, lon: 44.4 },
  { name: 'The Nile', modern: 'Nile', lat: 27.2, lon: 31.2 },
  { name: 'Red Sea', modern: 'Red Sea', lat: 26.8, lon: 35.2 },
  { name: 'Persian Gulf', modern: 'Persian Gulf', lat: 28.6, lon: 50.4 },
]

// Modern-day reference for the biblical cities/waypoints used across journeys.
export const MODERN_NAME_BY_PLACE = {
  'Ur of the Chaldeans': 'near Nasiriyah, Iraq',
  Haran: 'Harran, Türkiye',
  'Shechem in Canaan': 'Nablus, West Bank',
  'Mount Sinai': 'Sinai Peninsula, Egypt',
  'Plains of Moab': 'Jordan Valley, Jordan',
  'Goshen / Pi-Ramesses': 'Qantir, Egypt',
  Dan: 'Tel Dan, Israel',
  Jerusalem: 'Jerusalem',
  'Jerusalem Rebuilt': 'Jerusalem',
  'Jerusalem / Hill Country': 'Jerusalem, Israel',
  Nazareth: 'Nazareth, Israel',
  'Nazareth Return': 'Nazareth, Israel',
  Capernaum: 'Kfar Nahum, Israel',
  'Antioch in Syria': 'Antakya, Türkiye',
  'Salamis and Paphos, Cyprus': 'Cyprus',
  'Perga in Pamphylia': 'near Antalya, Türkiye',
  'Pisidian Antioch': 'Yalvaç, Türkiye',
  'Iconium and Lystra': 'Konya, Türkiye',
  Babylon: 'Hillah, Iraq',
  Susa: 'Shush, Iran',
  Ephesus: 'Selçuk, Türkiye',
  Smyrna: 'İzmir, Türkiye',
  Pergamum: 'Bergama, Türkiye',
  Thyatira: 'Akhisar, Türkiye',
  Sardis: 'Sart, Türkiye',
  Philadelphia: 'Alaşehir, Türkiye',
  Laodicea: 'near Denizli, Türkiye',
  Jericho: 'Tell es-Sultan, West Bank',
  Gibeon: 'al-Jib, West Bank',
  Bethlehem: 'Bethlehem, West Bank',
  Hebron: 'Hebron, West Bank',
  Megiddo: 'Tel Megiddo, Israel',
  'Mount Carmel': 'Haifa, Israel',
  Samaria: 'Sebastia, West Bank',
  Nineveh: 'Mosul, Iraq',
  Bethany: 'al-Eizariya, West Bank',
  'Mount of Olives': 'Jerusalem',
  'Temple Courts': 'Temple Mount, Jerusalem',
  Egypt: 'Egypt',
  Bethphage: 'Mount of Olives, Jerusalem',
}

export function getModernName(name) {
  if (!name) return null
  return MODERN_NAME_BY_PLACE[name] || null
}
