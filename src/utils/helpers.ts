import { toPng } from 'html-to-image'

interface ScreenshotOptions {
  filename?: string
  backgroundColor?: string
}

export async function exportScreenshot(
  element: HTMLElement,
  options: ScreenshotOptions | string = {},
) {
  const opts = typeof options === 'string' ? { filename: options } : options
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor: opts.backgroundColor ?? '#000',
  })

  const link = document.createElement('a')
  link.download = opts.filename ?? '微信聊天截图.png'
  link.href = dataUrl
  link.click()
}

export async function copyScreenshot(element: HTMLElement, backgroundColor = '#000') {
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    cacheBust: true,
    backgroundColor,
  })

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
