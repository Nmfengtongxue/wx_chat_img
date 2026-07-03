import {
  Clock,
  GripVertical,
  Image,
  MessageSquare,
  Mic,
  Redo2,
  Trash2,
  Wallet,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useChatStore } from '../../store/useChatStore'
import type { Message, MessageType } from '../../types'
import { MessageForm } from './MessageForm'

const typeLabels: Record<MessageType, string> = {
  text: '文字',
  image: '图片',
  voice: '语音',
  redpacket: '红包',
  transfer: '转账',
  time: '时间',
}

const typeIcons: Record<MessageType, React.ReactNode> = {
  text: <MessageSquare size={14} />,
  image: <Image size={14} />,
  voice: <Mic size={14} />,
  redpacket: <span className="text-xs">🧧</span>,
  transfer: <Wallet size={14} />,
  time: <Clock size={14} />,
}

function messagePreview(msg: Message): string {
  switch (msg.type) {
    case 'text':
      return msg.content.slice(0, 30) + (msg.content.length > 30 ? '…' : '')
    case 'image':
      return msg.imageUrl ? '[图片]' : '[未设置图片]'
    case 'voice':
      return `语音 ${msg.duration}"`
    case 'redpacket':
      return `红包：${msg.remark}`
    case 'transfer':
      return `转账 ¥${msg.amount.toFixed(2)}`
    case 'time':
      return '时间分隔'
  }
}

function SortableItem({
  msg,
  index,
  selected,
  userName,
  onSelect,
  onRemove,
}: {
  msg: Message
  index: number
  selected: boolean
  userName: string
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: msg.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer group ${
        selected
          ? 'border-emerald-400 bg-emerald-50'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>
      <span className="text-[10px] text-slate-400 w-5">{index + 1}</span>
      <span className="text-slate-400">{typeIcons[msg.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{typeLabels[msg.type]} · {userName}</p>
        <p className="text-sm text-slate-700 truncate">{messagePreview(msg)}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const quickAdd: { type: MessageType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: '文字', icon: <MessageSquare size={16} /> },
  { type: 'time', label: '时间', icon: <Clock size={16} /> },
  { type: 'image', label: '图片', icon: <Image size={16} /> },
  { type: 'voice', label: '语音', icon: <Mic size={16} /> },
  { type: 'redpacket', label: '红包', icon: <span>🧧</span> },
  { type: 'transfer', label: '转账', icon: <Wallet size={16} /> },
]

export function MessagePanel() {
  const messages = useChatStore((s) => s.messages)
  const users = useChatStore((s) => s.users)
  const selectedId = useChatStore((s) => s.selectedMessageId)
  const addMessage = useChatStore((s) => s.addMessage)
  const removeMessage = useChatStore((s) => s.removeMessage)
  const moveMessage = useChatStore((s) => s.moveMessage)
  const selectMessage = useChatStore((s) => s.selectMessage)
  const clearMessages = useChatStore((s) => s.clearMessages)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selected = messages.find((m) => m.id === selectedId)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = messages.findIndex((m) => m.id === active.id)
    const newIndex = messages.findIndex((m) => m.id === over.id)
    moveMessage(oldIndex, newIndex)
  }

  const getUserName = (userId: string) => {
    const u = users.find((x) => x.id === userId)
    return u ? (u.isSelf ? '我' : u.name) : '未知'
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {quickAdd.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => addMessage(item.type)}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">共 {messages.length} 条 · 拖拽排序</span>
        <button
          type="button"
          onClick={() => {
            if (messages.length === 0 || confirm('确定清空所有消息？')) clearMessages()
          }}
          className="text-xs text-red-500 hover:underline flex items-center gap-1"
        >
          <Redo2 size={12} /> 清空
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={messages.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">点击上方按钮添加消息</p>
            ) : (
              messages.map((msg, i) => (
                <SortableItem
                  key={msg.id}
                  msg={msg}
                  index={i}
                  selected={selectedId === msg.id}
                  userName={getUserName(msg.userId)}
                  onSelect={() => selectMessage(msg.id)}
                  onRemove={() => removeMessage(msg.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {selected && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-semibold text-slate-800 mb-3">编辑选中消息</h4>
          <MessageForm message={selected} />
        </div>
      )}
    </div>
  )
}
