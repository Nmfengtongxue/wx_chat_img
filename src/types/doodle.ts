export interface DoodleUser {
  id: string
  side: 'left' | 'right'
  name: string
  avatar: string
}

export interface DoodleMessage {
  id: string
  userId: string
  content: string
}

export type DoodleFrameStyle = 'classic' | 'sketch'

export interface DoodleFont {
  /** CSS font-family 名称 */
  family: string
  /** 上传字体的 base64 data URL，用于持久化 */
  dataUrl?: string
  /** Local Font Access API 返回的 postscript 名 */
  postscriptName?: string
}

export interface DoodleSettings {
  timeHour: string
  timeMinute: string
  /** 时间分隔符，如 ":" 或 " : " */
  timeSeparator: string
  showTopTime: boolean
  font: DoodleFont
  bubbleColor: string
  canvasWidth: number
  avatarSize: number
  bubbleFontSize: number
  /** 头像框样式：classic 标准方框 / sketch 手绘不规则 */
  avatarFrameStyle: DoodleFrameStyle
  /** 气泡框样式：classic 标准圆角 / sketch 手绘不规则（随文字自适应） */
  bubbleFrameStyle: DoodleFrameStyle
}

export interface DoodleState {
  users: DoodleUser[]
  settings: DoodleSettings
  messages: DoodleMessage[]
  selectedMessageId: string | null
}
