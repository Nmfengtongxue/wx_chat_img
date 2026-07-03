export type MessageType = 'text' | 'image' | 'voice' | 'redpacket' | 'transfer' | 'time'

export type NetworkType = 'wifi' | '3g' | '4g' | '5g'

export interface User {
  id: string
  name: string
  avatar: string
  isSelf: boolean
}

export interface PhoneSettings {
  signalBars: 1 | 2 | 3 | 4
  networkType: NetworkType
  wifiBars: 1 | 2 | 3
  timeHour: string
  timeMinute: string
  battery: number
  charging: boolean
  earpieceMode: boolean
  unreadCount: number
}

export interface ChatSettings {
  title: string
  voiceMode: boolean
  background: string
}

export interface BaseMessage {
  id: string
  type: MessageType
  userId: string
}

export interface TextMessage extends BaseMessage {
  type: 'text'
  content: string
}

export interface ImageMessage extends BaseMessage {
  type: 'image'
  imageUrl: string
}

export interface VoiceMessage extends BaseMessage {
  type: 'voice'
  duration: number
  isRead: boolean
}

export interface RedPacketMessage extends BaseMessage {
  type: 'redpacket'
  amount?: number
  remark: string
  claimed: boolean
}

export interface TransferMessage extends BaseMessage {
  type: 'transfer'
  amount: number
  remark: string
  claimed: boolean
}

export interface TimeMessage extends BaseMessage {
  type: 'time'
  year: string
  month: string
  day: string
  weekday: string
  period: '上午' | '下午' | '凌晨' | ''
  hour: string
  minute: string
}

export type Message =
  | TextMessage
  | ImageMessage
  | VoiceMessage
  | RedPacketMessage
  | TransferMessage
  | TimeMessage

export interface ChatState {
  users: User[]
  phone: PhoneSettings
  chat: ChatSettings
  messages: Message[]
  selectedMessageId: string | null
}
