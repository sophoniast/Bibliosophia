import { absoluteUrl, getSiteOrigin } from './site.js'

export const INDEXABLE_PATHS = ['/', '/reader', '/map', '/scribe']

export const ROUTE_META = {
  '/': {
    path: '/',
    title: 'Bibliosophia | Bible Study — Read, Map & AI Scribe',
    description:
      'Sacred Glass Architecture for Scripture: KJV reader (concordance, commentary, notes, AI Exegete), biblical map, and AI Scribe. Open Read, Map, or Scribe.',
    h1: 'Bibliosophia — Bible study in Sacred Glass Architecture',
    eyebrow: 'Sacred Glass Architecture',
    intro: [
      'Bibliosophia is a web study desk that keeps three first-class surfaces together: a King James reader with study tools, a Geospatial Viewer / Cartography Engine, and AI Scribe exegesis chat.',
      'It is built for lay readers, small-group leaders, and students who want text, geography, and careful questions in one glass interface — not a reading-plan community app, and not a paid library suite.',
    ],
    links: [
      { href: '/reader', label: 'Open the Reader' },
      { href: '/map', label: 'Explore the Map' },
      { href: '/scribe', label: 'Ask the Scribe' },
    ],
    faqs: [
      {
        question: 'What is Bibliosophia?',
        answer:
          'Bibliosophia is a web biblical study platform combining a KJV reader (with dictionary, concordance, commentaries, notes, and AI Exegete), an interactive biblical map (Geospatial Viewer / Cartography Engine), and an AI Scribe exegesis chat. The three surfaces share one Sacred Glass interface so reading, geography, and questions stay in the same study ritual.',
      },
      {
        question: 'Is Bibliosophia a Bible app or a website?',
        answer:
          'It is a web platform. Use it in the browser on the Hub, Read, Map, and Scribe routes. This version is not published as a separate installable mobile app.',
      },
      {
        question: 'How is this different from YouVersion or Blue Letter Bible?',
        answer:
          'YouVersion emphasizes reading plans and community. Blue Letter Bible emphasizes free lexicon and commentary depth. Bibliosophia emphasizes the triad of a KJV study desk, a geospatial biblical map, and AI Scribe in one glass UI rather than splitting those tasks across separate products.',
      },
      {
        question: 'Does it use the King James Version?',
        answer:
          'Yes. The Reader defaults to the King James Version and is built around KJV study with dictionary, concordance, commentaries, notes, and AI Exegete. Other public-domain translations are also available in the Reader menu.',
      },
      {
        question: 'Can AI replace careful exegesis?',
        answer:
          'No. AI Scribe and AI Exegete are study partners for questions and observations. Readers should verify claims against the biblical text and trusted sources, and keep pastoral and personal discernment.',
      },
      {
        question: 'Is there a map of biblical places?',
        answer:
          'Yes. The Map route is a Cartography Engine / Geospatial Viewer for Holy Land and biblical geography study, including journeys and places related to Scripture. Many ancient sites are not located with equal certainty, so treat the atlas as a study aid.',
      },
    ],
    jsonLd: 'hub',
    ogImage: '/og/hub.svg',
  },
  '/reader': {
    path: '/reader',
    title: 'KJV Reader with Concordance & Commentary | Bibliosophia',
    description:
      'Study the King James Bible with dictionary, concordance, commentaries, notes, and AI Exegete — then jump to Map or Scribe.',
    h1: 'Read the KJV with study tools in one desk',
    eyebrow: 'Read',
    intro: [
      'The Bibliosophia Reader keeps King James text beside dictionary, concordance, commentaries, personal notes, word analysis, and AI Exegete.',
      'Open a passage, select a word or verse, and stay on one glass desk — then use the app menu to open Map or Scribe.',
    ],
    links: [
      { href: '/', label: 'Return to Hub' },
      { href: '/map', label: 'Open the Map' },
      { href: '/scribe', label: 'Ask the Scribe' },
    ],
    faqs: [
      {
        question: 'What study tools are in the Bibliosophia Reader?',
        answer:
          'The Reader places KJV text beside dictionary and concordance entries, commentaries (passage notes and cross-references), personal notes, word analysis, and AI Exegete. Select a word or verse to open those tools without leaving the desk.',
      },
      {
        question: 'Can I do a concordance word study?',
        answer:
          'Yes. Select a word in the passage to open dictionary and concordance listings with related occurrences. Word Analysis can show lemma, transliteration, and Strong’s-style identifiers when the lexicon has them.',
      },
      {
        question: 'Does Bibliosophia include Bible commentaries?',
        answer:
          'Yes. The Commentaries panel shows passage notes and cross-references for the open reading. It does not claim a named commercial commentary library.',
      },
      {
        question: 'What is AI Exegete?',
        answer:
          'AI Exegete is an in-reader chat aid for exegetical questions about the passage you are viewing. Treat its answers as hypotheses and verify them against the text, concordance, and commentaries.',
      },
      {
        question: 'Is this only KJV?',
        answer:
          'The Reader is KJV-focused and opens in the King James Version by default. Other public-domain translations are available from the translation menu.',
      },
      {
        question: 'How do I keep personal notes?',
        answer:
          'Use the My Notes tab in Study Studio to write observations beside the passage and save them. Notes persist locally in the browser, and on the server when Supabase is configured.',
      },
    ],
    ogImage: '/og/reader.svg',
  },
  '/map': {
    path: '/map',
    title: 'Interactive Bible Map | Bibliosophia Cartography Engine',
    description:
      'Explore Holy Land and biblical geography in Bibliosophia’s Geospatial Viewer — then open the KJV Reader or AI Scribe from the same study desk.',
    h1: 'Explore Scripture’s geography — Bibliosophia Map',
    eyebrow: 'Map',
    intro: [
      'The Map is Bibliosophia’s Geospatial Viewer / Cartography Engine: an interactive atlas for Holy Land and biblical geography, including journeys and waypoints.',
      'Use it as a geography aid while you study, then open the KJV Reader or AI Scribe from the same product. Many ancient sites are traditional or debated, so pins are study aids rather than certainty claims.',
    ],
    links: [
      { href: '/', label: 'Return to Hub' },
      { href: '/reader', label: 'Open the Reader' },
      { href: '/scribe', label: 'Ask the Scribe' },
    ],
    faqs: [
      {
        question: 'What is Bibliosophia’s biblical map?',
        answer:
          'It is an interactive Geospatial Viewer / Cartography Engine for studying places and journeys related to Scripture inside the same Bibliosophia desk as the Reader and Scribe.',
      },
      {
        question: 'Can I study the Holy Land on an interactive map?',
        answer:
          'Yes. Open the Map route to browse biblical geography, journey waypoints, and related regions visually.',
      },
      {
        question: 'How do Bible maps help study?',
        answer:
          'Place, distance, and terrain clarify narratives such as journeys, borders, and cities. Seeing a route on the atlas can change how you picture movement in a passage before you return to the text.',
      },
      {
        question: 'Does every biblical place have a sure modern location?',
        answer:
          'No. Many sites are traditional or debated. Use the map as a geography aid, not as a claim that every pin is archaeologically certain.',
      },
      {
        question: 'Is this only a map, or part of a study platform?',
        answer:
          'The Map is one surface of Bibliosophia. Use the app menu to open the KJV Reader or AI Scribe in the same product.',
      },
    ],
    ogImage: '/og/map.svg',
  },
  '/scribe': {
    path: '/scribe',
    title: 'AI Scribe Exegesis Chat | Bibliosophia Bible Study',
    description:
      'Ask AI Scribe for exegesis help beside Bibliosophia’s KJV tools and map. Use as a study partner; always verify against Scripture.',
    h1: 'AI Scribe — exegesis chat for careful Bible study',
    eyebrow: 'Scribe',
    intro: [
      'AI Scribe is Bibliosophia’s conversational exegesis surface. Ask about a word, verse, theme, or place, then verify the answer in the KJV Reader and, when geography matters, on the Map.',
      'Scribe is a study partner and research accelerator — not a final authority, and not a replacement for pastors, tradition, or careful reading.',
    ],
    links: [
      { href: '/', label: 'Return to Hub' },
      { href: '/reader', label: 'Verify in the Reader' },
      { href: '/map', label: 'Open the Map' },
    ],
    faqs: [
      {
        question: 'What is AI exegesis?',
        answer:
          'AI exegesis is using AI to assist interpretation tasks such as context, word senses, cross-links, and study questions, while humans remain responsible for meaning and teaching.',
      },
      {
        question: 'What is Bibliosophia’s AI Scribe?',
        answer:
          'AI Scribe is the exegesis-oriented chat surface in the Bibliosophia platform. It sits next to the KJV Reader and biblical map rather than as a standalone chatbot.',
      },
      {
        question: 'Can AI replace pastors or the Holy Spirit in study?',
        answer:
          'No. Scribe is an assistant for research and clarity. Discernment, teaching, and spiritual authority remain with readers, pastors, and their traditions.',
      },
      {
        question: 'How should I verify AI answers about the Bible?',
        answer:
          'Open the cited or nearby verses in the Reader, compare the commentaries and concordance tools, and treat uncertain claims as hypotheses rather than conclusions.',
      },
      {
        question: 'How is this different from ChatGPT for Bible questions?',
        answer:
          'Scribe lives inside Bibliosophia next to a KJV study desk and biblical map, so you can move from a chat answer to the text and geography tools in the same product.',
      },
      {
        question: 'Is AI Bible study allowed for Christians?',
        answer:
          'Many Christians use study aids, including digital tools, with wisdom and discernment. Scribe is meant to accelerate questions, not to replace Scripture, church, or careful reading.',
      },
      {
        question: 'Can Scribe help with sermon or lesson prep?',
        answer:
          'Yes, as a research accelerator for questions, outlines, and study prompts. It does not replace exegesis, pastoral judgment, or verification against the text.',
      },
    ],
    ogImage: '/og/scribe.svg',
  },
}

