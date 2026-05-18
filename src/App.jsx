import { Suspense, lazy, useState } from 'react'
import { Archive, BookOpenText, Compass, Home, Menu, PenLine, X } from 'lucide-react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ThemeDock from './components/ThemeDock'

const HomePage = lazy(() => import('./pages/HomePage'))
const MapReaderPage = lazy(() => import('./pages/MapReaderPage'))
const BibleReaderPage = lazy(() => import('./pages/BibleReaderPage'))

const appNavItems = [
  { to: '/', label: 'Hub', shortLabel: 'Hub', icon: Home },
  { to: '/reader', label: 'Read', shortLabel: 'Read', icon: BookOpenText },
  { to: '/map', label: 'Map', shortLabel: 'Map', icon: Compass },
  { to: '/scribe', label: 'Scribe', shortLabel: 'Scribe', icon: PenLine },
  { to: '/archive', label: 'Archive', shortLabel: 'Archive', icon: Archive },
]

function AppMenu() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const activeItem = appNavItems.find((item) => (
    item.to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.to)
  )) || appNavItems[0]

  return (
    <div className={`app-menu ${isOpen ? 'open' : ''}`}>
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close app menu' : 'Open app menu'}
        className="app-menu-trigger"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
        <span>{activeItem.shortLabel}</span>
      </button>
      <nav aria-label="App sections" className="app-menu-panel">
        {appNavItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => `app-menu-link${isActive ? ' active' : ''}`}
            onClick={() => setIsOpen(false)}
            to={item.to}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function AmbientBackdrop() {
  return (
    <>
      <div className="ambient-backdrop" aria-hidden="true">
        <div className="ambient-blob ambient-blob-one" />
        <div className="ambient-blob ambient-blob-two" />
        <div className="ambient-blob ambient-blob-three" />
      </div>
      <div className="ambient-art" aria-hidden="true" />
      <div className="ambient-vignette" aria-hidden="true" />
      <div className="ambient-grain" aria-hidden="true" />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AmbientBackdrop />
          <AppMenu />
          <ThemeDock />
          <Suspense fallback={<div className="route-loading">Loading Bibliosophia...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/scribe" element={<HomePage initialModule="mod-scribe" />} />
              <Route path="/archive" element={<HomePage initialModule="mod-data" />} />
              <Route path="/map" element={<MapReaderPage />} />
              <Route path="/reader" element={<BibleReaderPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
