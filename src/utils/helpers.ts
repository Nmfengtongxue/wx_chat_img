import { getFontEmbedCSS, toPng } from 'html-to-image'

export interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
  long?: boolean
  fitContent?: boolean
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

/** 避免移动端 canvas 超大导致导出空白或变形 */
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

/** 导出前重置滚动，避免移动端只截到可视区域片段 */
function resetScrollChain(el: HTMLElement): RestoreFn {
  const saved: Array<{ node: HTMLElement; scrollTop: number; scrollLeft: number }> = []
  let node: HTMLElement | null = el
  while (node && node !== document.body) {
    if (node.scrollTop || node.scrollLeft) {
      saved.push({
        node,
        scrollTop: node.scrollTop,
        scrollLeft: node.scrollLeft,
      })
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

/** 导出前解除父级 overflow 裁剪，否则移动端常只截到可视区域且布局错乱 */
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

/** 导出前清理阴影/选框，避免 html-to-image 出现矩形灰块 */
function prepareScreenshotStyles(root: HTMLElement): RestoreFn {
  root.classList.add('screenshot-exporting')

  const marked: HTMLElement[] = []
  root.querySelectorAll<HTMLElement>('[class*="ring-emerald"]').forEach((el) => {
    el.classList.add('screenshot-exporting')
    marked.push(el)
  })

  return () => {
    root.classList.remove('screenshot-exporting')
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

function measureExportSize(el: HTMLElement, fitContent: boolean) {
  const width = Math.ceil(el.getBoundingClientRect().width) || el.scrollWidth
  const height = fitContent
    ? Math.ceil(el.scrollHeight)
    : Math.ceil(el.getBoundingClientRect().height) || el.scrollHeight
  return { width: Math.max(width, 1), height: Math.max(height, 1) }
}

export async function captureElementToPng(
  element: HTMLElement,
  options: {
    backgroundColor: string
    long?: boolean
    fitContent?: boolean
  },
): Promise<string> {
  const long = options.long ?? true
  const fitContent = options.fitContent ?? true

  await waitForStableLayout(element)

  const restoreScroll = resetScrollChain(element)
  const restoreOverflow = unlockOverflowChain(element)
  const restoreStyles = prepareScreenshotStyles(element)

  try {
    await waitForStableLayout(element)

    const { width, height } = measureExportSize(element, long && fitContent)
    const pixelRatio = getSafePixelRatio(width, height)

    let fontEmbedCSS: string | undefined
    try {
      fontEmbedCSS = await getFontEmbedCSS(element, { cacheBust: true })
    } catch {
      fontEmbedCSS = undefined
    }

    return await toPng(element, {
      cacheBust: true,
      backgroundColor: options.backgroundColor,
      pixelRatio,
      width,
      height,
      fontEmbedCSS,
      style: {
        transform: 'none',
        margin: '0',
        overflow: 'visible',
      },
      skipFonts: false,
    })
  } finally {
    restoreStyles()
    restoreOverflow()
    restoreScroll()
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
  })

  const filename = opts.filename ?? '微信聊天截图.png'
  const blob = await (await fetch(dataUrl)).blob()

  // 移动端 Safari 对 download 属性支持差，使用 Blob URL + 点击；仍失败则新窗口打开
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
) {
  const dataUrl = await captureElementToPng(element, {
    backgroundColor,
    long,
    fitContent,
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
