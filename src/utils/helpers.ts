import { toPng } from 'html-to-image'

interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
  /** 长截图：按元素完整 scroll 尺寸导出 */
  long?: boolean
}

function captureOptions(element: HTMLElement, backgroundColor: string, long: boolean) {
  const base = {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor,
  }
  if (!long) return base
  return {
    ...base,
    width: element.scrollWidth,
    height: element.scrollHeight,
  }
}

export async function exportScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions | string = {},
) {
  const opts = typeof options === 'string' ? { filename: options } : options
  const long = opts.long ?? true
  const dataUrl = await toPng(element, captureOptions(element, opts.backgroundColor ?? '#000', long))

  const link = document.createElement('a')
  link.download = opts.filename ?? '微信聊天截图.png'
  link.href = dataUrl
  link.click()
}

export async function copyScreenshot(
  element: HTMLElement,
  backgroundColor = '#000',
  long = true,
) {
  const dataUrl = await toPng(element, captureOptions(element, backgroundColor, long))

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
