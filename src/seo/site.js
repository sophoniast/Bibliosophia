export const DEFAULT_SITE_ORIGIN = 'https://bibliosophia.vercel.app'

function readEnvValue(name) {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name]
  }

  const runtimeEnv = globalThis.process?.env
  return runtimeEnv?.[name] || ''
}

export function getSiteOrigin() {
  return String(readEnvValue('VITE_SITE_URL') || DEFAULT_SITE_ORIGIN).replace(/\/$/, '')
}

export function absoluteUrl(pathname = '/') {
  const origin = getSiteOrigin()
  if (!pathname || pathname === '/') return `${origin}/`
  return `${origin}${pathname.startsWith('/') ? pathname : `/${pathname}`}`
}
