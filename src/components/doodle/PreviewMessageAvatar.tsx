import { useCallback, useState } from 'react'
import type { DoodleFrameStyle } from '../../types/doodle'
import { AvatarFrame } from './frames'
import { resolveBurstForAvatar, hasAvatarBurstEffect } from '../../constants/avatarBurstMap'
import { useMultiTap } from '../../hooks/useMultiTap'
import type { AvatarBurstPreset } from '../../effects/types'

interface PreviewMessageAvatarProps {
  avatarUrl: string
  frameStyle: DoodleFrameStyle
  size: number
  side: 'left' | 'right'
  seed: string
  onBurst: (preset: AvatarBurstPreset) => void
}

export function PreviewMessageAvatar({
  avatarUrl,
  frameStyle,
  size,
  side,
  seed,
  onBurst,
}: PreviewMessageAvatarProps) {
  const [patting, setPatting] = useState(false)
  const [patHint, setPatHint] = useState<string | null>(null)
  const canPat = !!avatarUrl && hasAvatarBurstEffect(avatarUrl)

  const triggerPat = useCallback(() => {
    const resolved = resolveBurstForAvatar(avatarUrl)
    if (!resolved) return

    setPatting(true)
    setPatHint(resolved.patLabel)

    window.setTimeout(() => {
      setPatting(false)
      onBurst(resolved.preset)
      window.setTimeout(() => setPatHint(null), 1200)
    }, 480)
  }, [avatarUrl, onBurst])

  const { onClick, onTouchEnd } = useMultiTap(triggerPat)

  return (
    <div className="relative shrink-0">
      <div
        role="button"
        tabIndex={canPat ? 0 : undefined}
        aria-label={canPat ? '双击头像触发拍一拍特效' : '头像'}
        className={`relative touch-manipulation select-none outline-none ${
          canPat ? 'cursor-pointer' : ''
        } ${patting ? 'avatar-pat-bounce' : ''}`}
        onClick={canPat ? onClick : (e) => e.stopPropagation()}
        onTouchEnd={canPat ? onTouchEnd : undefined}
        onKeyDown={
          canPat
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  triggerPat()
                }
              }
            : undefined
        }
      >
        <AvatarFrame
          style={frameStyle}
          url={avatarUrl}
          size={size}
          side={side}
          seed={seed}
        />
        {canPat && !patting && (
          <span className="pointer-events-none absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover/row:opacity-100 sm:opacity-0">
            双击拍一拍
          </span>
        )}
      </div>

      {patHint && (
        <div
          className={`absolute z-10 pointer-events-none whitespace-nowrap pat-hint-float ${
            side === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ top: -8 }}
        >
          <span className="inline-block rounded-full bg-black/72 px-2.5 py-1 text-[11px] text-white shadow-md">
            {patHint}
          </span>
        </div>
      )}
    </div>
  )
}
