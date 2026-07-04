import { getFontEmbedCSS, toPng } from 'html-to-image'
import { ensureFontLoaded } from './fonts'
import type { DoodleFont } from '../types/doodle'

export interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
  long?: boolean
  fitContent?: boolean
  font?: DoodleFont
}

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
] as const

function isMobileDevice() {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  )
}

function getSafePixelRatio(width: number, height: number) {
  if (isMobileDevice()) return 1
  const dpr = window.devicePixelRatio || 1
  let ratio = Math.min(dpr, 3)
  const maxSide = 12000
  const maxArea = 40_000_000
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

/** 把预览当前帧的计算样式写入克隆体，冻结手绘气泡 SVG 尺寸 */
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
      for (const attr of ['width', 'height', 'viewBox', 'style']) {
        const v = src.getAttribute(attr)
        if (v) dst.setAttribute(attr, v)
      }
    }

    if (dst.tagName === 'IMG' && src instanceof HTMLImageElement && dst instanceof HTMLImageElement) {
      dst.src = src.currentSrc || src.src
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
  clone.querySelectorAll('.avatar-pat-bounce').forEach((el) => {
    el.classList.remove('avatar-pat-bounce')
  })
}

function resetScrollChain(el: HTMLElement) {
  const saved: Array<{ node: HTMLElement; scrollTop: number; scrollLeft: number }> = []
  let node: HTMLElement | null = el
  while (node && node !== document.body) {
    if (node.scrollTop || node.scrollLeft) {
      saved.push({ node, scrollTop: node.scrollTop, scrollLeft: node.scrollLeft })
      node.scrollTop = 0
      node.scrollLeft = 0
    }
    node = node.parentElement
  }
  return () => {
    saved.forEach(({ node, scrollTop, scrollLeft }) => {
      node.scrollTop = scrollTop
      node.scrollLeft = scrollLeft
    })
  }
}

function unlockOverflowChain(el: HTMLElement) {
  const saved: Array<{
    node: HTMLElement
    overflow: string
    overflowY: string
    height: string
    maxHeight: string
  }> = []

  let node = el.parentElement
  while (node && node !== document.body) {
    const cs = getComputedStyle(node)
    const clipped =
      cs.overflow !== 'visible' ||
      cs.overflowY !== 'visible' ||
      cs.height !== 'auto' ||
      (cs.maxHeight !== 'none' && cs.maxHeight !== '0px')

    if (clipped) {
      saved.push({
        node,
        overflow: node.style.overflow,
        overflowY: node.style.overflowY,
        height: node.style.height,
        maxHeight: node.style.maxHeight,
      })
      node.style.overflow = 'visible'
      node.style.overflowY = 'visible'
      node.style.height = 'auto'
      node.style.maxHeight = 'none'
    }
    node = node.parentElement
  }

  return () => {
    saved.forEach(({ node, overflow, overflowY, height, maxHeight }) => {
      node.style.overflow = overflow
      node.style.overflowY = overflowY
      node.style.height = height
      node.style.maxHeight = maxHeight
    })
  }
}

function prepareLiveExportStyles(root: HTMLElement, exportWidth: number) {
  root.classList.add('screenshot-exporting')
  root.style.setProperty('--export-width', `${exportWidth}px`)

  const marked: HTMLElement[] = []
  root.querySelectorAll<HTMLElement>('[class*="ring-emerald"]').forEach((el) => {
    el.classList.add('screenshot-exporting')
    marked.push(el)
  })

  return () => {
    root.classList.remove('screenshot-exporting')
    root.style.removeProperty('--export-width')
    marked.forEach((el) => el.classList.remove('screenshot-exporting'))
  }
}

async function waitForStableLayout(el: HTMLElement) {
  await document.fonts.ready
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  void el.offsetHeight
  void el.scrollWidth
  void el.scrollHeight
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
        }),
    ),
  )
}

async function buildFontEmbedCSS(element: HTMLElement): Promise<string | undefined> {
  try {
    const css = await getFontEmbedCSS(element, { cacheBust: true })
    if (css?.trim()) return css
  } catch {
    /* ignore */
  }
  return undefined
}

async function isMostlyBlankPng(dataUrl: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const sampleW = Math.min(img.width, 160)
      const sampleH = Math.min(img.height, 160)
      if (sampleW < 8 || sampleH < 8) {
        resolve(true)
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = sampleW
      canvas.height = sampleH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(true)
        return
      }
      ctx.drawImage(img, 0, 0, sampleW, sampleH)
      const data = ctx.getImageData(0, 0, sampleW, sampleH).data
      let ink = 0
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3]!
        if (a < 12) continue
        const r = data[i]!
        const g = data[i + 1]!
        const b = data[i + 2]!
        if (r < 235 || g < 235 || b < 235) ink++
      }
      resolve(ink < 24)
    }
    img.onerror = () => resolve(true)
    img.src = dataUrl
  })
}

async function renderToPng(
  target: HTMLElement,
  opts: {
    backgroundColor: string
    exportWidth: number
    height: number
    fontEmbedCSS?: string
    pixelRatio: number
  },
): Promise<string> {
  return toPng(target, {
    cacheBust: true,
    backgroundColor: opts.backgroundColor,
    pixelRatio: opts.pixelRatio,
    fontEmbedCSS: opts.fontEmbedCSS,
    skipFonts: false,
    style: {
      transform: 'none',
      margin: '0',
      overflow: 'visible',
      width: `${opts.exportWidth}px`,
      minWidth: `${opts.exportWidth}px`,
      maxWidth: `${opts.exportWidth}px`,
      height: `${opts.height}px`,
    },
  })
}

