import { useEffect, useRef, useState } from 'react'
import { AvatarFrame, BubbleFrame } from './frames'
import { DOODLE_IPHONE } from '../../constants/doodleCanvas'
import { useDoodleStore } from '../../store/useDoodleStore'
import { ensureFontLoaded } from '../../utils/fonts'

interface DoodlePreviewProps {
  /** 与左侧编辑区对齐的视口高度 */
  viewportHeight: number
}

export function DoodlePreview({ viewportHeight }: DoodlePreviewProps) {
  const users = useDoodleStore((s) => s.users)
  const settings = useDoodleStore((s) => s.settings)
  const messages = useDoodleStore((s) => s.messages)
  const selectedId = useDoodleStore((s) => s.selectedMessageId)
  const selectMessage = useDoodleStore((s) => s.selectMessage)

  const contentRef = useRef<HTMLDivElement>(null)
  const [fontFamily, setFontFamily] = useState('"黄油溏心体", "PingFang SC", sans-serif')
  const [contentHeight, setContentHeight] = useState(0)

  const canvasWidth = DOODLE_IPHONE.width

  useEffect(() => {
    ensureFontLoaded(settings.font).then(setFontFamily)
  }, [settings.font])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setContentHeight(el.scrollHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [messages, settings, fontFamily, viewportHeight])

  const getUser = (userId: string) => users.find((u) => u.id === userId)

  const timeStr = `${settings.timeHour.padStart(2, '0')}${settings.timeSeparator}${settings.timeMinute.padStart(2, '0')}`
  const maxBubbleWidth = Math.floor(canvasWidth * 0.72 - settings.avatarSize - 24)
  const needsScroll = contentHeight > viewportHeight

  return (
    <div className="flex flex-col items-center h-full">
      <div
        className="relative bg-white shadow-lg overflow-hidden shrink-0"
        style={{ width: canvasWidth, height: viewportHeight }}
      >
        <div
          className={`h-full bg-white ${needsScroll ? 'overflow-y-auto overscroll-y-contain' : 'overflow-hidden'}`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* 预览区白底撑满视口；截图仅捕获内部 content 自然高度 */}
          <div className="min-h-full bg-white flex flex-col">
            <div
              ref={contentRef}
              data-screenshot-target
              className="bg-white"
              style={{
                width: canvasWidth,
                padding: '28px 16px 32px',
                boxSizing: 'border-box',
              }}
            >
              {settings.showTopTime && (
                <div
                  className="text-center mb-8 text-black tracking-wide"
                  style={{ fontFamily, fontSize: `${settings.bubbleFontSize + 2}px` }}
                >
                  {timeStr}
                </div>
              )}

              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p
                    className="text-center text-gray-400 py-16"
                    style={{ fontFamily, fontSize: '14px' }}
                  >
                    在左侧添加对话内容
                  </p>
                ) : (
                  messages.map((msg) => {
                    const user = getUser(msg.userId)
                    const side = user?.side ?? 'left'
                    const avatar = user?.avatar ?? ''

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 cursor-pointer rounded-lg transition-colors ${
                          side === 'right' ? 'flex-row-reverse' : 'flex-row'
                        } ${selectedId === msg.id ? 'ring-2 ring-emerald-400/70 ring-offset-2' : ''}`}
                        onClick={() => selectMessage(msg.id)}
                      >
                        <AvatarFrame
                          style={settings.avatarFrameStyle ?? 'sketch'}
                          url={avatar}
                          size={settings.avatarSize}
                          side={side}
                          seed={user?.id ?? side}
                        />
                        <BubbleFrame
                          style={settings.bubbleFrameStyle ?? 'sketch'}
                          content={msg.content}
                          side={side}
                          color={settings.bubbleColor}
                          fontFamily={fontFamily}
                          fontSize={settings.bubbleFontSize}
                          seed={msg.id}
                          maxWidth={maxBubbleWidth}
                        />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-3 text-center max-w-[390px] shrink-0">
        {canvasWidth}×{viewportHeight} 预览 · 黄油溏心体 ·{' '}
        {needsScroll ? '可滚动 · 导出长截图' : '内容自适应 · 导出贴合最后一行'}
      </p>
    </div>
  )
}
