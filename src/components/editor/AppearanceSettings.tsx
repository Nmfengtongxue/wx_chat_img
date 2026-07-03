import { useChatStore } from '../../store/useChatStore'
import type { NetworkType } from '../../types'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            value === opt.value
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

export function AppearanceSettings() {
  const phone = useChatStore((s) => s.phone)
  const chat = useChatStore((s) => s.chat)
  const updatePhone = useChatStore((s) => s.updatePhone)
  const updateChat = useChatStore((s) => s.updateChat)

  return (
    <div className="space-y-5">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">状态栏</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="手机时间（时）">
            <input
              type="number"
              min={0}
              max={23}
              value={phone.timeHour}
              onChange={(e) => updatePhone({ timeHour: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="手机时间（分）">
            <input
              type="number"
              min={0}
              max={59}
              value={phone.timeMinute}
              onChange={(e) => updatePhone({ timeMinute: e.target.value })}
              className="input"
            />
          </Field>
        </div>

        <Field label="手机信号">
          <Segmented
            value={phone.signalBars}
            options={[1, 2, 3, 4].map((n) => ({ label: `${n}格`, value: n as 1 | 2 | 3 | 4 }))}
            onChange={(v) => updatePhone({ signalBars: v })}
          />
        </Field>

        <Field label="网络类型">
          <Segmented
            value={phone.networkType}
            options={(
              [
                { label: 'WiFi', value: 'wifi' },
                { label: '3G', value: '3g' },
                { label: '4G', value: '4g' },
                { label: '5G', value: '5g' },
              ] as { label: string; value: NetworkType }[]
            )}
            onChange={(v) => updatePhone({ networkType: v })}
          />
        </Field>

        {phone.networkType === 'wifi' && (
          <Field label="WiFi 信号">
            <Segmented
              value={phone.wifiBars}
              options={[1, 2, 3].map((n) => ({ label: `${n}格`, value: n as 1 | 2 | 3 }))}
              onChange={(v) => updatePhone({ wifiBars: v })}
            />
          </Field>
        )}

        <Field label={`手机电量：${phone.battery}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={phone.battery}
            onChange={(e) => updatePhone({ battery: Number(e.target.value) })}
            className="w-full accent-emerald-600"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="充电中">
            <Segmented
              value={phone.charging ? 'yes' : 'no'}
              options={[
                { label: '是', value: 'yes' },
                { label: '否', value: 'no' },
              ]}
              onChange={(v) => updatePhone({ charging: v === 'yes' })}
            />
          </Field>
          <Field label="听筒模式">
            <Segmented
              value={phone.earpieceMode ? 'yes' : 'no'}
              options={[
                { label: '是', value: 'yes' },
                { label: '否', value: 'no' },
              ]}
              onChange={(v) => updatePhone({ earpieceMode: v === 'yes' })}
            />
          </Field>
        </div>

        <Field label="未读消息数（返回旁数字）">
          <input
            type="number"
            min={0}
            max={999}
            value={phone.unreadCount}
            onChange={(e) => updatePhone({ unreadCount: Number(e.target.value) })}
            className="input"
          />
        </Field>
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-800">聊天界面</h3>
        <Field label="聊天标题">
          <input
            value={chat.title}
            onChange={(e) => updateChat({ title: e.target.value })}
            className="input"
            placeholder="对方昵称"
          />
        </Field>
        <Field label="语音输入模式">
          <Segmented
            value={chat.voiceMode ? 'yes' : 'no'}
            options={[
              { label: '是', value: 'yes' },
              { label: '否', value: 'no' },
            ]}
            onChange={(v) => updateChat({ voiceMode: v === 'yes' })}
          />
        </Field>
        <Field label="聊天背景图">
          <div className="flex gap-2">
            <input
              value={chat.background}
              onChange={(e) => updateChat({ background: e.target.value })}
              className="input flex-1"
              placeholder="图片 URL 或上传"
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
                  updateChat({ background: url })
                }}
              />
            </label>
            {chat.background && (
              <button type="button" className="btn-secondary" onClick={() => updateChat({ background: '' })}>
                清除
              </button>
            )}
          </div>
        </Field>
      </section>
    </div>
  )
}
