import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeHtml, getIndexableRoutes } from '../src/seo/routeMeta.js'

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')

function htmlPathFor(routePath) {
  return routePath === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, routePath.replace(/^\//, ''), 'index.html')
}

async function main() {
  const routes = getIndexableRoutes()
  const titles = new Set()
  const descriptions = new Set()

  for (const route of routes) {
    const file = htmlPathFor(route.path)
    const html = await fs.readFile(file, 'utf8')

    assert.match(html, new RegExp(`<title>${escapeRegExp(escapeHtml(route.title))}</title>`))
    assert.match(html, new RegExp(`name="description" content="${escapeRegExp(escapeHtml(route.description))}"`))
    assert.match(html, new RegExp(`rel="canonical" href="${escapeRegExp(escapeHtml(`https://bibliosophia.vercel.app${route.path === '/' ? '/' : route.path}`))}"`))
    assert.match(html, /property="og:title"/)
    assert.match(html, /name="twitter:card" content="summary_large_image"/)
    assert.match(html, new RegExp(`<h1>${escapeRegExp(escapeHtml(route.h1))}</h1>`))
    assert.match(html, /<div id="root">[\s\S]+<\/div>/)
    assert.doesNotMatch(html, /<div id="root"><\/div>/)
    assert.match(html, /<section class="seo-faq"/)

    if (route.path === '/') {
      assert.match(html, /application\/ld\+json/)
      assert.match(html, /WebApplication/)
      assert.match(html, /FAQPage/)
    }

    titles.add(route.title)
    descriptions.add(route.description)
  }

  assert.equal(titles.size, routes.length, 'each route needs a unique title')
  assert.equal(descriptions.size, routes.length, 'each route needs a unique description')

  const robots = await fs.readFile(path.join(distDir, 'robots.txt'), 'utf8')
  assert.match(robots, /User-agent: \*/)
  assert.match(robots, /Sitemap: https:\/\/bibliosophia\.vercel\.app\/sitemap\.xml/)
  assert.doesNotMatch(robots, /<div id="root">/)

  const sitemap = await fs.readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
  assert.match(sitemap, /<urlset/)
  for (const route of routes) {
    const loc = `https://bibliosophia.vercel.app${route.path === '/' ? '/' : route.path}`
    assert.match(sitemap, new RegExp(`<loc>${escapeRegExp(loc)}</loc>`))
  }
  assert.doesNotMatch(sitemap, /<div id="root">/)

  console.log(`Verified prerender output for ${routes.length} routes, robots.txt, and sitemap.xml`)
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
