import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Fontes locais (§5.4) — empacotadas no app, nada de CDN: o Horas funciona
   sem internet. */
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'
import '@fontsource/source-serif-4/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'

import { App } from './App'
import { initStore } from './store/store'

initStore().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
