import { useCallback, useRef } from 'react'

interface Options {
  /** 触发所需连续点击次数，默认 2 */
  count?: number
  /** 两次点击最大间隔 ms */
  interval?: number
}

/**
 * 检测连续点击（拍一拍：双击头像区域）
 * 返回 attach 到目标元素的 handler，会自动 stopPropagation
 */
export function useMultiTap(onTrigger: () => void, options: Options = {}) {
  const required = options.count ?? 2
  const interval = options.interval ?? 420
  const tapsRef = useRef({ n: 0, t: 0 })
  const lastTouchRef = useRef(0)

  const registerTap = useCallback(() => {
    const now = Date.now()
    const taps = tapsRef.current
    if (now - taps.t > interval) taps.n = 1
    else taps.n += 1
    taps.t = now
    if (taps.n >= required) {
      taps.n = 0
      onTrigger()
    }
  }, [onTrigger, required, interval])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      e.preventDefault()
      lastTouchRef.current = Date.now()
      registerTap()
    },
    [registerTap],
  )

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (Date.now() - lastTouchRef.current < 500) return
      registerTap()
    },
    [registerTap],
  )

  return { onClick, onTouchEnd }
}
