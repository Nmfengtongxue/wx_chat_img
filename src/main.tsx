import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applyFontPreset, DEFAULT_FONT_PRESET } from './utils/fonts'
import './index.css'
import App from './App.tsx'

applyFontPreset(DEFAULT_FONT_PRESET).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
