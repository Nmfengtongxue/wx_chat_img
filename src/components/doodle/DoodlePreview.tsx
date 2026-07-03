import { useEffect, useRef, useState } from 'react'
import { AvatarFrame, BubbleFrame } from './frames'
import { DOODLE_IPHONE } from '../../constants/doodleCanvas'
import { useDoodleStore } from '../../store/useDoodleStore'
import { ensureFontLoaded } from '../../utils/fonts'

export function DoodlePreview() {
  const users = useDoodleStore((s) => s.users)
  const settings = useDoodleStore((s) => s.settings)
  const messages = useDoodleStore((s) => s.messages)
  const selectedId = useDoodleStore((s) => s.selectedMessageId)
  const selectMessage = useDoodleStore((s) => s.selectMessage)

  const scrollRef = useRef<HTMLDivElement>(null)
  const [fontFamily, setFontFamily] = useState('"PingFang SC", sans-serif')

  const canvasWidth = DOODLE_IPHONE.width
  const viewportHeight = DOODLE_IPHONE.viewportHeight

  useEffect(() => {
    ensureFontLoaded(settings.font).then(setFontFamily)
  }, [settings.font])

  const getUser = (userId: string) => users.find((u) => u.id === userId)

  const timeStr = `${settings.timeHour.padStart(2, '0')}${settings.timeSeparator}${settings.timeMinute.padStart(2, '0')}`
  const maxBubbleWidth = Math.floor(canvasWidth * 0.72 - settings.avatarSize - 24)

  return (
    <div className="flex flex-col items-center">
      {/* 固定 iPhone 视口，内部可滚动 */}
      <div
        className="relative bg-white shadow-lg overflow-hidden shrink-0"
        style={{ width: canvasWidth, height: viewportHeight }}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-y-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* 长截图目标：完整内容高度，不受视口裁剪 */}
          <div
            data-screenshot-target
            className="bg-white"
            style={{
              width: canvasWidth,
              minHeight: viewportHeight,
              padding: '28px 16px 40px',
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
                        style={settings.avatarFrameStyle ?? 'classic'}
                        url={avatar}
                        size={settings.avatarSize}
                        side={side}
                        seed={user?.id ?? side}
                      />
                      <BubbleFrame
                        style={settings.bubbleFrameStyle ?? 'classic'}
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

      <p className="text-xs text-slate-400 mt-3 text-center max-w-[390px]">
        {canvasWidth}×{viewportHeight} iPhone 视口 · 对话过多可滚动 · 截图导出完整长图
      </p>
    </div>
  )
}
