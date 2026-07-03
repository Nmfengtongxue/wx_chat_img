import { toPng } from 'html-to-image'

interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
  /** 长截图：按元素完整 scroll 尺寸导出 */
  long?: boolean
  /** 贴合内容高度，不保留空白底（短对话时裁到最后一条） */
  fitContent?: boolean
}

function captureOptions(
  element: HTMLElement,
  backgroundColor: string,
  long: boolean,
  fitContent: boolean,
) {
  const base = {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor,
  }
  if (!long) return base

  const width = element.scrollWidth
  const height = fitContent ? element.scrollHeight : element.scrollHeight

  return {
    ...base,
    width,
    height,
  }
}

export async function exportScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions | string = {},
) {
  const opts = typeof options === 'string' ? { filename: options } : options
  const long = opts.long ?? true
  const fitContent = opts.fitContent ?? true
  const dataUrl = await toPng(
    element,
    captureOptions(element, opts.backgroundColor ?? '#000', long, fitContent),
  )

  const link = document.createElement('a')
  link.download = opts.filename ?? '微信聊天截图.png'
  link.href = dataUrl
  link.click()
}

export async function copyScreenshot(
  element: HTMLElement,
  backgroundColor = '#000',
  long = true,
  fitContent = true,
) {
  const dataUrl = await toPng(
    element,
    captureOptions(element, backgroundColor, long, fitContent),
  )

  const res = await fetch(dataUrl)
  const blob = await res.blob()
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': blob }),
  ])
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
