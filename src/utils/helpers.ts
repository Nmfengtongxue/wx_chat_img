import { getFontEmbedCSS, toPng } from 'html-to-image'
import { bundledFontUrl, ensureFontLoaded } from './fonts'
import type { DoodleFont } from '../types/doodle'

export interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
  long?: boolean
  fitContent?: boolean
  /** 导出前加载字体（手绘模式） */
  font?: DoodleFont
}

/** 导出时从预览 DOM 同步到克隆体的关键样式（移动端 foreignObject 常丢失 CSS） */
const EXPORT_STYLE_PROPS = [
  'display',
  'flex-direction',
  'align-items',
  'justify-content',
  'flex',
  'flex-shrink',
  'flex-grow',
  'flex-basis',
  'width',
  'height',
  'min-width',
  'max-width',
  'min-height',
  'max-height',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'color',
  'background-color',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-radius',
  'box-sizing',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'transform',
  'white-space',
  'word-break',
  'overflow',
  'vertical-align',
  'text-align',
  'object-fit',
  'opacity',
  'z-index',
  'clip-path',
  'gap',
  'row-gap',
  'column-gap',
] as const

function isMobileDevice() {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  )
}

function getSafePixelRatio(width: number, height: number) {
  const dpr = window.devicePixelRatio || 1
  let ratio = isMobileDevice() ? Math.min(dpr, 2) : Math.min(dpr, 3)
  const maxSide = isMobileDevice() ? 8192 : 12000
  const maxArea = isMobileDevice() ? 16_000_000 : 40_000_000

  while (ratio > 1) {
    const w = width * ratio
    const h = height * ratio
    if (w <= maxSide && h <= maxSide && w * h <= maxArea) break
    ratio -= 0.25
  }
  return Math.max(1, ratio)
}

function readExportWidth(el: HTMLElement): number {
  const fromData = Number(el.dataset.exportWidth)
  if (fromData > 0) return fromData
  return Math.ceil(el.getBoundingClientRect().width) || el.offsetWidth || 390
}

function isElementNode(node: Node): node is HTMLElement | SVGElement {
  return node.nodeType === Node.ELEMENT_NODE
}

/** 将预览中已计算好的样式写入克隆体，保证 WYSIWYG */
function syncComputedStyles(sourceRoot: HTMLElement, cloneRoot: HTMLElement) {
  const sourceNodes = [sourceRoot, ...sourceRoot.querySelectorAll('*')]
  const cloneNodes = [cloneRoot, ...cloneRoot.querySelectorAll('*')]

  const len = Math.min(sourceNodes.length, cloneNodes.length)
  for (let i = 0; i < len; i++) {
    const src = sourceNodes[i]
    const dst = cloneNodes[i]
    if (!isElementNode(src) || !isElementNode(dst)) continue
    if (src.tagName !== dst.tagName) continue

    const cs = getComputedStyle(src)
    for (const prop of EXPORT_STYLE_PROPS) {
      const val = cs.getPropertyValue(prop)
      if (val) dst.style.setProperty(prop, val)
    }

    if (dst instanceof SVGElement && src instanceof SVGElement) {
      for (const attr of ['width', 'height', 'viewBox']) {
        const v = src.getAttribute(attr)
        if (v) dst.setAttribute(attr, v)
      }
    }

    if (dst.tagName === 'IMG' && src instanceof HTMLImageElement && dst instanceof HTMLImageElement) {
      dst.src = src.currentSrc || src.src
      if (src.crossOrigin) dst.crossOrigin = src.crossOrigin
    }
  }
}

function sanitizeClone(clone: HTMLElement) {
  clone.querySelectorAll('.pat-hint-float').forEach((el) => el.remove())

  clone.querySelectorAll<HTMLElement>('[class*="ring-emerald"]').forEach((el) => {
    el.className = el.className
      .split(/\s+/)
      .filter((c) => !c.startsWith('ring-') && !c.startsWith('ring-offset-'))
      .join(' ')
  })

  clone.querySelectorAll<HTMLElement>('.avatar-pat-bounce').forEach((el) => {
    el.classList.remove('avatar-pat-bounce')
  })
}

