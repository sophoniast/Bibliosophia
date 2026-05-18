import { DAILY_VERSES, READINGS } from '../data/readerContent'
import { JOURNEYS } from '../data/journeys'
import { CANONICAL_BOOKS, DEFAULT_TRANSLATION, getCanonicalBook, getTranslation } from '../data/bibleCanon'
import { supabase, ensureSupabaseSession, hasSupabaseEnv } from './supabase'

const DEFAULT_PREFERENCES = {
  fontScale: 1.55,
  lineHeight: 1.8,
  mode: 'night',
  themeName: 'abbey',
}

function fallbackAnswer(question, readingTitle, selectedEntry) {
  const selectedWordLine = selectedEntry
    ? `The selected word is ${selectedEntry.lemma} (${selectedEntry.translit}, ${selectedEntry.strongs}), which in this passage emphasizes ${String(selectedEntry.def).toLowerCase()}.`
    : 'No lexical item is currently selected, so the response stays at the broader passage level.'

  return `${readingTitle} foregrounds theology through literary density rather than sheer narrative speed.\n\n${selectedWordLine}\n\nA strong first-pass reading question is how the passage frames divine agency, revelation, and human response. Connect Supabase edge functions to move this response fully onto your hosted backend.\n\nPrompt received: “${String(question).trim()}”`
}

async function searchWikimediaFallback(query) {
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`,
  )
  const payload = await response.json()
  const pages = Object.values(payload.query?.pages || {})

  const results = pages
    .map((page) => {
      const imageInfo = page.imageinfo?.[0]
      if (!imageInfo?.thumburl || !imageInfo?.url) return null

      return {
        id: `commons-${page.pageid}`,
        title: page.title.replace(/^File:/, ''),
        thumb: imageInfo.thumburl,
        full: imageInfo.url,
        source: 'Wikimedia Commons',
      }
    })
    .filter(Boolean)

  return { results }
}

export async function getHomeData() {
  if (!hasSupabaseEnv) {
    return {
      dailyVerse: getDailyVerseFallback(),
      journeys: JOURNEYS.map(({ books, description, id, title }) => ({ books, description, id, title })),
      readings: Object.entries(READINGS).map(([book, reading]) => ({
        book,
        category: reading.category,
        subtitle: reading.subtitle,
        title: reading.title,
      })),
    }
  }

  const dayOfYear = getDayOfYearIndex()
  const { data, error } = await supabase
    .from('app_daily_verses')
    .select('ref, verse, exegesis')
    .eq('day_of_year', dayOfYear)
    .maybeSingle()

  if (error) throw error

  return {
    dailyVerse: data || getDailyVerseFallback(),
  }
}

export async function getJourneys() {
  if (!hasSupabaseEnv) return JOURNEYS

  const { data, error } = await supabase
    .from('app_journeys')
    .select('payload')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data.map((row) => row.payload)
}

export async function getPreferences() {
  if (!hasSupabaseEnv) return DEFAULT_PREFERENCES

  const userId = await ensureProfile()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('theme_name, mode, font_scale, line_height')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return DEFAULT_PREFERENCES

  return {
    fontScale: Number(data.font_scale),
    lineHeight: Number(data.line_height),
    mode: data.mode,
    themeName: data.theme_name,
  }
}

export async function savePreferences(payload) {
  if (!hasSupabaseEnv) return { ...DEFAULT_PREFERENCES, ...payload }

  const userId = await ensureProfile()
  const record = {
    font_scale: Number(payload.fontScale ?? DEFAULT_PREFERENCES.fontScale),
    id: userId,
    line_height: Number(payload.lineHeight ?? DEFAULT_PREFERENCES.lineHeight),
    mode: payload.mode ?? DEFAULT_PREFERENCES.mode,
    theme_name: payload.themeName ?? DEFAULT_PREFERENCES.themeName,
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(record)
    .select('theme_name, mode, font_scale, line_height')
    .single()

  if (error) throw error

  return {
    fontScale: Number(data.font_scale),
    lineHeight: Number(data.line_height),
    mode: data.mode,
    themeName: data.theme_name,
  }
}

export async function getReadings() {
  return CANONICAL_BOOKS.map((item) => ({
    availableChapters: Array.from({ length: item.chapters }, (_, index) => index + 1),
    book: item.book,
    category: item.category,
    chapter: 1,
    id: item.id,
    key: `${item.book}-1`,
    subtitle: `${item.chapters} canonical chapter${item.chapters === 1 ? '' : 's'} available for study.`,
    title: item.title,
  }))
}

export async function getReading(book, chapter = 1, translation = DEFAULT_TRANSLATION) {
  const canonicalBook = getCanonicalBook(book)
  const chapterNumber = Math.min(Math.max(Number(chapter) || 1, 1), canonicalBook.chapters)
  const selectedTranslation = getTranslation(translation)
  const localReading = READINGS[book]

  try {
    const controller = new AbortController()
    const timeout = globalThis.setTimeout(() => controller.abort(), 10000)
    const response = await fetch(
      `https://bible-api.com/data/${encodeURIComponent(selectedTranslation.id)}/${canonicalBook.id}/${chapterNumber}`,
      { signal: controller.signal },
    )
    globalThis.clearTimeout(timeout)

    if (!response.ok) throw new Error(`Bible API responded with ${response.status}`)

    const payload = await response.json()
    const verses = Array.isArray(payload.verses)
      ? payload.verses
        .map((verse) => ({
          number: Number(verse.verse),
          text: String(verse.text || '').replace(/\s+/g, ' ').trim(),
        }))
        .filter((verse) => verse.number && verse.text)
      : []

    if (!verses.length) throw new Error('No verses returned for this passage.')

    return {
      availableChapters: Array.from({ length: canonicalBook.chapters }, (_, index) => index + 1),
      chapter: chapterNumber,
      category: canonicalBook.category,
      crossRefs: localReading?.crossRefs || [],
      key: `${canonicalBook.book}-${chapterNumber}-${selectedTranslation.id}`,
      lexicon: localReading?.lexicon || {},
      source: {
        license: payload.translation?.license || selectedTranslation.license,
        translation: payload.translation?.name || selectedTranslation.label,
        translationId: payload.translation?.identifier || selectedTranslation.id,
      },
      subtitle: `${selectedTranslation.label} (${selectedTranslation.license}). Loaded from a freely distributable scripture source.`,
      title: canonicalBook.title,
      verses,
    }
  } catch {
    if (localReading) {
      return {
        ...localReading,
        source: {
          license: 'Local fallback',
          translation: 'Sample reader text',
          translationId: 'local',
        },
      }
    }

    return {
      availableChapters: Array.from({ length: canonicalBook.chapters }, (_, index) => index + 1),
      chapter: chapterNumber,
      category: canonicalBook.category,
      crossRefs: [],
      key: `${canonicalBook.book}-${chapterNumber}-unavailable`,
      lexicon: {},
      source: {
        license: 'Unavailable',
        translation: selectedTranslation.label,
        translationId: selectedTranslation.id,
      },
      subtitle: 'This chapter could not be loaded. Check the network connection or choose another free translation.',
      title: canonicalBook.title,
      verses: [
        {
          number: 1,
          text: 'This chapter is temporarily unavailable in the selected translation.',
        },
      ],
    }
  }
}