export function normalizePathname(pathname = '/') {
  if (!pathname || pathname === '/') return '/'
  const trimmed = pathname.replace(/\/+$/, '')
  return trimmed || '/'
}

export function getRouteMeta(pathname) {
  return ROUTE_META[normalizePathname(pathname)] || ROUTE_META['/']
}

export function getIndexableRoutes() {
  return INDEXABLE_PATHS.map((path) => ROUTE_META[path])
}

export function canonicalUrl(pathname) {
  return absoluteUrl(normalizePathname(pathname))
}

export function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${absoluteUrl('/sitemap.xml')}`,
    '',
  ].join('\n')
}

export function buildSitemapXml(lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = getIndexableRoutes()
    .map((route) => {
      const loc = canonicalUrl(route.path)
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n  </url>`
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')
}

export function buildHubJsonLd(route = ROUTE_META['/']) {
  const origin = getSiteOrigin()

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Bibliosophia',
        url: `${origin}/`,
        description: route.description,
      },
      {
        '@type': ['WebApplication', 'SoftwareApplication'],
        name: 'Bibliosophia',
        url: `${origin}/`,
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        featureList: [
          'KJV Bible reader with dictionary, concordance, commentaries, notes, and AI Exegete',
          'Geospatial Viewer / Cartography Engine for biblical maps',
          'AI Scribe exegesis chat',
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: route.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  }
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function escapeXml(value) {
  return escapeHtml(value)
}

export function buildHeadTags(route) {
  const url = canonicalUrl(route.path)
  const image = absoluteUrl(route.ogImage)
  const tags = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Bibliosophia" />',
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
  ]

  if (route.jsonLd === 'hub') {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(buildHubJsonLd(route)).replaceAll('<', '\\u003c')}</script>`,
    )
  }

  return tags.join('\n    ')
}

export function buildPrerenderBody(route) {
  const links = route.links
    .map((link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`)
    .join('')

  const faqs = route.faqs
    .map(
      (faq) => `
        <div class="seo-faq-item">
          <h3>${escapeHtml(faq.question)}</h3>
          <p>${escapeHtml(faq.answer)}</p>
        </div>`,
    )
    .join('')

  const intro = route.intro.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')

  return `
    <main class="seo-prerender" data-seo-path="${escapeHtml(route.path)}">
      <p class="seo-eyebrow">${escapeHtml(route.eyebrow)}</p>
      <h1>${escapeHtml(route.h1)}</h1>
      ${intro}
      <nav class="seo-links" aria-label="Bibliosophia routes">${links}</nav>
      <section class="seo-faq" aria-labelledby="seo-faq-heading">
        <h2 id="seo-faq-heading">FAQ</h2>
        ${faqs}
      </section>
    </main>`
}
