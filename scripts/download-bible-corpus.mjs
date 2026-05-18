import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FREE_BIBLE_TRANSLATIONS } from '../src/data/bibleCanon.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const corpusRoot = path.join(projectRoot, 'data', 'corpus')

const USER_AGENT = 'Bibliosophia corpus downloader (public-domain/open-license sources)'
const OPENBIBLE_RAW = 'https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/main'
const FILE_FETCH_CONCURRENCY = 12

const EBIBLE_PACKAGES = [
  ['web', 'eng-web', 'World English Bible'],
  ['kjv', 'eng-kjv', 'King James Version'],
  ['asv', 'eng-asv', 'American Standard Version (1901)'],
  ['bbe', 'engBBE', 'Bible in Basic English'],
  ['darby', 'engDBY', 'Darby Translation'],
  ['dra', 'engDRA', 'Douay-Rheims 1899'],
  ['oeb-us', 'engoebus', 'Open English Bible, US spelling'],
  ['oeb-cw', 'engoebcw', 'Open English Bible, Commonwealth spelling'],
  ['webbe', 'eng-webbe', 'World English Bible, British Edition'],
  ['ylt', 'engylt', "Young's Literal Translation"],
  ['cuv', 'cmn-cu89t', 'Chinese Union Version, traditional'],
  ['bkr', 'ces1613', 'Bible Kralicka 1613'],
  ['clementine', 'latVUC', 'Clementine Vulgate 1598'],
  ['almeida', 'porbrbsl', 'World Portuguese Bible'],
  ['rccv', 'ron1924', 'Romanian Bible, Dumitru Cornilescu 1924'],
  ['synodal', 'russyn', 'Russian Synodal Bible'],
].map(([translationId, ebibleId, title]) => ({ translationId, ebibleId, title }))

const RESOURCE_DOWNLOADS = [
  {
    group: 'dictionaries',
    id: 'easton-bible-dictionary',
    title: "Easton's Bible Dictionary",
    license: 'Public domain text; CCEL package formatting may carry CCEL terms',
    url: 'https://www.ccel.org/e/easton/ebd/ebd.zip',
    file: 'dictionaries/easton-bible-dictionary.zip',
  },
  {
    group: 'dictionaries',
    id: 'smith-bible-dictionary',
    title: "Smith's Bible Dictionary",
    license: 'Public domain text; CCEL package formatting may carry CCEL terms',
    url: 'https://www.ccel.org/ccel/smith_w/bibledict/cache/bibledict.txt',
    file: 'dictionaries/smith-bible-dictionary.txt',
  },
  {
    group: 'dictionaries',
    id: 'smith-bible-dictionary-pdf',
    title: "Smith's Bible Dictionary PDF",
    license: 'Public domain text; CCEL package formatting may carry CCEL terms',
    url: 'https://www.ccel.org/ccel/smith_w/bibledict/cache/bibledict.pdf',
    file: 'dictionaries/smith-bible-dictionary.pdf',
  },
  {
    group: 'dictionaries',
    id: 'nave-topical-bible',
    title: "Nave's Topical Bible",
    license: 'Public domain text; CCEL package formatting may carry CCEL terms',
    url: 'https://www.ccel.org/ccel/nave/bible/cache/bible.pdf',
    file: 'dictionaries/nave-topical-bible.pdf',
  },
  {
    group: 'lexicons',
    id: 'strongs-dictionary',
    title: "Strong's Hebrew and Greek Dictionaries",
    license: 'OpenScriptures repository license; original Strong text is public domain',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/strongs-dictionary.xhtml',
    file: 'lexicons/strongs-dictionary.xhtml',
  },
  ...[1, 2, 3, 4, 5, 6].map((volume) => ({
    group: 'commentaries',
    id: `matthew-henry-volume-${volume}`,
    title: `Matthew Henry Commentary on the Whole Bible, Volume ${volume}`,
    license: 'Public domain',
    url: `https://m.biblestudyguide.org/ebooks/comment/mhc${volume}.pdf`,
    file: `commentaries/matthew-henry/mhc${volume}.pdf`,
  })),
  ...Array.from({ length: 51 }, (_, index) => index + 13).map((volume) => ({
    group: 'sermons',
    id: `spurgeon-sermons-volume-${volume}`,
    title: `Spurgeon's Sermons Volume ${volume}`,
    license: 'Public domain text; CCEL package formatting may carry CCEL terms',
    url: `https://www.ccel.org/ccel/spurgeon/sermons${volume}/cache/sermons${volume}.txt`,
    file: `sermons/spurgeon/sermons${volume}.txt`,
  })),
]