/**
 * 策略 A（WYSIWYG）：克隆当前预览帧 → 同步样式 → 可见挂载 → 截图
 * 不修改原预览 DOM，不触发 resize，手绘 SVG 尺寸与预览一致
 */
async function captureFrozenClone(
  source: HTMLElement,
  options: {
    backgroundColor: string
    long: boolean
    fitContent: boolean
    font?: DoodleFont
  },
): Promise<string> {
  const exportWidth = readExportWidth(source)
  const height =
    options.long && options.fitContent
      ? Math.max(source.scrollHeight, source.offsetHeight, 1)
      : Math.max(source.offsetHeight, source.getBoundingClientRect().height, 1)

  const clone = source.cloneNode(true) as HTMLElement
  sanitizeClone(clone)
  syncComputedStyles(source, clone)

  clone.classList.add('screenshot-exporting')
  clone.style.setProperty('--export-width', `${exportWidth}px`)
  clone.style.width = `${exportWidth}px`
  clone.style.minWidth = `${exportWidth}px`
  clone.style.maxWidth = `${exportWidth}px`
  clone.style.height = `${height}px`
  clone.style.boxSizing = 'border-box'
  clone.style.overflow = 'visible'
  clone.style.margin = '0'
  clone.style.background = options.backgroundColor

  const host = document.createElement('div')
  host.id = 'screenshot-export-host'
  host.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${exportWidth}px`,
    'overflow:visible',
    'z-index:2147483646',
    'pointer-events:none',
  ].join(';')
  host.appendChild(clone)
  document.body.appendChild(host)

  try {
    await waitForImages(clone)
    await waitForStableLayout(clone)

    const pixelRatio = getSafePixelRatio(exportWidth, height)
    const fontEmbedCSS = await buildFontEmbedCSS(source)

    return await renderToPng(clone, {
      backgroundColor: options.backgroundColor,
      exportWidth,
      height,
      fontEmbedCSS,
      pixelRatio,
    })
  } finally {
    host.remove()
  }
}

/**
 * 策略 B（回退）：直接截可见节点 + 解除 overflow（旧版能出图的路径）
 * 不触发 resize，尽量减少布局漂移
 */
async function captureLiveElement(
  element: HTMLElement,
  options: {
    backgroundColor: string
    long: boolean
    fitContent: boolean
  },
): Promise<string> {
  const exportWidth = readExportWidth(element)
  const restoreScroll = resetScrollChain(element)
  const restoreOverflow = unlockOverflowChain(element)
  const restoreStyles = prepareLiveExportStyles(element, exportWidth)

  try {
    await waitForImages(element)
    await waitForStableLayout(element)

    const height =
      options.long && options.fitContent
        ? Math.max(element.scrollHeight, element.offsetHeight, 1)
        : Math.max(element.offsetHeight, element.getBoundingClientRect().height, 1)

    const pixelRatio = getSafePixelRatio(exportWidth, height)
    const fontEmbedCSS = await buildFontEmbedCSS(element)

    return await renderToPng(element, {
      backgroundColor: options.backgroundColor,
      exportWidth,
      height,
      fontEmbedCSS,
      pixelRatio,
    })
  } finally {
    restoreStyles()
    restoreOverflow()
    restoreScroll()
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
  const opts = {
    backgroundColor: options.backgroundColor,
    long: options.long ?? true,
    fitContent: options.fitContent ?? true,
    font: options.font,
  }

  if (opts.font) {
    await ensureFontLoaded(opts.font)
  }
  await waitForStableLayout(element)

  document.body.classList.add('is-exporting-screenshot')

  try {
    let dataUrl = await captureFrozenClone(element, opts)
    if (!(await isMostlyBlankPng(dataUrl))) {
      return dataUrl
    }

    dataUrl = await captureLiveElement(element, opts)
    if (!(await isMostlyBlankPng(dataUrl))) {
      return dataUrl
    }

    // 最后回退：无 fontEmbed
    const exportWidth = readExportWidth(element)
    const height = Math.max(element.scrollHeight, element.offsetHeight, 1)
    const restoreScroll = resetScrollChain(element)
    const restoreOverflow = unlockOverflowChain(element)
    const restoreStyles = prepareLiveExportStyles(element, exportWidth)
    try {
      dataUrl = await renderToPng(element, {
        backgroundColor: opts.backgroundColor,
        exportWidth,
        height,
        fontEmbedCSS: undefined,
        pixelRatio: 1,
      })
    } finally {
      restoreStyles()
      restoreOverflow()
      restoreScroll()
    }

    if (await isMostlyBlankPng(dataUrl)) {
      throw new Error('截图内容为空')
    }
    return dataUrl
  } finally {
    document.body.classList.remove('is-exporting-screenshot')
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
    setTimeout(() => URL.revokeObjectURL(url), 8000)
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
      /* fallback */
    }
  }

  await exportScreenshot(element, {
    filename: '手绘对话.png',
    backgroundColor,
    long,
    fitContent,
    font,
  })
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
