/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getPreferences, savePreferences } from '../lib/api'
import { DEFAULT_MODE, DEFAULT_THEME, THEMES } from '../data/themes'

const ThemeContext = createContext(null)

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(DEFAULT_THEME)
  const [mode, setMode] = useState(DEFAULT_MODE)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false)

  const activeTheme =
    THEMES.find((theme) => theme.id === themeName) ||
    THEMES.find((theme) => theme.id === DEFAULT_THEME) ||
    THEMES[0]

  const palette = activeTheme[mode]

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--c-bg', hexToRgb(palette.bg))
    root.style.setProperty('--c-surface', hexToRgb(palette.surface))
    root.style.setProperty('--c-surface-alt', hexToRgb(palette.surfaceAlt))
    root.style.setProperty('--c-text', hexToRgb(palette.text))
    root.style.setProperty('--c-text-muted', hexToRgb(palette.textMuted))
    root.style.setProperty('--c-accent', hexToRgb(palette.accent))
    root.style.setProperty('--c-line', mode === 'night' ? '255 255 255' : '17 24 39')
    root.style.setProperty('--f-display', activeTheme.fonts.display)
    root.style.setProperty('--f-serif', activeTheme.fonts.serif)
    root.style.setProperty('--f-sans', activeTheme.fonts.sans)
    root.style.setProperty('--f-mono', activeTheme.fonts.mono)
    root.dataset.theme = activeTheme.id
    root.dataset.mode = mode
    document.body.style.backgroundColor = `rgb(${hexToRgb(palette.bg)})`
  }, [activeTheme, mode, palette])

  useEffect(() => {
    let isCancelled = false

    getPreferences()
      .then((preferences) => {
        if (isCancelled) return
        setThemeName(preferences.themeName || DEFAULT_THEME)
        setMode(preferences.mode || DEFAULT_MODE)
        setHasLoadedPreferences(true)
      })
      .catch(() => {
        if (isCancelled) return
        setHasLoadedPreferences(true)
      })

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasLoadedPreferences) return

    savePreferences({ themeName, mode }).catch(() => {})
  }, [hasLoadedPreferences, mode, themeName])

  const value = useMemo(
    () => ({
      activeTheme,
      isPanelOpen,
      mode,
      palette,
      setThemeName,
      themeName,
      themes: THEMES,
      toggleMode: () => setMode((current) => (current === 'night' ? 'day' : 'night')),
      togglePanel: () => setIsPanelOpen((current) => !current),
    }),
    [activeTheme, isPanelOpen, mode, palette, themeName],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
