import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { applyFontPreset, DEFAULT_FONT_PRESET, injectBundledFontFaces } from './utils/fonts'
import './index.css'
import App from './App.tsx'
import { AvatarEffectDemo } from './AvatarEffectDemo.tsx'

injectBundledFontFaces()
applyFontPreset(DEFAULT_FONT_PRESET).catch(() => {})

function Root() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onHash = () => setHash(location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const isEffectDemo = hash.startsWith('#/avatar-effects')
  return isEffectDemo ? <AvatarEffectDemo /> : <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
