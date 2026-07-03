import { Plus, Trash2, UserCircle2 } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'

export function UserManager() {
  const users = useChatStore((s) => s.users)
  const addUser = useChatStore((s) => s.addUser)
  const updateUser = useChatStore((s) => s.updateUser)
  const removeUser = useChatStore((s) => s.removeUser)
  const setSelfUser = useChatStore((s) => s.setSelfUser)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          第一个标记为「我」的用户，消息显示在右侧绿色气泡
        </p>
        <button type="button" onClick={addUser} className="btn-secondary flex items-center gap-1">
          <Plus size={16} /> 添加
        </button>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className={`p-3 rounded-xl border transition-colors ${
              user.isSelf ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <label className="relative shrink-0 cursor-pointer group">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 size={32} className="text-slate-400" />
                  )}
                </div>
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
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                  换头像
                </span>
              </label>

              <div className="flex-1 min-w-0 space-y-2">
                <input
                  value={user.name}
                  onChange={(e) => updateUser(user.id, { name: e.target.value })}
                  className="input"
                  placeholder="昵称"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelfUser(user.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${
                      user.isSelf
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'text-slate-500 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {user.isSelf ? '✓ 我（右侧）' : '设为自己'}
                  </button>
                  {users.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeUser(user.id)}
                      className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded-full flex items-center gap-0.5"
                    >
                      <Trash2 size={12} /> 删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
