import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import AuthDialog from './components/AuthDialog'
import AuthGate from './components/AuthGate'
import ThemeDock from './components/ThemeDock'

const HomePage = lazy(() => import('./pages/HomePage'))
const MapReaderPage = lazy(() => import('./pages/MapReaderPage'))
const BibleReaderPage = lazy(() => import('./pages/BibleReaderPage'))

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
  const [authDialogFeature, setAuthDialogFeature] = useState('')

  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AmbientBackdrop />
          <ThemeDock />
          <Suspense fallback={<div className="route-loading">Loading Bibliosophia...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/map"
                element={(
                  <AuthGate featureName="Maps" onOpenAuth={() => setAuthDialogFeature('Maps')}>
                    <MapReaderPage />
                  </AuthGate>
                )}
              />
              <Route path="/reader" element={<BibleReaderPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {authDialogFeature ? (
            <AuthDialog featureName={authDialogFeature} onClose={() => setAuthDialogFeature('')} />
          ) : null}
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