async function main() {
  await fs.mkdir(corpusRoot, { recursive: true })

  const startedAt = new Date().toISOString()
  const manifest = {
    generatedAt: startedAt,
    policy:
      'This corpus intentionally downloads public-domain or openly licensed sources only. Modern copyrighted Bible translations and proprietary commentaries are excluded unless the project receives a license or source files from the rights holder.',
    sources: [],
    totals: {},
  }

  manifest.totals.translations = await downloadBibleTranslations()
  manifest.totals.maps = await downloadOpenBibleMaps()
  manifest.totals.resources = await downloadResources(manifest)

  manifest.finishedAt = new Date().toISOString()
  await writeJson(path.join(corpusRoot, 'manifest.json'), manifest)
  console.log(`Corpus ready at ${path.relative(projectRoot, corpusRoot)}`)
}

async function downloadBibleTranslations() {
  const translationsRoot = path.join(corpusRoot, 'bibles')
  const usfmRoot = path.join(translationsRoot, 'usfm')
  await fs.mkdir(translationsRoot, { recursive: true })
  await fs.mkdir(usfmRoot, { recursive: true })

  const translationIndex = []

  for (const biblePackage of EBIBLE_PACKAGES) {
    const translation = FREE_BIBLE_TRANSLATIONS.find((item) => item.id === biblePackage.translationId)
    const url = `https://ebible.org/Scriptures/${biblePackage.ebibleId}_usfm.zip`
    const file = `bibles/usfm/${biblePackage.translationId}_${biblePackage.ebibleId}_usfm.zip`
    const target = path.join(corpusRoot, file)

    console.log(`Downloading USFM Bible package: ${biblePackage.translationId}`)
    await downloadFile(url, target)
    const stat = await fs.stat(target)
    translationIndex.push({
      id: biblePackage.translationId,
      label: translation?.label || biblePackage.title,
      sourceTitle: biblePackage.title,
      language: translation?.language || 'Unknown',
      license: translation?.license || 'Redistributable by eBible.org listing',
      source: 'https://ebible.org/Scriptures/',
      ebibleId: biblePackage.ebibleId,
      format: 'USFM zip',
      bytes: stat.size,
      file,
    })
  }

  const missing = FREE_BIBLE_TRANSLATIONS
    .filter((translation) => !translationIndex.some((item) => item.id === translation.id))
    .map((translation) => ({
      id: translation.id,
      label: translation.label,
      reason: 'No matching redistributable eBible USFM package was found during this run.',
    }))

  await writeJson(path.join(translationsRoot, 'index.json'), translationIndex)
  return {
    packages: translationIndex.length,
    missing,
    source: 'https://ebible.org/Scriptures/',
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await worker(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

async function downloadOpenBibleMaps() {
  const mapsRoot = path.join(corpusRoot, 'maps', 'openbible-geocoding')
  const geometryRoot = path.join(mapsRoot, 'geometry')
  await fs.mkdir(geometryRoot, { recursive: true })

  const dataFiles = ['ancient.jsonl', 'modern.jsonl', 'geometry.jsonl', 'image.jsonl', 'source.jsonl']
  const geometryFiles = new Set()

  for (const file of dataFiles) {
    console.log(`Downloading map data: ${file}`)
    const text = await fetchText(`${OPENBIBLE_RAW}/data/${file}`)
    await writeFile(path.join(mapsRoot, file), text)

    if (file === 'ancient.jsonl' || file === 'modern.jsonl') {
      for (const line of text.split('\n')) {
        if (!line.trim()) continue
        const item = JSON.parse(line)
        for (const key of ['geojson_file', 'simplified_geojson_file', 'isobands_geojson_file']) {
          if (item[key]) geometryFiles.add(item[key])
        }
      }
    }
  }

  await downloadFile(`${OPENBIBLE_RAW}/all.kml`, path.join(mapsRoot, 'all.kml'))
  await downloadFile(`${OPENBIBLE_RAW}/license.txt`, path.join(mapsRoot, 'license.txt'))

  const geometryResults = await mapLimit([...geometryFiles], FILE_FETCH_CONCURRENCY, async (file) => {
    try {
      await downloadFile(`${OPENBIBLE_RAW}/geometry/${file}`, path.join(geometryRoot, file))
      return true
    } catch (error) {
      console.warn(`Skipped geometry ${file}: ${error.message}`)
      return false
    }
  })

  return {
    dataFiles: dataFiles.length + 2,
    geometryFiles: geometryResults.filter(Boolean).length,
    source: 'https://github.com/openbibleinfo/Bible-Geocoding-Data',
  }
}

async function downloadResources(manifest) {
  let count = 0

  for (const resource of RESOURCE_DOWNLOADS) {
    const target = path.join(corpusRoot, resource.file)
    console.log(`Downloading ${resource.group}: ${resource.title}`)
    await downloadFile(resource.url, target)
    const stat = await fs.stat(target)
    manifest.sources.push({ ...resource, bytes: stat.size })
    count += 1
  }

  await writeJson(path.join(corpusRoot, 'sources.json'), manifest.sources)
  return {
    files: count,
  }
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.text()
}

async function downloadFile(url, target) {
  if (await fileExists(target)) return

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, bytes)
}

async function writeJson(target, value) {
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeFile(target, value) {
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, value)
}

async function fileExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
