import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildHeadTags,
  buildPrerenderBody,
  buildRobotsTxt,
  buildSitemapXml,
  getIndexableRoutes,
} from '../src/seo/routeMeta.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')

function injectRouteHtml(template, route) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, '')

  if (!html.includes('</head>')) {
    throw new Error('Built index.html is missing </head>')
  }

  html = html.replace('</head>', `    ${buildHeadTags(route)}\n  </head>`)
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${buildPrerenderBody(route)}</div>`,
  )

  if (!html.includes('id="root"')) {
    throw new Error('Built index.html is missing <div id="root">')
  }

  return html
}

async function writeRouteHtml(template, route) {
  const html = injectRouteHtml(template, route)
  const outputDir = route.path === '/'
    ? distDir
    : path.join(distDir, route.path.replace(/^\//, ''))

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html)
  return outputDir
}

async function main() {
  const templatePath = path.join(distDir, 'index.html')
  const template = await fs.readFile(templatePath, 'utf8')
  const routes = getIndexableRoutes()

  for (const route of routes) {
    await writeRouteHtml(template, route)
    console.log(`Prerendered ${route.path === '/' ? '/' : route.path}`)
  }

  await fs.writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt())
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml())
  console.log('Wrote robots.txt and sitemap.xml')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
