import { useChatStore } from '../../store/useChatStore'
import { ChatHeader } from './ChatHeader'
import { InputBar } from './InputBar'
import { MessageBubble } from './MessageBubble'
import { StatusBar } from './StatusBar'

export function PhonePreview() {
  const messages = useChatStore((s) => s.messages)
  const users = useChatStore((s) => s.users)
  const chat = useChatStore((s) => s.chat)
  const selectedId = useChatStore((s) => s.selectedMessageId)
  const selectMessage = useChatStore((s) => s.selectMessage)

  const getUser = (userId: string) => users.find((u) => u.id === userId)
  const isSelfMessage = (userId: string) => getUser(userId)?.isSelf ?? false

  return (
    <div className="flex flex-col items-center">
      <div className="w-[375px] bg-black rounded-[44px] p-[10px] shadow-2xl shadow-black/30">
        <div className="relative bg-[#ededed] rounded-[36px] overflow-hidden min-h-[720px] flex flex-col">
          {/* Dynamic Island */}
          <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-full z-20 pointer-events-none" />

          <StatusBar />
          <ChatHeader />

          <div
            className="flex-1 overflow-y-auto py-2 min-h-[520px]"
            style={
              chat.background
                ? { backgroundImage: `url(${chat.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { backgroundColor: '#ededed' }
            }
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#b2b2b2] text-sm">
                暂无消息，请在左侧添加
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  user={getUser(msg.userId)}
                  isSelf={isSelfMessage(msg.userId)}
                  selected={selectedId === msg.id}
                  onSelect={() => selectMessage(msg.id)}
                />
              ))
            )}
          </div>

          <InputBar />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">点击消息可在左侧编辑 · 375×812 标准尺寸</p>
    </div>
  )
}
