import { MessageSquare, Palette, Users } from 'lucide-react'
import { useChatStore } from '../../store/useChatStore'
import { AppearanceSettings } from './AppearanceSettings'
import { MessagePanel } from './MessagePanel'
import { UserManager } from './UserManager'

const tabs = [
  { id: 'messages' as const, label: '消息', icon: MessageSquare },
  { id: 'appearance' as const, label: '外观', icon: Palette },
  { id: 'contacts' as const, label: '联系人', icon: Users },
]

export function EditorPanel() {
  const activeTab = useChatStore((s) => s.activeTab)
  const setActiveTab = useChatStore((s) => s.setActiveTab)

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === id
                ? 'text-emerald-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
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
        {activeTab === 'appearance' && <AppearanceSettings />}
        {activeTab === 'contacts' && <UserManager />}
        {activeTab === 'messages' && <MessagePanel />}
      </div>
    </div>
  )
}
