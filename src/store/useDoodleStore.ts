import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  applySample,
  createDefaultDoodleState,
  type DoodleSampleId,
} from '../constants/doodleSamples'
import type { DoodleMessage, DoodleSettings, DoodleUser } from '../types/doodle'
import type { DoodleFont } from '../types/doodle'

const uid = () => crypto.randomUUID()

const defaultUsers: DoodleUser[] = [
  { id: 'left', side: 'left', name: '对方', avatar: '' },
  { id: 'right', side: 'right', name: '我', avatar: '' },
]

const { settings: defaultSettings, messages: defaultMessages } = createDefaultDoodleState()

interface DoodleStore {
  users: DoodleUser[]
  settings: DoodleSettings
  messages: DoodleMessage[]
  selectedMessageId: string | null
  activeTab: 'messages' | 'style' | 'avatars'
  setActiveTab: (tab: 'messages' | 'style' | 'avatars') => void
  updateSettings: (patch: Partial<DoodleSettings>) => void
  updateFont: (font: DoodleFont) => void
  updateUser: (id: string, patch: Partial<DoodleUser>) => void
  addMessage: (userId?: string) => void
  updateMessage: (id: string, patch: Partial<DoodleMessage>) => void
  removeMessage: (id: string) => void
  moveMessage: (from: number, to: number) => void
  clearMessages: () => void
  selectMessage: (id: string | null) => void
  importData: (data: Partial<DoodleStore>) => void
  resetAll: () => void
  loadSample: (sample: DoodleSampleId) => void
}

export const useDoodleStore = create<DoodleStore>()(
  persist(
    (set) => ({
      users: defaultUsers,
      settings: defaultSettings,
      messages: defaultMessages,
      selectedMessageId: null,
      activeTab: 'messages',

      setActiveTab: (tab) => set({ activeTab: tab }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      updateFont: (font) =>
        set((s) => ({ settings: { ...s.settings, font } })),

      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),

      addMessage: (userId) => {
        const id = userId ?? 'right'
        const msg: DoodleMessage = { id: uid(), userId: id, content: '新消息' }
        set((s) => ({
          messages: [...s.messages, msg],
          selectedMessageId: msg.id,
          activeTab: 'messages',
        }))
      },

      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      removeMessage: (id) =>
        set((s) => ({
          messages: s.messages.filter((m) => m.id !== id),
          selectedMessageId: s.selectedMessageId === id ? null : s.selectedMessageId,
        })),

      moveMessage: (from, to) =>
        set((s) => {
          const list = [...s.messages]
          const [item] = list.splice(from, 1)
          if (!item) return s
          list.splice(to, 0, item)
          return { messages: list }
        }),

      clearMessages: () => set({ messages: [], selectedMessageId: null }),

      selectMessage: (id) => set({ selectedMessageId: id, activeTab: 'messages' }),

      importData: (data) =>
        set((s) => ({
          users: data.users ?? s.users,
          settings: data.settings ?? s.settings,
          messages: data.messages ?? s.messages,
        })),

      resetAll: () => {
        const fresh = createDefaultDoodleState()
        set({
          users: defaultUsers,
          settings: fresh.settings,
          messages: fresh.messages.map((m) => ({ ...m, id: uid() })),
          selectedMessageId: null,
        })
      },

      loadSample: (sample) => {
        const data = applySample(sample)
        set((s) => ({
          settings: { ...s.settings, ...data.settings },
          messages: data.messages,
          selectedMessageId: null,
        }))
      },
    }),
    {
      name: 'doodle-chat-generator',
      version: 2,
      migrate: (persisted: unknown, version) => {
        if (version >= 2) return persisted as DoodleStore
        const fresh = createDefaultDoodleState()
        const old = persisted as Partial<DoodleStore> | undefined
        return {
          users: old?.users ?? defaultUsers,
          settings: { ...fresh.settings, ...old?.settings, ...fresh.settings },
          messages: fresh.messages,
          selectedMessageId: null,
          activeTab: 'messages',
        }
      },
      partialize: (s) => ({
        users: s.users,
        settings: s.settings,
        messages: s.messages,
      }),
    },
  ),
)