function createExportHost(source: HTMLElement, exportWidth: number) {
  const clone = source.cloneNode(true) as HTMLElement
  sanitizeClone(clone)
  syncComputedStyles(source, clone)

  clone.classList.add('screenshot-exporting')
  clone.style.setProperty('--export-width', `${exportWidth}px`)
  clone.style.width = `${exportWidth}px`
  clone.style.minWidth = `${exportWidth}px`
  clone.style.maxWidth = `${exportWidth}px`
  clone.style.boxSizing = 'border-box'
  clone.style.overflow = 'visible'
  clone.style.margin = '0'

  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText = [
    'position:fixed',
    'left:-100000px',
    'top:0',
    `width:${exportWidth}px`,
    'overflow:visible',
    'visibility:hidden',
    'pointer-events:none',
    'z-index:-1',
  ].join(';')
  host.appendChild(clone)
  document.body.appendChild(host)

  return { clone, cleanup: () => host.remove() }
}

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          const done = () => resolve()
          img.addEventListener('load', done, { once: true })
          img.addEventListener('error', done, { once: true })
          const src = img.getAttribute('src')
          if (src) {
            img.src = src
          }
        }),
    ),
  )
}

async function waitForStableLayout(el: HTMLElement) {
  await document.fonts.ready
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  void el.offsetHeight
  void el.scrollWidth
  void el.scrollHeight
}

async function buildFontEmbedCSS(element: HTMLElement): Promise<string | undefined> {
  try {
    const css = await getFontEmbedCSS(element, { cacheBust: true })
    if (css?.trim()) return css
  } catch {
    /* fallback below */
  }

  try {
    const res = await fetch(bundledFontUrl('fonts/huangyou-tangxin.ttf'))
    const buf = await res.arrayBuffer()
    const bytes = new Uint8Array(buf)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
    const b64 = btoa(binary)
    return `@font-face{font-family:'黄油溏心体';src:url(data:font/ttf;base64,${b64}) format('truetype');font-weight:normal;font-style:normal;}`
  } catch {
    return undefined
  }
}

export async function captureElementToPng(
  element: HTMLElement,
  options: {
    backgroundColor: string
    long?: boolean
    fitContent?: boolean
    font?: DoodleFont
  },
): Promise<string> {
  const long = options.long ?? true
  const fitContent = options.fitContent ?? true
  const exportWidth = readExportWidth(element)

  if (options.font) {
    await ensureFontLoaded(options.font)
  }
  await waitForStableLayout(element)

  const { clone, cleanup } = createExportHost(element, exportWidth)

  try {
    await waitForImages(clone)
    await waitForStableLayout(clone)

    const height =
      long && fitContent
        ? Math.max(clone.scrollHeight, clone.offsetHeight, element.scrollHeight)
        : Math.max(clone.offsetHeight, element.offsetHeight)

    clone.style.height = long && fitContent ? `${height}px` : ''

    const pixelRatio = getSafePixelRatio(exportWidth, height)
    const fontEmbedCSS = await buildFontEmbedCSS(clone)

    return await toPng(clone, {
      cacheBust: true,
      backgroundColor: options.backgroundColor,
      pixelRatio,
      fontEmbedCSS,
      skipFonts: false,
      style: {
        transform: 'none',
        margin: '0',
        overflow: 'visible',
        width: `${exportWidth}px`,
        minWidth: `${exportWidth}px`,
        maxWidth: `${exportWidth}px`,
        ...(long && fitContent ? { height: `${height}px` } : {}),
      },
    })
  } finally {
    cleanup()
  }
}

export async function exportScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions | string = {},
) {
  const opts = typeof options === 'string' ? { filename: options } : options
  const dataUrl = await captureElementToPng(element, {
    backgroundColor: opts.backgroundColor ?? '#000',
    long: opts.long ?? true,
    fitContent: opts.fitContent ?? true,
    font: opts.font,
  })

  const filename = opts.filename ?? '微信聊天截图.png'
  const blob = await (await fetch(dataUrl)).blob()

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()

  if (isMobileDevice()) {
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  } else {
    URL.revokeObjectURL(url)
  }
}

export async function copyScreenshot(
  element: HTMLElement,
  backgroundColor = '#000',
  long = true,
  fitContent = true,
  font?: DoodleFont,
) {
  const dataUrl = await captureElementToPng(element, {
    backgroundColor,
    long,
    fitContent,
    font,
  })

  const blob = await (await fetch(dataUrl)).blob()

  if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return
    } catch {
      // 移动端降级为下载
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '手绘对话.png'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatMoney(amount: number) {
  return amount.toFixed(2)
}

export function formatTimeText(msg: {
  year: string
  month: string
  day: string
  weekday: string
  period: string
  hour: string
  minute: string
}) {
  const parts: string[] = []
  if (msg.year && msg.month && msg.day) {
    parts.push(`${msg.year}年${msg.month}月${msg.day}日`)
  }
  if (msg.weekday) parts.push(msg.weekday)
  if (msg.period) parts.push(msg.period)
  if (msg.hour && msg.minute) {
    parts.push(`${msg.hour}:${msg.minute.padStart(2, '0')}`)
  }
  return parts.join(' ')
}
