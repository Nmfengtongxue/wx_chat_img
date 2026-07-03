import { useEffect, useRef, useState } from 'react'
import { AvatarBurstEngine, loadImage } from '../../effects/avatarBurstEngine'
import type { AvatarBurstPreset } from '../../effects/types'

interface Props {
  preset: AvatarBurstPreset
  active: boolean
  onClose: () => void
  /** 微信聊天消息区容器，动效仅铺满此区域 */
  stageRef: React.RefObject<HTMLElement | null>
}

export function AvatarBurstOverlay({ preset, active, onClose, stageRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<AvatarBurstEngine | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    loadImage(preset.avatarSrc)
      .then((img) => {
        if (cancelled || !canvasRef.current || !stageRef.current) return
        engineRef.current?.stop()
        engineRef.current = new AvatarBurstEngine(
          canvasRef.current,
          preset,
          img,
          stageRef.current,
        )
        setReady(true)
      })
      .catch(() => setReady(false))
    return () => {
      cancelled = true
      engineRef.current?.stop()
    }
  }, [preset, stageRef])

  useEffect(() => {
    const engine = engineRef.current
    const stage = stageRef.current
    if (!active || !ready || !engine || !stage) return

    engine.start()
    const ro = new ResizeObserver(() => engine.resize())
    ro.observe(stage)
    return () => {
      ro.disconnect()
      engine.stop()
    }
  }, [active, ready, stageRef])

  if (!active) return null

  return (
    <div
      className="absolute inset-0 z-30 touch-none select-none overflow-hidden"
      role="dialog"
      aria-label={`${preset.name} 聊天区特效`}
      onClick={onClose}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 pt-4 pb-2 bg-gradient-to-t from-black/25 to-transparent pointer-events-none">
        <p className="text-center text-white/90 text-[11px] px-2 drop-shadow">
          {preset.name}
        </p>
        <p className="text-center text-white/70 text-[10px] mt-0.5">点击关闭</p>
      </div>
    </div>
  )
}
