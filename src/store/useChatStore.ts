import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ChatSettings,
  Message,
  MessageType,
  PhoneSettings,
  User,
} from '../types'

const uid = () => crypto.randomUUID()

const defaultUsers: User[] = [
  {
    id: 'self',
    name: '我',
    avatar: '',
    isSelf: true,
  },
  {
    id: 'other',
    name: '微截图',
    avatar: '',
    isSelf: false,
  },
]

const defaultPhone: PhoneSettings = {
  signalBars: 4,
  networkType: 'wifi',
  wifiBars: 3,
  timeHour: '16',
  timeMinute: '20',
  battery: 85,
  charging: false,
  earpieceMode: false,
  unreadCount: 0,
}

const defaultChat: ChatSettings = {
  title: '微截图',
  voiceMode: false,
  background: '',
}

const defaultMessages: Message[] = [
  {
    id: uid(),
    type: 'time',
    userId: 'self',
    year: '2019',
    month: '5',
    day: '20',
    weekday: '',
    period: '下午',
    hour: '4',
    minute: '20',
  },
  {
    id: uid(),
    type: 'text',
    userId: 'other',
    content: 'hello',
  },
  {
    id: uid(),
    type: 'text',
    userId: 'self',
    content: '你好，这是一条示例消息',
  },
  {
    id: uid(),
    type: 'transfer',
    userId: 'self',
    amount: 1,
    remark: '转账给微截图',
    claimed: false,
  },
  {
    id: uid(),
    type: 'redpacket',
    userId: 'self',
    remark: '恭喜发财，大吉大利',
    claimed: false,
  },
]

interface ChatStore {
  users: User[]
  phone: PhoneSettings
  chat: ChatSettings
  messages: Message[]
  selectedMessageId: string | null
  activeTab: 'appearance' | 'contacts' | 'messages'
  setActiveTab: (tab: 'appearance' | 'contacts' | 'messages') => void
  updatePhone: (patch: Partial<PhoneSettings>) => void
  updateChat: (patch: Partial<ChatSettings>) => void
  addUser: () => void
  updateUser: (id: string, patch: Partial<User>) => void
  removeUser: (id: string) => void
  setSelfUser: (id: string) => void
  addMessage: (type: MessageType) => void
  updateMessage: (id: string, patch: Partial<Message>) => void
  removeMessage: (id: string) => void
  moveMessage: (from: number, to: number) => void
  clearMessages: () => void
  selectMessage: (id: string | null) => void
  importData: (data: Partial<ChatStore>) => void
  resetAll: () => void
}

function createMessage(type: MessageType, userId: string): Message {
  const base = { id: uid(), userId }

  switch (type) {
    case 'text':
      return { ...base, type: 'text', content: '新消息' }
    case 'image':
      return { ...base, type: 'image', imageUrl: '' }
    case 'voice':
      return { ...base, type: 'voice', duration: 3, isRead: true }
    case 'redpacket':
      return { ...base, type: 'redpacket', remark: '恭喜发财，大吉大利', claimed: false }
    case 'transfer':
      return { ...base, type: 'transfer', amount: 1, remark: '转账给微截图', claimed: false }
    case 'time':
      return {
        ...base,
        type: 'time',
        year: new Date().getFullYear().toString(),
        month: String(new Date().getMonth() + 1),
        day: String(new Date().getDate()),
        weekday: '',
        period: '下午',
        hour: String(new Date().getHours() % 12 || 12),
        minute: String(new Date().getMinutes()).padStart(2, '0'),
      }
  }
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      phone: defaultPhone,
      chat: defaultChat,
      messages: defaultMessages,
      selectedMessageId: null,
      activeTab: 'messages',

      setActiveTab: (tab) => set({ activeTab: tab }),

      updatePhone: (patch) =>
        set((s) => ({ phone: { ...s.phone, ...patch } })),

      updateChat: (patch) =>
        set((s) => ({ chat: { ...s.chat, ...patch } })),

      addUser: () =>
        set((s) => ({
          users: [
            ...s.users,
            {
              id: uid(),
              name: `用户${s.users.length + 1}`,
              avatar: '',
              isSelf: false,
            },
          ],
        })),

      updateUser: (id, patch) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        })),

      removeUser: (id) => {
        const { users, messages } = get()
        if (users.length <= 2) return
        const self = users.find((u) => u.isSelf)
        set({
          users: users.filter((u) => u.id !== id),
          messages: messages.map((m) =>
            m.userId === id && self ? { ...m, userId: self.id } : m,
          ),
        })
      },

      setSelfUser: (id) =>
        set((s) => ({
          users: s.users.map((u) => ({ ...u, isSelf: u.id === id })),
        })),

      addMessage: (type) => {
        const self = get().users.find((u) => u.isSelf)
        const userId = self?.id ?? get().users[0]?.id ?? 'self'
        const msg = createMessage(type, userId)
        set((s) => ({
          messages: [...s.messages, msg],
          selectedMessageId: msg.id,
          activeTab: 'messages',
        }))
      },

      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? ({ ...m, ...patch } as Message) : m,
          ),
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
          phone: data.phone ?? s.phone,
          chat: data.chat ?? s.chat,
          messages: data.messages ?? s.messages,
        })),

      resetAll: () =>
        set({
          users: defaultUsers,
          phone: defaultPhone,
          chat: defaultChat,
          messages: defaultMessages.map((m) => ({ ...m, id: uid() })),
          selectedMessageId: null,
        }),
    }),
    {
      name: 'wechat-chat-generator',
      partialize: (s) => ({
        users: s.users,
        phone: s.phone,
        chat: s.chat,
        messages: s.messages,
      }),
    },
  ),
)
