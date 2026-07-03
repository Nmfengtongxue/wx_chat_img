/** 加载上传的字体文件 */
export async function loadFontFromDataUrl(family: string, dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl)
  const buffer = await res.arrayBuffer()
  const face = new FontFace(family, buffer)
  await face.load()
  document.fonts.add(face)
}

/** 从 URL 加载字体（含 public 目录内置字体） */
export async function loadFontFromUrl(family: string, url: string): Promise<void> {
  const loaded = [...document.fonts].some((f) => f.family === family)
  if (loaded) return
  const face = new FontFace(family, `url(${url})`)
  await face.load()
  document.fonts.add(face)
}

/** 从本地文件加载字体 */
export async function loadFontFromFile(file: File): Promise<{ family: string; dataUrl: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const family = `DoodleFont_${baseName}_${Date.now()}`
  await loadFontFromDataUrl(family, dataUrl)
  return { family, dataUrl }
}

/** Local Font Access API 类型 */
interface FontMetadata {
  family: string
  fullName: string
  postscriptName: string
  style: string
}

declare global {
  interface Window {
    queryLocalFonts?: (options?: { postscriptNames?: string[] }) => Promise<FontMetadata[]>
  }
}

export function supportsLocalFonts(): boolean {
  return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function'
}

/** 浏览并选择系统已安装字体 */
export async function pickLocalFont(): Promise<DoodleFontPick | null> {
  if (!window.queryLocalFonts) return null

  const fonts = await window.queryLocalFonts()
  if (fonts.length === 0) return null

  const keywords = ['hand', 'script', 'comic', 'draw', 'cute', 'happy', 'zhanku', '站酷', '快乐', '娃娃', 'annotate', 'marker', 'brush', 'crayon', '黄油', '溏心']
  const sorted = [...fonts].sort((a, b) => {
    const score = (f: FontMetadata) => {
      const s = `${f.family} ${f.fullName} ${f.postscriptName}`.toLowerCase()
      return keywords.some((k) => s.includes(k)) ? 1 : 0
    }
    return score(b) - score(a)
  })

  const seen = new Set<string>()
  const unique = sorted.filter((f) => {
    if (seen.has(f.family)) return false
    seen.add(f.family)
    return true
  })

  return { fonts: unique }
}

export interface DoodleFontPick {
  fonts: FontMetadata[]
}

export interface FontPreset {
  id: string
  label: string
  family: string
  /** FontFace 注册名 */
  loadFamily?: string
  /** public 目录相对路径 */
  bundledPath?: string
}

/** 内置字体预设 */
export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'huangyou-tangxin',
    label: '黄油溏心体（默认）',
    family: '"黄油溏心体", "PingFang SC", sans-serif',
    loadFamily: '黄油溏心体',
    bundledPath: 'fonts/huangyou-tangxin.ttf',
  },
  {
    id: 'mingmei',
    label: '祝你我明媚向春天',
    family: '"Aa祝你我明媚向春天", "PingFang SC", sans-serif',
  },
  {
    id: 'wutishixu',
    label: '无题诗序',
    family: '"Aa无题诗序", "无题诗序", "PingFang SC", sans-serif',
  },
  {
    id: 'mincho',
    label: '明朝体',
    family: '"汇文明朝体GBK", "Huiwen-MinchoGBK", serif',
  },
  {
    id: 'smiley',
    label: '得意黑',
    family: '"Smiley Sans", "得意黑", sans-serif',
  },
  { id: 'pingfang', label: '系统默认（苹方）', family: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { id: 'hannotate', label: 'Hannotate SC（手札体）', family: '"Hannotate SC", "PingFang SC", sans-serif' },
  { id: 'hanzipen', label: 'HanziPen SC（翩翩体）', family: '"HanziPen SC", "PingFang SC", sans-serif' },
  { id: 'kaiti', label: 'Kaiti SC（楷体）', family: '"Kaiti SC", "STKaiti", serif' },
]

/** 默认字体预设 */
export const DEFAULT_FONT_PRESET = FONT_PRESETS[0]

export function bundledFontUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.startsWith('/') ? path.slice(1) : path}`
}

/** 注入 @font-face，确保 html-to-image 在移动端能嵌入字体 */
export function injectBundledFontFaces() {
  if (document.getElementById('bundled-font-faces')) return
  const style = document.createElement('style')
  style.id = 'bundled-font-faces'
  style.textContent = `
@font-face {
  font-family: '黄油溏心体';
  src: url('${bundledFontUrl('fonts/huangyou-tangxin.ttf')}') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`
  document.head.appendChild(style)
}

export function fontPresetToSettings(preset: FontPreset) {
  return {
    family: preset.family,
    loadFamily: preset.loadFamily,
    bundledPath: preset.bundledPath,
    presetId: preset.id,
    dataUrl: undefined,
    postscriptName: undefined,
  }
}

export function matchFontPreset(font: {
  family: string
  presetId?: string
  bundledPath?: string
}): FontPreset | undefined {
  if (font.presetId) {
    return FONT_PRESETS.find((p) => p.id === font.presetId)
  }
  if (font.bundledPath) {
    return FONT_PRESETS.find((p) => p.bundledPath === font.bundledPath)
  }
  return FONT_PRESETS.find((p) => p.family === font.family)
}

/** 加载预设/自定义字体并返回 CSS font-family */
export async function ensureFontLoaded(font: {
  family: string
  loadFamily?: string
  dataUrl?: string
  bundledPath?: string
}): Promise<string> {
  const registerName = font.loadFamily ?? font.family.replace(/"/g, '').split(',')[0]?.trim()

  if (font.bundledPath && registerName) {
    try {
      await loadFontFromUrl(registerName, bundledFontUrl(font.bundledPath))
    } catch {
      // fallback to family stack
    }
    return font.family.includes('"') ? font.family : `"${font.family}", "PingFang SC", sans-serif`
  }

  if (font.dataUrl && registerName && !font.family.startsWith('"')) {
    try {
      await loadFontFromDataUrl(registerName, font.dataUrl)
    } catch {
      // fallback
    }
    return `"${registerName}", "PingFang SC", sans-serif`
  }

  return font.family.includes('"') ? font.family : `"${font.family}", "PingFang SC", sans-serif`
}

/** 应用字体预设（加载内置字体并返回 store 更新对象） */
export async function applyFontPreset(preset: FontPreset) {
  const settings = fontPresetToSettings(preset)
  if (preset.bundledPath && preset.loadFamily) {
    await loadFontFromUrl(preset.loadFamily, bundledFontUrl(preset.bundledPath))
  }
  return settings
}
