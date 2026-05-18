import { MoonStar, Palette, SunMedium } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

function ThemeDock() {
  const {
    activeTheme,
    isPanelOpen,
    mode,
    setThemeName,
    themes,
    toggleMode,
    togglePanel,
  } = useTheme()

  return (
    <div className="theme-dock">
      {isPanelOpen ? (
        <div className="theme-dock-panel glass-panel">
          {themes.map((theme) => {
            const palette = theme[mode]
            const isActive = activeTheme.id === theme.id

            return (
              <button
                key={theme.id}
                aria-label={theme.name}
                className={`theme-swatch${isActive ? ' active' : ''}`}
                onClick={() => setThemeName(theme.id)}
                style={{
                  background: `linear-gradient(135deg, ${palette.bg}, ${palette.accent})`,
                }}
                title={`${theme.name} — ${theme.description}`}
                type="button"
              />
            )
          })}
        </div>
      ) : null}
      <div className="theme-dock-controls glass-panel">
        <button
          aria-label="Toggle theme palette"
          className="theme-icon-button"
          onClick={togglePanel}
          type="button"
        >
          <Palette size={18} />
        </button>
        <button
          aria-label="Toggle day and night mode"
          className="theme-icon-button"
          onClick={toggleMode}
          type="button"
        >
          {mode === 'night' ? <SunMedium size={18} /> : <MoonStar size={18} />}
        </button>
      </div>
    </div>
  )
}

export default ThemeDock
