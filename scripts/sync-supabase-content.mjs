import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { DAILY_VERSES, READINGS } from '../src/data/readerContent.js'
import { JOURNEYS } from '../src/data/journeys.js'

const projectRoot = path.resolve(import.meta.dirname, '..')
const envCandidates = ['.env.local', '.env'].map((filename) => path.join(projectRoot, filename))

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false })
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const readings = Object.entries(READINGS).map(([book, payload], index) => ({
  available_chapters: payload.availableChapters,
  book,
  category: payload.category,
  chapter: payload.chapter,
  payload,
  reading_key: payload.key,
  sort_order: index,
  subtitle: payload.subtitle,
  title: payload.title,
}))

const journeys = JOURNEYS.map((journey, index) => ({
  books: journey.books,
  description: journey.description,
  id: journey.id,
  payload: journey,
  sort_order: index,
  title: journey.title,
}))

const dailyVerses = DAILY_VERSES.map((entry, index) => ({
  day_of_year: index,
  exegesis: entry.exegesis,
  ref: entry.ref,
  verse: entry.verse,
}))

await upsert('app_readings', readings)
await upsert('app_journeys', journeys)
await upsert('app_daily_verses', dailyVerses)

console.log(`Synced ${readings.length} readings, ${journeys.length} journeys, and ${dailyVerses.length} daily verses.`)

async function upsert(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: inferConflictKey(table) })
  if (error) {
    console.error(`Failed to sync ${table}:`, error.message)
    process.exit(1)
  }
}

function inferConflictKey(table) {
  if (table === 'app_daily_verses') return 'day_of_year'
  if (table === 'app_journeys') return 'id'
  return 'book'
}
