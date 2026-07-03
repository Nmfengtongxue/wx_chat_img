import catalog from './avatarCatalog.json'

export interface AvatarCategory {
  id: string
  label: string
  description: string
}

export interface AvatarPreset {
  id: string
  categoryId: string
  filename: string
  /** 展示名，如「害羞·腮红小鲨鱼」 */
  label: string
  url: string
}

export function avatarPresetUrl(categoryId: string, filename: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}avatars/presets/${encodeURIComponent(categoryId)}/${encodeURIComponent(filename)}`
}

function categoryLabel(id: string): string {
  return id.replace(/^\d+-/, '')
}

function presetLabel(filename: string): string {
  return filename.replace(/\.(jpe?g|png|webp)$/i, '').replace(/-/g, '·')
}

function presetId(categoryId: string, filename: string): string {
  return `${categoryId}/${filename}`
}

export const AVATAR_CATEGORIES: AvatarCategory[] = Object.entries(catalog.分类说明)
  .map(([id, description]) => ({
    id,
    label: categoryLabel(id),
    description: description as string,
  }))
  .sort((a, b) => a.id.localeCompare(b.id, 'zh-CN'))

export const AVATAR_PRESETS: AvatarPreset[] = catalog.文件.map((item) => ({
  id: presetId(item.分类, item.新文件名),
  categoryId: item.分类,
  filename: item.新文件名,
  label: presetLabel(item.新文件名),
  url: avatarPresetUrl(item.分类, item.新文件名),
}))

export function getAvatarsByCategory(categoryId: string): AvatarPreset[] {
  return AVATAR_PRESETS.filter((a) => a.categoryId === categoryId)
}

/** 判断当前头像是否来自内置库（用于高亮选中态） */
export function matchAvatarPreset(url: string): AvatarPreset | undefined {
  if (!url || url.startsWith('data:')) return undefined
  const normalized = decodeURIComponent(url.split('?')[0] ?? '')
  return AVATAR_PRESETS.find((p) => normalized.endsWith(`${p.categoryId}/${p.filename}`))
}
