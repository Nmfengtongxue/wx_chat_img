import { useChatStore } from '../../store/useChatStore'
import type { Message, TimeMessage } from '../../types'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

export function MessageForm({ message }: { message: Message }) {
  const users = useChatStore((s) => s.users)
  const updateMessage = useChatStore((s) => s.updateMessage)

  const patch = (p: Partial<Message>) => updateMessage(message.id, p)

  return (
    <div className="space-y-3">
      {message.type !== 'time' && (
        <Field label="发送人">
          <select
            value={message.userId}
            onChange={(e) => patch({ userId: e.target.value })}
            className="input"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.isSelf ? `我（${u.name}）` : u.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {message.type === 'text' && (
        <Field label="文字内容">
          <textarea
            value={message.content}
            onChange={(e) => patch({ content: e.target.value })}
            rows={3}
            className="input resize-y min-h-[72px]"
          />
        </Field>
      )}

      {message.type === 'image' && (
        <Field label="图片">
          <div className="flex gap-2">
            <input
              value={message.imageUrl}
              onChange={(e) => patch({ imageUrl: e.target.value })}
              className="input flex-1"
              placeholder="图片 URL"
            />
            <label className="btn-secondary cursor-pointer shrink-0">
              上传
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
                  patch({ imageUrl: url })
                }}
              />
            </label>
          </div>
          {message.imageUrl && (
            <img src={message.imageUrl} alt="" className="mt-2 max-h-24 rounded-lg" />
          )}
        </Field>
      )}

      {message.type === 'voice' && (
        <>
          <Field label="语音时长（秒）">
            <input
              type="number"
              min={1}
              max={60}
              value={message.duration}
              onChange={(e) => patch({ duration: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="是否已读（未读显示红点）">
            <select
              value={message.isRead ? 'yes' : 'no'}
              onChange={(e) => patch({ isRead: e.target.value === 'yes' })}
              className="input"
            >
              <option value="yes">是</option>
              <option value="no">否</option>
            </select>
          </Field>
        </>
      )}

      {message.type === 'redpacket' && (
        <>
          <Field label="红包备注">
            <input
              value={message.remark}
              onChange={(e) => patch({ remark: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="已领取">
            <select
              value={message.claimed ? 'yes' : 'no'}
              onChange={(e) => patch({ claimed: e.target.value === 'yes' })}
              className="input"
            >
              <option value="no">否</option>
              <option value="yes">是</option>
            </select>
          </Field>
        </>
      )}

      {message.type === 'transfer' && (
        <>
          <Field label="转账金额">
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={message.amount}
              onChange={(e) => patch({ amount: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="转账备注">
            <input
              value={message.remark}
              onChange={(e) => patch({ remark: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="已领取">
            <select
              value={message.claimed ? 'yes' : 'no'}
              onChange={(e) => patch({ claimed: e.target.value === 'yes' })}
              className="input"
            >
              <option value="no">否</option>
              <option value="yes">是</option>
            </select>
          </Field>
        </>
      )}

      {message.type === 'time' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="年">
            <input value={message.year} onChange={(e) => patch({ year: e.target.value })} className="input" />
          </Field>
          <Field label="月">
            <input value={message.month} onChange={(e) => patch({ month: e.target.value })} className="input" />
          </Field>
          <Field label="日">
            <input value={message.day} onChange={(e) => patch({ day: e.target.value })} className="input" />
          </Field>
          <Field label="星期">
            <select value={message.weekday} onChange={(e) => patch({ weekday: e.target.value })} className="input">
              <option value="">不显示</option>
              {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="时段">
            <select value={message.period} onChange={(e) => patch({ period: e.target.value as TimeMessage['period'] })} className="input">
              <option value="">不显示</option>
              <option value="凌晨">凌晨</option>
              <option value="上午">上午</option>
              <option value="下午">下午</option>
            </select>
          </Field>
          <Field label="时:分">
            <div className="flex gap-2 items-center">
              <input value={message.hour} onChange={(e) => patch({ hour: e.target.value })} className="input w-16" />
              <span>:</span>
              <input value={message.minute} onChange={(e) => patch({ minute: e.target.value })} className="input w-16" />
            </div>
          </Field>
        </div>
      )}
    </div>
  )
}
