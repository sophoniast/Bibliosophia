import esbuild from 'esbuild'
import fsSync from 'node:fs'
import fs from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.PORT || 5173)

const importMap = {
  imports: {
    '@supabase/supabase-js': 'https://esm.sh/@supabase/supabase-js@2.104.0',
    animejs: 'https://esm.sh/animejs@4.3.6',
    leaflet: 'https://esm.sh/leaflet@1.9.4',
    'lucide-react': 'https://esm.sh/lucide-react@1.8.0?deps=react@19.2.4',
    react: 'https://esm.sh/react@19.2.4',
    'react-dom/client': 'https://esm.sh/react-dom@19.2.4/client?deps=react@19.2.4',
    'react/jsx-dev-runtime': 'https://esm.sh/react@19.2.4/jsx-dev-runtime',
    'react/jsx-runtime': 'https://esm.sh/react@19.2.4/jsx-runtime',
    'react-router-dom': 'https://esm.sh/react-router-dom@7.14.1?deps=react@19.2.4,react-dom@19.2.4',
  },
}

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', `http://localhost:${port}`)
    const pathname = decodeURIComponent(requestUrl.pathname)

    if (pathname === '/' || pathname.endsWith('.html')) {
      const body = await renderIndex()
      response.writeHead(200, { 'content-type': mimeTypes['.html'] })
      response.end(request.method === 'HEAD' ? undefined : body)
      return
    }

    if (pathname.startsWith('/src/')) {
      const file = await resolveModuleFile(pathname)
      if (!file) return notFound(response)
      const body = await transformModule(file)
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
      response.end(request.method === 'HEAD' ? undefined : body)
      return
    }

    const file = await resolveStaticFile(pathname)
    if (!file) {
      const body = await renderIndex()
      response.writeHead(200, { 'content-type': mimeTypes['.html'] })
      response.end(request.method === 'HEAD' ? undefined : body)
      return
    }

    const ext = path.extname(file)
    const body = request.method === 'HEAD' ? undefined : await fs.readFile(file)
    response.writeHead(200, { 'content-type': mimeTypes[ext] || 'application/octet-stream' })
    response.end(body)
  } catch (error) {
    if (response.headersSent) {
      response.end()
      return
    }

    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    response.end(request.method === 'HEAD' ? undefined : error.stack || String(error))
  }
})

server.listen(port, () => {
  console.log(`Local dev server ready: http://localhost:${port}/`)
})

async function renderIndex() {
  const html = await fs.readFile(path.join(root, 'index.html'), 'utf8')
  return html.replace(
    /<script\s+type="module"\s+src="\/src\/main\.jsx"><\/script>/,
    `<script type="importmap">${JSON.stringify(importMap)}</script>\n    <link rel="stylesheet" href="/src/index.css">\n    <script type="module" src="/src/main.jsx"></script>`,
  )
}

async function transformModule(file) {
  let source = await fs.readFile(file, 'utf8')

  if (file.endsWith('/src/fonts.js')) return ''

  source = source
    .replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm, '')
    .replace(/^import\s+['"]\.\/fonts\.js['"];?\s*$/gm, '')
    .replace(/import\.meta\.env\.([A-Z0-9_]+)/g, (_, name) => JSON.stringify(process.env[name] || ''))

  source = rewriteLocalSpecifiers(source, file)

  const result = await esbuild.transform(source, {
    format: 'esm',
    jsx: 'automatic',
    loader: file.endsWith('.jsx') ? 'jsx' : 'js',
    sourcemap: 'inline',
    target: 'es2022',
  })

  return result.code
}

function rewriteLocalSpecifiers(source, file) {
  return source
    .replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (_match, prefix, specifier, suffix) => {
      return `${prefix}${resolveModuleSpecifier(file, specifier)}${suffix}`
    })
    .replace(/(import\(\s*)(['"])(\.{1,2}\/[^'"]+)(['"])(\s*\))/g, (_match, prefix, quote, specifier, endQuote, suffix) => {
      return `${prefix}${quote}${resolveModuleSpecifier(file, specifier)}${endQuote}${suffix}`
    })
}

function resolveModuleSpecifier(file, specifier) {
  if (path.extname(specifier)) return specifier

  const basedir = path.dirname(file)
  const candidates = ['.js', '.jsx', '/index.js', '/index.jsx']

  for (const ext of candidates) {
    const candidate = path.resolve(basedir, `${specifier}${ext}`)
    if (candidate.startsWith(path.join(root, 'src'))) {
      try {
        return fsStatSync(candidate) ? `${specifier}${ext}` : specifier
      } catch {
        // Try the next extension.
      }
    }
  }

  return specifier
}

function fsStatSync(file) {
  try {
    return Boolean(fsSync.statSync(file).isFile())
  } catch {
    return false
  }
}

async function resolveStaticFile(pathname) {
  const candidate = safeJoin(root, pathname)
  const publicCandidate = safeJoin(path.join(root, 'public'), pathname)

  for (const file of [candidate, publicCandidate]) {
    if (!file) continue
    try {
      const stat = await fs.stat(file)
      if (stat.isFile()) return file
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

async function resolveModuleFile(pathname) {
  const base = safeJoin(root, pathname)
  if (!base) return null

  const candidates = path.extname(base)
    ? [base]
    : [`${base}.js`, `${base}.jsx`, path.join(base, 'index.js'), path.join(base, 'index.jsx')]

  for (const file of candidates) {
    try {
      const stat = await fs.stat(file)
      if (stat.isFile() && file.startsWith(path.join(root, 'src'))) return file
    } catch {
      // Try the next candidate.
    }
  }

  return null
}

function safeJoin(base, pathname) {
  const resolved = path.resolve(base, pathname.replace(/^\/+/, ''))
  return resolved.startsWith(base) ? resolved : null
}

function notFound(response) {
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  response.end(response.req?.method === 'HEAD' ? undefined : 'Not found')
}
