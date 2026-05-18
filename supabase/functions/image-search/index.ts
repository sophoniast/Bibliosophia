import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
}

const DISALLOWED_IMAGE_TERMS = [
  "adult", "anal", "ass", "bdsm", "bikini", "bondage", "breast", "cleavage", "erotic", "fetish", "lingerie",
  "naked", "nude", "nudity", "nsfw", "porn", "porno", "pussy", "sensual", "sex", "sexual", "sexy", "strip", "topless",
  "underwear", "vagina",
]

const PREFERRED_BIBLICAL_TERMS = [
  "ancient", "architecture", "biblical", "bible", "book", "candle", "church", "cloud", "cross", "desert", "dove",
  "galilee", "garden", "gold", "gospel", "heaven", "hill", "jerusalem", "lamp", "landscape", "light", "manuscript",
  "mountain", "nature", "olive", "papyrus", "parchment", "river", "sacred", "scroll", "sea", "sky", "stone", "sunrise",
  "sunset", "temple", "wilderness",
]

const IMAGE_SEARCH_SOURCES = [
  { id: "unsplash", label: "Unsplash", enabled: Boolean(Deno.env.get("UNSPLASH_ACCESS_KEY")) },
  { id: "pexels", label: "Pexels", enabled: Boolean(Deno.env.get("PEXELS_API_KEY")) },
  { id: "pixabay", label: "Pixabay", enabled: Boolean(Deno.env.get("PIXABAY_API_KEY")) },
  { id: "openverse", label: "Openverse", enabled: true },
  { id: "commons", label: "Wikimedia Commons", enabled: true },
]

type SearchResult = {
  id: string
  title: string
  thumb: string
  full: string
  source: string
  creator?: string
  tags?: Array<{ name: string }>
  mature?: boolean
}

function normalizeSearchText(value: unknown) {
  return String(value || "").toLowerCase()
}

function tokenizeSearchQuery(query: string) {
  return normalizeSearchText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
}

function isSafeBiblicalImageResult(item: Partial<SearchResult>, query: string) {
  const searchable = [
    item.title,
    item.creator,
    ...(item.tags || []).map((tag) => tag.name || ""),
  ]
    .join(" ")
    .toLowerCase()

  if (item.mature) return false
  if (DISALLOWED_IMAGE_TERMS.some((term) => searchable.includes(term))) return false

  const queryTokens = tokenizeSearchQuery(query)
  const hasQueryMatch = queryTokens.length === 0 || queryTokens.some((token) => searchable.includes(token))
  return hasQueryMatch
}

function rankBiblicalImageResult(item: Partial<SearchResult>, query: string) {
  const searchable = [
    item.title,
    item.creator,
    ...(item.tags || []).map((tag) => tag.name || ""),
  ]
    .join(" ")
    .toLowerCase()

  const queryTokens = tokenizeSearchQuery(query)
  const queryScore = queryTokens.reduce((score, token) => score + (searchable.includes(token) ? 6 : 0), 0)
  const biblicalScore = PREFERRED_BIBLICAL_TERMS.reduce((score, term) => score + (searchable.includes(term) ? 2 : 0), 0)
  return queryScore + biblicalScore
}

async function searchUnsplashImages(query: string) {
  const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY")
  if (!accessKey) throw new Error("UNSPLASH_ACCESS_KEY is not configured")

  const response = await fetch(
    `https://api.unsplash.com/search/photos?client_id=${encodeURIComponent(accessKey)}&query=${encodeURIComponent(query)}&per_page=24&orientation=landscape&content_filter=high`,
  )
  const payload = await response.json()

  return (payload.results || [])
    .map((result: any) => ({
      id: `unsplash-${result.id}`,
      title: result.alt_description || result.description || `Unsplash photo ${result.id}`,
      thumb: result.urls?.small || result.urls?.regular,
      full: result.urls?.regular || result.urls?.full || result.urls?.small,
      source: "Unsplash",
      creator: result.user?.name || "",
      tags: (result.tags || []).map((tag: any) => ({ name: tag.title || "" })),
      mature: false,
    }))
    .filter((result: SearchResult) => isSafeBiblicalImageResult(result, query))
    .slice(0, 18)
}

