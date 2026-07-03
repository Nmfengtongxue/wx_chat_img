import { ChevronLeft, MoreHorizontal } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'

export function ChatHeader() {
  const title = useChatStore((s) => s.chat.title)
  const unread = useChatStore((s) => s.phone.unreadCount)
  const earpiece = useChatStore((s) => s.phone.earpieceMode)

  return (
    <div className="relative flex items-center justify-center h-[44px] bg-[#ededed] border-b border-black/5 px-3">
      <div className="absolute left-2 flex items-center text-black/80">
        <ChevronLeft size={22} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="text-[15px] ml-[-2px]">{unread}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {earpiece && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
        <span className="text-[17px] font-medium text-black truncate max-w-[180px]">
          {title || '聊天'}
        </span>
      </div>

      <div className="absolute right-2 text-black/80">
        <MoreHorizontal size={22} strokeWidth={1.8} />
      </div>
    </div>
  )
}
