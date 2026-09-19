import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PRERENDERED_PREVIEWS = {
  '/reader': 'reader.html',
  '/map': 'map.html',
  '/scribe': 'scribe.html',
}

function prerenderedRoutePreview() {
  return {
    name: 'prerendered-route-preview',
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url?.split('?')[0] || ''
        const fileName = PRERENDERED_PREVIEWS[url]
        if (!fileName) {
          next()
          return
        }

        const file = path.resolve(server.config.root, server.config.build.outDir, fileName)
        if (!fs.existsSync(file)) {
          next()
          return
        }

        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        fs.createReadStream(file).pipe(response)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderedRoutePreview()],
  server: {
    watch: {
      ignored: ['**/data/corpus/**'],
    },
  },
})
