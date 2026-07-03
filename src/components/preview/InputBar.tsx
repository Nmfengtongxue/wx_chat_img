import { Mic, Smile, PlusCircle } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'

export function InputBar() {
  const voiceMode = useChatStore((s) => s.chat.voiceMode)

  return (
    <div className="bg-[#f7f7f7] border-t border-black/5 px-2.5 py-2 pb-6">
      <div className="flex items-center gap-2">
        <Mic size={26} strokeWidth={1.5} className="text-[#181818] shrink-0" />
        {voiceMode ? (
          <div className="flex-1 h-[36px] bg-white rounded-[6px] border border-black/10 flex items-center justify-center text-[15px] text-[#181818]">
            按住 说话
          </div>
        ) : (
          <div className="flex-1 h-[36px] bg-white rounded-[6px] border border-black/10" />
        )}
        <Smile size={26} strokeWidth={1.5} className="text-[#181818] shrink-0" />
        <PlusCircle size={26} strokeWidth={1.5} className="text-[#181818] shrink-0" />
      </div>
      <div className="flex justify-center mt-1">
        <div className="w-[134px] h-[5px] bg-black/20 rounded-full" />
      </div>
    </div>
  )
}