async function searchPexelsImages(query: string) {
  const apiKey = Deno.env.get("PEXELS_API_KEY")
  if (!apiKey) throw new Error("PEXELS_API_KEY is not configured")

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=24&orientation=landscape&locale=en-US`,
    {
      headers: {
        Authorization: apiKey,
      },
    },
  )
  const payload = await response.json()

  return (payload.photos || [])
    .map((result: any) => ({
      id: `pexels-${result.id}`,
      title: result.alt || `Pexels photo ${result.id}`,
      thumb: result.src?.medium || result.src?.landscape || result.src?.tiny,
      full: result.src?.large2x || result.src?.large || result.src?.landscape || result.src?.original,
      source: "Pexels",
      creator: result.photographer || "",
      tags: String(result.alt || "")
        .split(/[^a-z0-9]+/i)
        .filter(Boolean)
        .map((tag) => ({ name: String(tag).trim() })),
      mature: false,
    }))
    .filter((result: SearchResult) => isSafeBiblicalImageResult(result, query))
    .slice(0, 18)
}

async function searchPixabayImages(query: string) {
  const apiKey = Deno.env.get("PIXABAY_API_KEY")
  if (!apiKey) throw new Error("PIXABAY_API_KEY is not configured")

  const response = await fetch(
    `https://pixabay.com/api/?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=24&orientation=horizontal`,
  )
  const payload = await response.json()

  return (payload.hits || [])
    .map((result: any) => ({
      id: `pixabay-${result.id}`,
      title: result.tags || `Pixabay image ${result.id}`,
      thumb: result.webformatURL || result.previewURL,
      full: result.largeImageURL || result.webformatURL,
      source: "Pixabay",
      creator: result.user || "",
      tags: String(result.tags || "")
        .split(",")
        .map((tag) => ({ name: String(tag).trim() })),
      mature: false,
    }))
    .filter((result: SearchResult) => isSafeBiblicalImageResult(result, query))
    .slice(0, 18)
}

async function searchOpenverseImages(query: string) {
  const response = await fetch(
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=30`,
  )
  const payload = await response.json()

  return (payload.results || [])
    .map((result: any) => ({
      id: `openverse-${result.id}`,
      title: result.title || "Openverse image",
      thumb: result.thumbnail || result.url,
      full: result.url,
      source: `Openverse · ${result.source || result.provider || "open media"}`,
      creator: result.creator || result.provider || "",
      tags: (result.tags || []).map((tag: any) => ({ name: tag.name || tag.title || "" })),
      mature: Boolean(result.mature),
    }))
    .filter((result: SearchResult) => isSafeBiblicalImageResult(result, query))
    .sort((left: SearchResult, right: SearchResult) => rankBiblicalImageResult(right, query) - rankBiblicalImageResult(left, query))
    .slice(0, 18)
}

async function searchWikimediaImages(query: string) {
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`,
  )
  const payload = await response.json()
  const pages = Object.values(payload.query?.pages || {})

  return pages
    .map((page: any) => {
      const imageInfo = page.imageinfo?.[0]
      if (!imageInfo?.thumburl || !imageInfo?.url) return null

      return {
        id: `commons-${page.pageid}`,
        title: page.title.replace(/^File:/, ""),
        thumb: imageInfo.thumburl,
        full: imageInfo.url,
        source: "Wikimedia Commons",
        creator: "Wikimedia Commons",
        tags: page.title
          .replace(/^File:/, "")
          .split(/[^a-z0-9]+/i)
          .filter(Boolean)
          .map((tag: string) => ({ name: tag.trim() })),
        mature: false,
      }
    })
    .filter(Boolean)
    .filter((result: SearchResult) => isSafeBiblicalImageResult(result, query))
    .sort((left: SearchResult, right: SearchResult) => rankBiblicalImageResult(right, query) - rankBiblicalImageResult(left, query))
    .slice(0, 18)
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { action = "search", query = "", source = "commons" } = await request.json()
    if (action === "sources") {
      return new Response(JSON.stringify({ sources: IMAGE_SEARCH_SOURCES.filter((source) => source.enabled) }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      })
    }

    const trimmedQuery = String(query).trim()
    const selectedSource = String(source).trim().toLowerCase()

    let results: SearchResult[] = []
    if (selectedSource === "unsplash") results = await searchUnsplashImages(trimmedQuery)
    else if (selectedSource === "pexels") results = await searchPexelsImages(trimmedQuery)
    else if (selectedSource === "pixabay") results = await searchPixabayImages(trimmedQuery)
    else if (selectedSource === "openverse") results = await searchOpenverseImages(trimmedQuery)
    else results = await searchWikimediaImages(trimmedQuery)

    return new Response(JSON.stringify({ results }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Image search failed." }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    })
  }
})
