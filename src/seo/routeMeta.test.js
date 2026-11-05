import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  INDEXABLE_PATHS,
  buildHeadTags,
  buildHubJsonLd,
  buildPrerenderBody,
  buildRobotsTxt,
  buildSitemapXml,
  getIndexableRoutes,
  getRouteMeta,
} from './routeMeta.js'

test('indexable routes have unique titles, descriptions, and H1s', () => {
  const routes = getIndexableRoutes()
  assert.deepEqual(routes.map((route) => route.path), INDEXABLE_PATHS)
  assert.equal(new Set(routes.map((route) => route.title)).size, routes.length)
  assert.equal(new Set(routes.map((route) => route.description)).size, routes.length)
  assert.equal(new Set(routes.map((route) => route.h1)).size, routes.length)
})

test('unknown paths fall back to hub meta without inventing extra routes', () => {
  assert.equal(getRouteMeta('/does-not-exist').path, '/')
})

test('robots.txt and sitemap.xml list only the four crawlable product routes', () => {
  const robots = buildRobotsTxt()
  const sitemap = buildSitemapXml('2026-09-19')

  assert.match(robots, /^User-agent: \*\nAllow: \/\n\nSitemap: https:\/\/bibliosophia\.vercel\.app\/sitemap\.xml\n$/)
  assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/)
  for (const path of INDEXABLE_PATHS) {
    const loc = path === '/' ? 'https://bibliosophia.vercel.app/' : `https://bibliosophia.vercel.app${path}`
    assert.match(sitemap, new RegExp(`<loc>${loc}</loc>`))
  }
  assert.equal((sitemap.match(/<url>/g) || []).length, 4)
})

test('hub JSON-LD stays honest and matches visible FAQ questions', () => {
  const hub = getRouteMeta('/')
  const jsonLd = buildHubJsonLd(hub)
  const types = jsonLd['@graph'].map((node) => node['@type'])

  assert.ok(types.includes('WebSite'))
  assert.deepEqual(types[1], ['WebApplication', 'SoftwareApplication'])
  assert.equal(jsonLd['@graph'][2]['@type'], 'FAQPage')
  assert.deepEqual(
    jsonLd['@graph'][2].mainEntity.map((entity) => entity.name),
    hub.faqs.map((faq) => faq.question),
  )
  assert.ok(!JSON.stringify(jsonLd).includes('aggregateRating'))
})

test('prerender head and body emit crawlable title, H1, and FAQ text', () => {
  const reader = getRouteMeta('/reader')
  const head = buildHeadTags(reader)
  const body = buildPrerenderBody(reader)

  assert.match(head, /<title>KJV Reader with Concordance &amp; Commentary \| Bibliosophia<\/title>/)
  assert.match(head, /rel="canonical" href="https:\/\/bibliosophia.vercel.app\/reader"/)
  assert.doesNotMatch(head, /application\/ld\+json/)
  assert.match(body, /<h1>Read the KJV with study tools in one desk<\/h1>/)
  assert.match(body, /What study tools are in the Bibliosophia Reader\?/)
})
