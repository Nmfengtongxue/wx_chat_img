import type { Message, User } from '../../types'
import { formatMoney, formatTimeText } from '../../utils/helpers'

interface Props {
  message: Message
  user: User | undefined
  isSelf: boolean
  selected: boolean
  onSelect: () => void
}

function Avatar({ user, isSelf }: { user: User | undefined; isSelf: boolean }) {
  if (isSelf) return null
  return (
    <div className="w-[40px] h-[40px] rounded-[4px] overflow-hidden shrink-0 bg-[#d8d8d8]">
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[14px] text-white bg-[#9a9a9a]">
          {(user?.name ?? '?')[0]}
        </div>
      )}
    </div>
  )
}

function BubbleTail({ isSelf }: { isSelf: boolean }) {
  return (
    <div
      className={`absolute top-[12px] w-0 h-0 ${
        isSelf ? '-right-[5px] border-l-[6px] border-l-[#95ec69]' : '-left-[5px] border-r-[6px] border-r-white'
      } border-y-[5px] border-y-transparent`}
    />
  )
}

function TextBubble({ content, isSelf }: { content: string; isSelf: boolean }) {
  return (
    <div
      className={`relative max-w-[220px] px-[10px] py-[8px] rounded-[4px] text-[16px] leading-[1.45] break-words whitespace-pre-wrap ${
        isSelf ? 'bg-[#95ec69] text-black' : 'bg-white text-black'
      }`}
    >
      {!isSelf && <BubbleTail isSelf={false} />}
      {content}
      {isSelf && <BubbleTail isSelf={true} />}
    </div>
  )
}

function VoiceBubble({ duration, isSelf, isRead }: { duration: number; isSelf: boolean; isRead: boolean }) {
  return (
    <div
      className={`relative flex items-center gap-2 min-w-[70px] px-[10px] py-[8px] rounded-[4px] ${
        isSelf ? 'bg-[#95ec69] flex-row-reverse' : 'bg-white'
      }`}
    >
      {!isSelf && <BubbleTail isSelf={false} />}
      <div className={`flex gap-[2px] items-center ${isSelf ? '' : 'flex-row-reverse'}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[2px] bg-black/70 rounded-full"
            style={{ height: `${6 + i * 3}px` }}
          />
        ))}
      </div>
      <span className="text-[14px]">{duration}"</span>
      {isSelf && !isRead && (
        <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#fa5151]" />
      )}
      {isSelf && <BubbleTail isSelf={true} />}
    </div>
  )
}

function ImageBubble({ url }: { url: string }) {
  if (!url) {
    return (
      <div className="w-[140px] h-[140px] rounded-[4px] bg-[#d8d8d8] flex items-center justify-center text-[13px] text-[#888]">
        图片
      </div>
    )
  }
  return (
    <img src={url} alt="" className="max-w-[180px] max-h-[180px] rounded-[4px] object-cover" />
  )
}

function RedPacketBubble({ remark, claimed }: { remark: string; claimed: boolean }) {
  return (
    <div className="w-[230px] rounded-[6px] overflow-hidden bg-[#fa9d3b] text-white">
      <div className="flex items-start gap-2.5 p-3 pb-2">
        <div className="w-[36px] h-[42px] rounded-[4px] bg-[#e8872a] flex items-center justify-center shrink-0">
          <span className="text-[20px]">🧧</span>
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[16px] font-medium truncate">{remark}</p>
          {claimed && <p className="text-[12px] opacity-80 mt-0.5">已领取</p>}
        </div>
      </div>
      <div className="px-3 py-1.5 bg-[#f0f0f0] text-[11px] text-[#888]">微信红包</div>
    </div>
  )
}

function TransferBubble({ amount, remark, claimed }: { amount: number; remark: string; claimed: boolean }) {
  return (
    <div className="w-[230px] rounded-[6px] overflow-hidden bg-[#fa9d3b] text-white">
      <div className="flex items-start gap-2.5 p-3 pb-2">
        <div className="w-[36px] h-[42px] rounded-[4px] bg-white/20 flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.09-1.62-4.09-3.71 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.66 0 .84.65 1.48 2.67 2.03 2.49.6 4.09 1.62 4.09 3.83 0 1.94-1.47 3.01-3.14 3.38z" />
          </svg>
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[22px] font-medium">¥{formatMoney(amount)}</p>
          <p className="text-[13px] opacity-90 truncate">{remark}</p>
          {claimed && <p className="text-[12px] opacity-80 mt-0.5">已领取</p>}
        </div>
      </div>
      <div className="px-3 py-1.5 bg-[#f0f0f0] text-[11px] text-[#888]">微信转账</div>
    </div>
  )
}

export function MessageBubble({ message, user, isSelf, selected, onSelect }: Props) {
  if (message.type === 'time') {
    return (
      <div
        className={`flex justify-center py-2 cursor-pointer ${selected ? 'ring-2 ring-emerald-400/60 rounded' : ''}`}
        onClick={onSelect}
      >
        <span className="text-[12px] text-[#b2b2b2] px-2">
          {formatTimeText(message)}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex gap-2.5 px-3 py-1.5 cursor-pointer rounded-lg transition-colors ${
        isSelf ? 'flex-row-reverse' : 'flex-row'
      } ${selected ? 'bg-emerald-50/80 ring-2 ring-emerald-400/60' : 'hover:bg-black/[0.02]'}`}
      onClick={onSelect}
    >
      <Avatar user={user} isSelf={isSelf} />
      <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
        {message.type === 'text' && <TextBubble content={message.content} isSelf={isSelf} />}
        {message.type === 'voice' && (
          <VoiceBubble duration={message.duration} isSelf={isSelf} isRead={message.isRead} />
        )}
        {message.type === 'image' && <ImageBubble url={message.imageUrl} />}
        {message.type === 'redpacket' && (
          <RedPacketBubble remark={message.remark} claimed={message.claimed} />
        )}
        {message.type === 'transfer' && (
          <TransferBubble amount={message.amount} remark={message.remark} claimed={message.claimed} />
        )}
      </div>
    </div>
  )
}
