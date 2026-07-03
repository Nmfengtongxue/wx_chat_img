import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DoodleMessage, DoodleSettings, DoodleUser } from '../types/doodle'
import { DEFAULT_FONT_PRESET, fontPresetToSettings } from '../utils/fonts'

const uid = () => crypto.randomUUID()

const defaultUsers: DoodleUser[] = [
  { id: 'left', side: 'left', name: '对方', avatar: '' },
  { id: 'right', side: 'right', name: '我', avatar: '' },
]

const defaultSettings: DoodleSettings = {
  timeHour: '12',
  timeMinute: '49',
  timeSeparator: ' : ',
  showTopTime: true,
  font: fontPresetToSettings(DEFAULT_FONT_PRESET),
  bubbleColor: '#76D14D',
  canvasWidth: 390,
  avatarSize: 52,
  bubbleFontSize: 17,
  avatarFrameStyle: 'classic',
  bubbleFrameStyle: 'classic',
}

const defaultMessages: DoodleMessage[] = [
  { id: uid(), userId: 'left', content: '看我的新拖鞋！' },
  { id: uid(), userId: 'right', content: '你不是已经有两双了吗？怎么还买？' },
  { id: uid(), userId: 'left', content: '没办法！已经砸你四次了。' },
  { id: uid(), userId: 'right', content: '你真以为我会怕37码的EVA人字拖？' },
  { id: uid(), userId: 'left', content: '我知道你不怕！所以我买了38码的。' },
]

interface DoodleStore {
  users: DoodleUser[]
  settings: DoodleSettings
  messages: DoodleMessage[]
  selectedMessageId: string | null
  activeTab: 'messages' | 'style' | 'avatars'
  setActiveTab: (tab: 'messages' | 'style' | 'avatars') => void
  updateSettings: (patch: Partial<DoodleSettings>) => void
  updateFont: (font: DoodleSettings['font']) => void
  updateUser: (id: string, patch: Partial<DoodleUser>) => void
  addMessage: (userId?: string) => void
  updateMessage: (id: string, patch: Partial<DoodleMessage>) => void
  removeMessage: (id: string) => void
  moveMessage: (from: number, to: number) => void
  clearMessages: () => void
  selectMessage: (id: string | null) => void
  importData: (data: Partial<DoodleStore>) => void
  resetAll: () => void
  loadSample: (sample: 'slippers' | 'sleep') => void
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

      resetAll: () =>
        set({
          users: defaultUsers,
          settings: defaultSettings,
          messages: defaultMessages.map((m) => ({ ...m, id: uid() })),
          selectedMessageId: null,
        }),

      loadSample: (sample) => {
        if (sample === 'slippers') {
          set({
            settings: { ...defaultSettings, timeHour: '12', timeMinute: '49', timeSeparator: ' : ' },
            messages: defaultMessages.map((m) => ({ ...m, id: uid() })),
          })
        } else {
          set({
            settings: { ...defaultSettings, timeHour: '04', timeMinute: '47', timeSeparator: ':' },
            messages: [
              { id: uid(), userId: 'left', content: '我又没睡着！' },
              { id: uid(), userId: 'right', content: '碰上容易的觉就睡了吧。' },
              { id: uid(), userId: 'right', content: '那些想不明白的问题，' },
              { id: uid(), userId: 'right', content: '可以等大姨妈、智齿发炎、感冒、过敏，' },
              { id: uid(), userId: 'right', content: '来问候你的时候，' },
              { id: uid(), userId: 'right', content: '跟它们一块儿彻夜长谈。' },
              { id: uid(), userId: 'left', content: '它们懂个屁！' },
            ],
          })
        }
      },
    }),
    {
      name: 'doodle-chat-generator',
      partialize: (s) => ({
        users: s.users,
        settings: s.settings,
        messages: s.messages,
      }),
    },
  ),
)
