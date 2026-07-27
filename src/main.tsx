import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global handler for stale build chunk errors after new deployments
window.addEventListener('error', (event) => {
  if (
    event.message?.includes("Unexpected token '<'") ||
    event.message?.includes('Loading chunk') ||
    event.message?.includes('dynamically imported module')
  ) {
    const lastReload = sessionStorage.getItem('ovms_chunk_reload');
    if (!lastReload || Date.now() - Number(lastReload) > 10000) {
      sessionStorage.setItem('ovms_chunk_reload', String(Date.now()));
      window.location.reload();
    }
  }
});

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

