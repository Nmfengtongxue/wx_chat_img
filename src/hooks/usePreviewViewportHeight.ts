import { useEffect, useState } from 'react'

const LG_BREAKPOINT = 1024

function mobilePreviewHeight() {
  const vh = window.innerHeight
  return Math.round(Math.min(Math.max(vh * 0.42, 360), 560))
}

/** 桌面端与编辑区等高；手机端使用视口比例固定高度 */
export function usePreviewViewportHeight(
  editorRef: React.RefObject<HTMLElement | null>,
  enabled = true,
) {
  const [height, setHeight] = useState(480)
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= LG_BREAKPOINT : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`)
    const onChange = () => setIsWide(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!enabled) return

    if (!isWide) {
      const update = () => setHeight(mobilePreviewHeight())
      update()
      window.addEventListener('resize', update)
      return () => window.removeEventListener('resize', update)
    }

    const el = editorRef.current
    if (!el) return

    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height)
      if (h > 0) setHeight(h)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [editorRef, enabled, isWide])

  return height
}
