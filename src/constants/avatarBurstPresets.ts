import raw from './avatarBurstPresets.json'
import type { AvatarBurstPreset } from '../effects/types'

interface RawBurstPreset extends Omit<AvatarBurstPreset, 'avatarSrc'> {
  avatarSrc: string
}

function withBaseUrl(p: RawBurstPreset): AvatarBurstPreset {
  const path = p.avatarSrc.startsWith('/') ? p.avatarSrc.slice(1) : p.avatarSrc
  return {
    ...p,
    avatarSrc: `${import.meta.env.BASE_URL}${path}`,
  }
}

export const AVATAR_BURST_PRESETS: AvatarBurstPreset[] = (
  raw.presets as RawBurstPreset[]
).map(withBaseUrl)

const byId = new Map(AVATAR_BURST_PRESETS.map((p) => [p.id, p]))
const byFilename = new Map(AVATAR_BURST_PRESETS.map((p) => [p.filename, p]))

/** 演示页保留前 3 个经典样例 */
export const SAMPLE_PRESETS = AVATAR_BURST_PRESETS.filter((p) =>
  ['害羞-腮红小鲨鱼', '嗨唱-耳机白狗', '惊恐-呐喊小猪'].includes(p.id),
)

export function getPresetById(id: string): AvatarBurstPreset | undefined {
  return byId.get(id)
}

export function getPresetByFilename(filename: string): AvatarBurstPreset | undefined {
  return byFilename.get(filename)
}

export function hasPresetForFilename(filename: string): boolean {
  return byFilename.has(filename)
}

export function getPresetsByCategory(categoryId: string): AvatarBurstPreset[] {
  return AVATAR_BURST_PRESETS.filter((p) => p.category === categoryId)
}
