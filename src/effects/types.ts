export type ParticleKind = 'avatar' | 'emoji' | 'bubble' | 'stroke' | 'text'

export type MotionMode = 'rise' | 'fall' | 'bounce' | 'burst' | 'swirl'

export interface AvatarBurstPreset {
  id: string
  filename?: string
  name: string
  category: string
  emotion: string
  avatarSrc: string
  overlayColor: string
  accentColors: string[]
  motion: MotionMode
  /** 同时存在的粒子数量上限 */
  maxParticles: number
  /** 每秒生成粒子数 */
  spawnRate: number
  emojiPool?: string[]
  textPool?: string[]
  avatarWeight: number
  /** 0-1 背景动态强度 */
  bgPulse?: number
}

export interface Particle {
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  vr: number
  opacity: number
  life: number
  maxLife: number
  color: string
  char?: string
  wobble: number
  wobbleSpeed: number
  baseOpacity: number
}
