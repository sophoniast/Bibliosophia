import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.js'
import './index.css'
import App from './App.jsx'

const root = document.getElementById('root')

// Build-time prerender writes crawlable HTML into #root. createRoot replaces
// that shell with the interactive app after JS loads (pages are lazy and not
// SSR-safe). Visible SeoLanding copy stays in the React tree so FAQ/schema match.
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