export async function getReaderState(readingKey) {
  if (!hasSupabaseEnv) {
    return {
      highlights: {},
      notes: '',
      readingKey,
    }
  }

  const userId = await ensureProfile()
  const { data, error } = await supabase
    .from('reader_states')
    .select('notes, highlights, reading_key')
    .eq('user_id', userId)
    .eq('reading_key', readingKey)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    return {
      highlights: {},
      notes: '',
      readingKey,
    }
  }

  return {
    highlights: data.highlights || {},
    notes: data.notes || '',
    readingKey: data.reading_key,
  }
}

export async function saveReaderState(readingKey, payload) {
  if (!hasSupabaseEnv) {
    return {
      highlights: payload.highlights || {},
      notes: payload.notes || '',
      readingKey,
    }
  }

  const userId = await ensureProfile()
  const { data, error } = await supabase
    .from('reader_states')
    .upsert({
      highlights: payload.highlights || {},
      notes: payload.notes || '',
      reading_key: readingKey,
      user_id: userId,
    }, {
      onConflict: 'user_id,reading_key',
    })
    .select('notes, highlights, reading_key')
    .single()

  if (error) throw error

  return {
    highlights: data.highlights || {},
    notes: data.notes || '',
    readingKey: data.reading_key,
  }
}

export async function askReader(payload) {
  if (!hasSupabaseEnv) {
    return {
      answer: fallbackAnswer(payload.question, payload.readingTitle, payload.selectedEntry),
    }
  }

  await ensureSupabaseSession()
  const { data, error } = await supabase.functions.invoke('reader-ai', {
    body: payload,
  })

  if (error) {
    return {
      answer: fallbackAnswer(payload.question, payload.readingTitle, payload.selectedEntry),
    }
  }

  return data
}

export async function searchVerseImageLibrary(payload) {
  if (!hasSupabaseEnv) {
    if (payload?.source === 'commons') {
      return searchWikimediaFallback(payload.query || '')
    }

    throw new Error('Secure image providers require Supabase configuration.')
  }

  await ensureSupabaseSession()
  const { data, error } = await supabase.functions.invoke('image-search', {
    body: payload,
  })

  if (error) {
    const response = error.context
    if (response instanceof Response) {
      try {
        const payload = await response.json()
        throw new Error(payload.error || `Image search failed (${response.status}).`)
      } catch {
        throw new Error(`Image search failed (${response.status}).`)
      }
    }

    throw error
  }
  return data
}

export async function getVerseImageSources() {
  if (!hasSupabaseEnv) {
    return {
      sources: [{ id: 'commons', label: 'Wikimedia Commons', enabled: true }],
    }
  }

  await ensureSupabaseSession()
  const { data, error } = await supabase.functions.invoke('image-search', {
    body: { action: 'sources' },
  })

  if (error) {
    return {
      sources: [{ id: 'commons', label: 'Wikimedia Commons', enabled: true }],
    }
  }

  return data
}

async function ensureProfile() {
  const session = await ensureSupabaseSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('Could not establish a Supabase session.')

  const { error } = await supabase.from('user_profiles').upsert({
    id: userId,
  })

  if (error) throw error
  return userId
}

function getDayOfYearIndex() {
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 0)
  const diff = now - yearStart
  const dayOfYear = Math.floor(diff / 86400000)
  return dayOfYear % DAILY_VERSES.length
}

function getDailyVerseFallback() {
  return DAILY_VERSES[getDayOfYearIndex()]
}
