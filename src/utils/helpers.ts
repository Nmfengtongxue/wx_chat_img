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

interface RestoreFn {
  (): void
}

function isMobileDevice() {
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768)
  )
}

function getSafePixelRatio(width: number, height: number) {
  // 移动端用 1 更稳，避免 canvas 超限导致空白
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

function resetScrollChain(el: HTMLElement): RestoreFn {
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

function unlockOverflowChain(el: HTMLElement): RestoreFn {
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

function prepareScreenshotStyles(root: HTMLElement, exportWidth: number): RestoreFn {
  root.classList.add('screenshot-exporting')
  root.style.setProperty('--export-width', `${exportWidth}px`)

  const marked: HTMLElement[] = []
  root.querySelectorAll<HTMLElement>('[class*="ring-emerald"]').forEach((el) => {
    el.classList.add('screenshot-exporting')
    marked.push(el)
  })

  root.querySelectorAll('.pat-hint-float').forEach((el) => {
    ;(el as HTMLElement).style.display = 'none'
  })

  return () => {
    root.classList.remove('screenshot-exporting')
    root.style.removeProperty('--export-width')
    marked.forEach((el) => el.classList.remove('screenshot-exporting'))
    root.querySelectorAll('.pat-hint-float').forEach((el) => {
      ;(el as HTMLElement).style.display = ''
    })
  }
}

function lockElementWidth(el: HTMLElement, exportWidth: number): RestoreFn {
  const saved = {
    width: el.style.width,
    minWidth: el.style.minWidth,
    maxWidth: el.style.maxWidth,
    boxSizing: el.style.boxSizing,
    overflow: el.style.overflow,
  }
  el.style.width = `${exportWidth}px`
  el.style.minWidth = `${exportWidth}px`
  el.style.maxWidth = `${exportWidth}px`
  el.style.boxSizing = 'border-box'
  el.style.overflow = 'visible'
  return () => {
    el.style.width = saved.width
    el.style.minWidth = saved.minWidth
    el.style.maxWidth = saved.maxWidth
    el.style.boxSizing = saved.boxSizing
    el.style.overflow = saved.overflow
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

async function renderElementToPng(
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

/** 直接截取可见预览节点（移动端 Safari 必须可见才能绘制） */
async function captureVisibleElement(
  element: HTMLElement,
  options: {
    backgroundColor: string
    long: boolean
    fitContent: boolean
    font?: DoodleFont
  },
): Promise<string> {
  const exportWidth = readExportWidth(element)

  if (options.font) {
    await ensureFontLoaded(options.font)
  }
  await waitForStableLayout(element)

  const restoreScroll = resetScrollChain(element)
  const restoreOverflow = unlockOverflowChain(element)
  const restoreWidth = lockElementWidth(element, exportWidth)
  const restoreStyles = prepareScreenshotStyles(element, exportWidth)

  try {
    await waitForImages(element)
    window.dispatchEvent(new Event('resize'))
    await waitForStableLayout(element)

    const height =
      options.long && options.fitContent
        ? Math.max(element.scrollHeight, element.offsetHeight, 1)
        : Math.max(element.offsetHeight, element.getBoundingClientRect().height, 1)

    const pixelRatio = getSafePixelRatio(exportWidth, height)
    const fontEmbedCSS = await buildFontEmbedCSS(element)

    const dataUrl = await renderElementToPng(element, {
      backgroundColor: options.backgroundColor,
      exportWidth,
      height,
      fontEmbedCSS,
      pixelRatio,
    })

    if (!(await isMostlyBlankPng(dataUrl))) {
      return dataUrl
    }

    // 回退：去掉 fontEmbed 再试（部分 iOS 会因字体内联失败而空白）
    const retry = await renderElementToPng(element, {
      backgroundColor: options.backgroundColor,
      exportWidth,
      height,
      fontEmbedCSS: undefined,
      pixelRatio: 1,
    })
    if (!(await isMostlyBlankPng(retry))) {
      return retry
    }

    throw new Error('截图内容为空')
  } finally {
    restoreStyles()
    restoreWidth()
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
  return captureVisibleElement(element, {
    backgroundColor: options.backgroundColor,
    long: options.long ?? true,
    fitContent: options.fitContent ?? true,
    font: options.font,
  })
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

  if (isMobileDevice()) {
    // iOS Safari 对 download 支持差，新窗口打开更可靠
    const url = URL.createObjectURL(blob)
    const opened = window.open(url, '_blank')
    if (!opened) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
    setTimeout(() => URL.revokeObjectURL(url), 8000)
    return
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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
      // 移动端降级
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
