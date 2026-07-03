/** 加载上传的字体文件 */
export async function loadFontFromDataUrl(family: string, dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl)
  const buffer = await res.arrayBuffer()
  const face = new FontFace(family, buffer)
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

  // 优先展示手写/卡通类字体
  const keywords = ['hand', 'script', 'comic', 'draw', 'cute', 'happy', 'zhanku', '站酷', '快乐', '娃娃', 'annotate', 'marker', 'brush', 'crayon']
  const sorted = [...fonts].sort((a, b) => {
    const score = (f: FontMetadata) => {
      const s = `${f.family} ${f.fullName} ${f.postscriptName}`.toLowerCase()
      return keywords.some((k) => s.includes(k)) ? 1 : 0
    }
    return score(b) - score(a)
  })

  // 去重 family
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

/** 常用手写风格字体预设（前四项为推荐） */
export const FONT_PRESETS = [
  {
    label: '祝你我明媚向春天（默认）',
    family: '"Aa祝你我明媚向春天", "PingFang SC", sans-serif',
  },
  {
    label: '无题诗序',
    family: '"Aa无题诗序", "无题诗序", "PingFang SC", sans-serif',
  },
  {
    label: '明朝体',
    family: '"汇文明朝体GBK", "Huiwen-MinchoGBK", serif',
  },
  {
    label: '得意黑',
    family: '"Smiley Sans", "得意黑", sans-serif',
  },
  { label: '系统默认（苹方）', family: '"PingFang SC", "Microsoft YaHei", sans-serif' },
  { label: 'Hannotate SC（手札体）', family: '"Hannotate SC", "PingFang SC", sans-serif' },
  { label: 'HanziPen SC（翩翩体）', family: '"HanziPen SC", "PingFang SC", sans-serif' },
  { label: 'Kaiti SC（楷体）', family: '"Kaiti SC", "STKaiti", serif' },
  { label: 'Comic Sans MS', family: '"Comic Sans MS", cursive' },
  { label: 'Marker Felt', family: '"Marker Felt", cursive' },
]

/** 默认字体预设 */
export const DEFAULT_FONT_PRESET = FONT_PRESETS[0]

/** 确保已加载的自定义字体应用到页面 */
export async function ensureFontLoaded(font: {
  family: string
  dataUrl?: string
}): Promise<string> {
  if (font.dataUrl && !font.family.startsWith('"')) {
    try {
      const loaded = [...document.fonts].some((f) => f.family === font.family)
      if (!loaded) {
        await loadFontFromDataUrl(font.family, font.dataUrl)
      }
    } catch {
      // fallback to family name only
    }
    return `"${font.family}", "PingFang SC", sans-serif`
  }
  return font.family.includes('"') ? font.family : `"${font.family}", "PingFang SC", sans-serif`
}
