import type { DoodleFrameStyle } from '../../../types/doodle'
import { ClassicAvatar } from './ClassicAvatar'
import { ClassicBubble } from './ClassicBubble'
import { SketchAvatar } from './SketchAvatar'
import { SketchFrameBubble } from './SketchBubble'

export function AvatarFrame(props: {
  style: DoodleFrameStyle
  url: string
  size: number
  side: 'left' | 'right'
  seed: string
}) {
  const { style, ...rest } = props
  return style === 'sketch' ? <SketchAvatar {...rest} /> : <ClassicAvatar {...rest} />
}

export function BubbleFrame(props: {
  style: DoodleFrameStyle
  content: string
  side: 'left' | 'right'
  color: string
  fontFamily: string
  fontSize: number
  seed: string
  maxWidth?: number
}) {
  const { style, ...rest } = props
  return style === 'sketch' ? <SketchFrameBubble {...rest} /> : <ClassicBubble {...rest} />
}

export { ClassicAvatar, ClassicBubble, SketchAvatar, SketchFrameBubble }
