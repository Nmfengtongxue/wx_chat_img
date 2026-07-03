import {
  GripVertical,
  MessageSquare,
  Palette,
  Trash2,
  UserCircle2,
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
import { useDoodleStore } from '../../store/useDoodleStore'
import type { DoodleFrameStyle, DoodleMessage } from '../../types/doodle'
import { FontPicker } from './FontPicker'
import { AvatarPicker } from './AvatarPicker'
import { AvatarFrame } from './frames'

function FrameStylePicker({
  value,
  onChange,
}: {
  value: DoodleFrameStyle
  onChange: (v: DoodleFrameStyle) => void
}) {
  return (
    <div className="flex gap-2">
      {(
        [
          { id: 'classic' as const, label: '标准' },
          { id: 'sketch' as const, label: '手绘不规则' },
        ] as const
      ).map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
            value === opt.id
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function SortableRow({
  msg,
  index,
  selected,
  sideLabel,
  onSelect,
  onRemove,
}: {
  msg: DoodleMessage
  index: number
  selected: boolean
  sideLabel: string
  onSelect: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: msg.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer group ${
        selected ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="text-slate-300 hover:text-slate-500 cursor-grab touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={16} />
      </button>
      <span className="text-[10px] text-slate-400 w-5">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{sideLabel}</p>
        <p className="text-sm text-slate-700 truncate">{msg.content || '（空）'}</p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-50 rounded"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const tabs = [
  { id: 'messages' as const, label: '对话', icon: MessageSquare },
  { id: 'style' as const, label: '风格', icon: Palette },
  { id: 'avatars' as const, label: '头像', icon: UserCircle2 },
]

export function DoodleEditorPanel() {
  const users = useDoodleStore((s) => s.users)
  const settings = useDoodleStore((s) => s.settings)
  const messages = useDoodleStore((s) => s.messages)
  const selectedId = useDoodleStore((s) => s.selectedMessageId)
  const activeTab = useDoodleStore((s) => s.activeTab)
  const setActiveTab = useDoodleStore((s) => s.setActiveTab)
  const updateSettings = useDoodleStore((s) => s.updateSettings)
  const updateUser = useDoodleStore((s) => s.updateUser)
  const addMessage = useDoodleStore((s) => s.addMessage)
  const updateMessage = useDoodleStore((s) => s.updateMessage)
  const removeMessage = useDoodleStore((s) => s.removeMessage)
  const moveMessage = useDoodleStore((s) => s.moveMessage)
  const clearMessages = useDoodleStore((s) => s.clearMessages)
  const selectMessage = useDoodleStore((s) => s.selectMessage)
  const loadSample = useDoodleStore((s) => s.loadSample)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selected = messages.find((m) => m.id === selectedId)
  const leftUser = users.find((u) => u.side === 'left')
  const rightUser = users.find((u) => u.side === 'right')

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = messages.findIndex((m) => m.id === active.id)
    const to = messages.findIndex((m) => m.id === over.id)
    moveMessage(from, to)
  }

  const sideLabel = (userId: string) => {
    const u = users.find((x) => x.id === userId)
    return u?.side === 'left' ? '左侧' : '右侧'
  }

  return (
    <div className="flex flex-col h-full min-h-[480px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === id ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icon size={16} />
            {label}
            {activeTab === id && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-emerald-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addMessage('left')}
                className="flex-1 py-2.5 text-sm rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                + 左侧发言
              </button>
              <button
                type="button"
                onClick={() => addMessage('right')}
                className="flex-1 py-2.5 text-sm rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50"
              >
                + 右侧发言
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => loadSample('sleep')} className="text-xs text-emerald-700 font-medium hover:underline">
                示例：失眠对话（默认）
              </button>
              <span className="text-slate-300">|</span>
              <button type="button" onClick={() => loadSample('slippers')} className="text-xs text-emerald-600 hover:underline">
                示例：拖鞋对话
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">共 {messages.length} 条 · 拖拽排序</span>
              <button
                type="button"
                onClick={() => messages.length === 0 || confirm('清空所有对话？') ? clearMessages() : null}
                className="text-xs text-red-500 hover:underline"
              >
                清空
              </button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={messages.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {messages.map((msg, i) => (
                    <SortableRow
                      key={msg.id}
                      msg={msg}
                      index={i}
                      selected={selectedId === msg.id}
                      sideLabel={sideLabel(msg.userId)}
                      onSelect={() => selectMessage(msg.id)}
                      onRemove={() => removeMessage(msg.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {selected && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-sm font-semibold text-slate-800">编辑消息</h4>
                <Field label="发言方">
                  <select
                    value={selected.userId}
                    onChange={(e) => updateMessage(selected.id, { userId: e.target.value })}
                    className="input"
                  >
                    <option value={leftUser?.id}>左侧</option>
                    <option value={rightUser?.id}>右侧</option>
                  </select>
                </Field>
                <Field label="内容（Enter 换行）">
                  <textarea
                    value={selected.content}
                    onChange={(e) => updateMessage(selected.id, { content: e.target.value })}
                    rows={4}
                    className="input resize-y min-h-[80px]"
                    placeholder="输入对话内容，长句可拆成多条气泡"
                  />
                </Field>
              </div>
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-5">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">顶部时间</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="时">
                  <input
                    value={settings.timeHour}
                    onChange={(e) => updateSettings({ timeHour: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="分">
                  <input
                    value={settings.timeMinute}
                    onChange={(e) => updateSettings({ timeMinute: e.target.value })}
                    className="input"
                  />
                </Field>
              </div>
              <Field label="分隔符（如 : 或空格:空格）">
                <input
                  value={settings.timeSeparator}
                  onChange={(e) => updateSettings({ timeSeparator: e.target.value })}
                  className="input"
                  placeholder=" : "
                />
              </Field>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">字体</h3>
              <FontPicker />
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">边框样式</h3>
              <Field label="头像框">
                <FrameStylePicker
                  value={settings.avatarFrameStyle ?? 'classic'}
                  onChange={(v) => updateSettings({ avatarFrameStyle: v })}
                />
              </Field>
              <Field label="文字气泡框">
                <FrameStylePicker
                  value={settings.bubbleFrameStyle ?? 'classic'}
                  onChange={(v) => updateSettings({ bubbleFrameStyle: v })}
                />
              </Field>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                「手绘不规则」参考示例图：边框线条抖动、气泡随文字长度自动伸缩；「标准」保留原有样式。
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">外观</h3>
              <Field label={`气泡颜色 ${settings.bubbleColor}`}>
                <input
                  type="color"
                  value={settings.bubbleColor}
                  onChange={(e) => updateSettings({ bubbleColor: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </Field>
              <Field label={`字号 ${settings.bubbleFontSize}px`}>
                <input
                  type="range"
                  min={12}
                  max={24}
                  value={settings.bubbleFontSize}
                  onChange={(e) => updateSettings({ bubbleFontSize: Number(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
              </Field>
              <Field label={`头像尺寸 ${settings.avatarSize}px`}>
                <input
                  type="range"
                  min={40}
                  max={72}
                  value={settings.avatarSize}
                  onChange={(e) => updateSettings({ avatarSize: Number(e.target.value) })}
                  className="w-full accent-emerald-600"
                />
              </Field>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                预览高度与左侧编辑区对齐；对话较少时截图贴合最后一行，超出时可滚动并导出长图。画布宽度固定 390px。
              </p>
            </section>
          </div>
        )}

        {activeTab === 'avatars' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              点击头像库缩略图快速更换，或点击左侧预览上传自定义图片
            </p>
            {users.map((user) => (
              <div key={user.id} className="p-4 rounded-xl border border-slate-200 space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  {user.side === 'left' ? '左侧头像' : '右侧头像'}
                </p>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer group relative shrink-0">
                    <AvatarFrame
                      style={settings.avatarFrameStyle ?? 'classic'}
                      url={user.avatar}
                      size={72}
                      side={user.side}
                      seed={user.id}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const url = await new Promise<string>((resolve) => {
                          const r = new FileReader()
                          r.onload = () => resolve(r.result as string)
                          r.readAsDataURL(file)
                        })
                        updateUser(user.id, { avatar: url })
                      }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs opacity-0 group-hover:opacity-100 rounded transition-opacity">
                      上传
                    </span>
                  </label>
                  <div className="flex-1 space-y-2">
                    <input
                      value={user.name}
                      onChange={(e) => updateUser(user.id, { name: e.target.value })}
                      className="input"
                      placeholder="备注名（仅编辑区显示）"
                    />
                    {user.avatar && (
                      <button
                        type="button"
                        onClick={() => updateUser(user.id, { avatar: '' })}
                        className="text-xs text-red-500 hover:underline"
                      >
                        清除头像
                      </button>
                    )}
                  </div>
                </div>
                <AvatarPicker
                  value={user.avatar}
                  onChange={(url) => updateUser(user.id, { avatar: url })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
