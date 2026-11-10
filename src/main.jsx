import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import './motion.css'
import './extra.css'
import './chat.css'
import App from './App.jsx'
import { applyTheme, getTheme } from './utils'

applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)

// Appli installable + cache hors-ligne (en production uniquement)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}))
}
