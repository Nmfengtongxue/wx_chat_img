import { useLayoutEffect, useRef, useState } from 'react'
import { hashSeed, sketchRoundedRectPath } from '../../../utils/sketchPath'

const PAD_X = 16
const PAD_Y = 10
const STROKE = 2.5
const TAIL = 9

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
  const textRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 100, h: 40 })

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      setSize({
        w: Math.ceil(rect.width) + STROKE,
        h: Math.ceil(rect.height) + STROKE,
      })
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [content, fontFamily, fontSize, maxWidth])

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
  const svgLeft = side === 'left' ? -TAIL : 0

  return (
    <div className={`relative ${side === 'right' ? 'mr-1' : 'ml-1'}`} style={{ maxWidth }}>
      <div className="relative inline-block" style={{ marginLeft: side === 'left' ? TAIL : 0 }}>
        <svg
          className="absolute top-0 pointer-events-none"
          width={svgW}
          height={size.h + 6}
          viewBox={`${side === 'left' ? -TAIL : 0} 0 ${svgW} ${size.h + 4}`}
          style={{ left: svgLeft, overflow: 'visible' }}
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
        </svg>
        <div
          ref={textRef}
          className="relative z-10 inline-block text-black leading-snug whitespace-pre-wrap break-words"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            padding: `${PAD_Y}px ${PAD_X}px`,
            maxWidth,
          }}
        >
          {content || ' '}
        </div>
      </div>
    </div>
  )
}
