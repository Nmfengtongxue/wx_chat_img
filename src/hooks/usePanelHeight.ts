import { useEffect, useState } from 'react'

/** 监听左侧编辑区高度，供右侧预览视口同步 */
export function usePanelHeight(ref: React.RefObject<HTMLElement | null>, enabled = true) {
  const [height, setHeight] = useState(640)

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
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
  }, [ref, enabled])

  return height
}
