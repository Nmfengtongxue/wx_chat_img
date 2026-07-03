import { ChatHeader } from '../preview/ChatHeader'
import { InputBar } from '../preview/InputBar'
import { StatusBar } from '../preview/StatusBar'

interface EffectPreviewPhoneProps {
  /** 聊天消息区容器 ref，动效仅在此区域内展示 */
  stageRef: React.RefObject<HTMLDivElement | null>
  children?: React.ReactNode
}

/** 特效预览用手机壳 · 与微信仿真 PhonePreview 结构一致 */
export function EffectPreviewPhone({ stageRef, children }: EffectPreviewPhoneProps) {
  return (
    <div className="flex flex-col items-center shrink-0">
      <div
        className="w-[375px] bg-black rounded-[44px] p-[10px] shadow-2xl shadow-black/40"
        data-screenshot-target
      >
        <div className="relative bg-[#ededed] rounded-[36px] overflow-hidden min-h-[720px] flex flex-col">
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-full z-20 pointer-events-none" />

          <StatusBar />
          <ChatHeader />

          <div
            ref={stageRef}
            data-effect-stage
            className="relative flex-1 overflow-hidden min-h-[520px] bg-[#ededed]"
          >
            <div className="absolute inset-0 py-2 px-1 pointer-events-none opacity-40">
              <div className="flex gap-2.5 px-3 py-2">
                <div className="w-10 h-10 rounded bg-[#d8d8d8] shrink-0" />
                <div className="h-10 w-32 rounded bg-white" />
              </div>
              <div className="flex gap-2.5 px-3 py-2 flex-row-reverse">
                <div className="h-10 w-24 rounded bg-[#95ec69]" />
              </div>
            </div>
            {children}
          </div>

          <InputBar />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 text-center">
        动效仅在聊天消息区域内展示 · 375×812
      </p>
    </div>
  )
}
