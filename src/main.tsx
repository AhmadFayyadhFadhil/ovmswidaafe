import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Render React immediately — do NOT block on MSW initialization
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Initialize MSW mock worker asynchronously (dev only, non-blocking)
if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
  import('./mocks/browser').then(({ worker }) => {
    worker.start({ onUnhandledRequest: 'bypass' })
  })
}

