import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { ensureGoogleFontsLoaded, DEFAULT_GOOGLE_FONT } from './utils/googleFonts'

ensureGoogleFontsLoaded([DEFAULT_GOOGLE_FONT]).catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
