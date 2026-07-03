import { getPresetByFilename } from './avatarBurstPresets'
import type { AvatarBurstPreset } from '../effects/types'
import { matchAvatarPreset } from './avatarPresets'

export interface ResolvedAvatarBurst {
  preset: AvatarBurstPreset
  avatarSrc: string
  patLabel: string
}

export function resolveBurstForAvatar(url: string): ResolvedAvatarBurst | null {
  const matched = matchAvatarPreset(url)
  if (!matched) return null

  const base = getPresetByFilename(matched.filename)
  if (!base) return null

  return {
    preset: { ...base },
    avatarSrc: base.avatarSrc,
    patLabel: `拍了拍 ${matched.label.replace(/·/g, '')}`,
  }
}

export function hasAvatarBurstEffect(url: string): boolean {
  return resolveBurstForAvatar(url) !== null
}

export { AVATAR_BURST_PRESETS, getPresetByFilename } from './avatarBurstPresets'
