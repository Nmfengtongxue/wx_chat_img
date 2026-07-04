import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { hashSeed, sketchRoundedRectPath } from '../../../utils/sketchPath'
import { SCREENSHOT_REMEASURE_EVENT } from '../../../utils/screenshotPrepare'

const PAD_X = 16
const PAD_Y = 10
const STROKE = 2.5
const TAIL = 9
const LINE_HEIGHT = 1.375

function measureBubbleSize(
  el: HTMLElement,
): { w: number; h: number } {
  return {
    w: Math.ceil(el.scrollWidth) + STROKE,
    h: Math.ceil(el.scrollHeight) + STROKE,
  }
}

export function SketchFrameBubble({
  content,
  side,
  color,
  fontFamily,
  fontSize,
  seed = 'bubble',
  maxWidth = 260,
}: {
  content: string
  side: 'left' | 'right'
  color: string
  fontFamily: string
  fontSize: number
  seed?: string
  maxWidth?: number
}) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 100, h: 40 })

  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${fontSize}px`,
    padding: `${PAD_Y}px ${PAD_X}px`,
    maxWidth: `${maxWidth}px`,
    lineHeight: LINE_HEIGHT,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    boxSizing: 'border-box',
    color: '#000',
  }

  const remeasure = useCallback(() => {
    const el = measureRef.current
    if (!el) return
    flushSync(() => {
      setSize(measureBubbleSize(el))
    })
  }, [])

  useLayoutEffect(() => {
    remeasure()
  }, [content, fontFamily, fontSize, maxWidth, remeasure])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver(remeasure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [remeasure])

  useEffect(() => {
    window.addEventListener(SCREENSHOT_REMEASURE_EVENT, remeasure)
    return () => window.removeEventListener(SCREENSHOT_REMEASURE_EVENT, remeasure)
  }, [remeasure])

  const pathSeed = hashSeed(`${seed}-${side}`)
  const bubblePath = sketchRoundedRectPath(size.w, size.h, pathSeed, {
    radius: Math.min(26, size.h * 0.42, size.w * 0.2),
    wobble: 3.2,
    segments: 34,
  })

  const tailMid = size.h * 0.36
  const tailPath =
    side === 'left'
      ? `M 1 ${tailMid} C ${-TAIL + 1} ${tailMid - 3} ${-TAIL - 1} ${tailMid + 5} ${0} ${tailMid + 11} L 7 ${tailMid + 2} Z`
      : `M ${size.w - 1} ${tailMid} C ${size.w + TAIL - 1} ${tailMid - 3} ${size.w + TAIL + 1} ${tailMid + 5} ${size.w} ${tailMid + 11} L ${size.w - 7} ${tailMid + 2} Z`

  const svgW = size.w + TAIL
  const svgH = size.h + 4
  const viewBox = side === 'left' ? `${-TAIL} 0 ${svgW} ${svgH}` : `0 0 ${svgW} ${svgH}`

  return (
    <div
      data-sketch-bubble
      className={`relative shrink-0 ${side === 'right' ? 'mr-1' : 'ml-1'}`}
      style={{ maxWidth }}
    >
      {/* 隐藏测量层：与 foreignObject 内文字样式完全一致 */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none absolute opacity-0"
        style={{
          ...textStyle,
          left: -10000,
          top: 0,
          width: 'max-content',
          maxWidth: `${maxWidth}px`,
        }}
      >
        {content || ' '}
      </div>

      <svg
        width={svgW}
        height={svgH}
        viewBox={viewBox}
        className="block overflow-visible"
        style={{ overflow: 'visible' }}
      >
        <path
          d={bubblePath}
          fill={color}
          stroke="#000"
          strokeWidth={STROKE}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={tailPath}
          fill={color}
          stroke="#000"
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        <foreignObject x={0} y={0} width={size.w} height={size.h}>
          <div
            style={{
              ...textStyle,
              width: `${size.w}px`,
              height: `${size.h}px`,
              margin: 0,
            }}
          >
            {content || ' '}
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}
