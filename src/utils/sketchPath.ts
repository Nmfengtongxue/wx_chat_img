/** 字符串转稳定数字种子 */
export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) || 1
}

function seededRandom(seed: number) {
  let s = seed % 2147483646 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** 手绘不规则圆角矩形路径 */
export function sketchRoundedRectPath(
  w: number,
  h: number,
  seed: number,
  options: { radius?: number; wobble?: number; segments?: number } = {},
): string {
  const { radius = Math.min(22, w * 0.28, h * 0.4), wobble = 2.8, segments = 28 } = options
  const rand = seededRandom(seed)
  const pts: [number, number][] = []

  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const cx = w / 2
    const cy = h / 2
    const rx = w / 2 - 3
    const ry = h / 2 - 3
    const cornerFactor = Math.min(
      1,
      Math.abs(Math.cos(t * 2)) * 0.55 + Math.abs(Math.sin(t * 2)) * 0.55,
    )
    const r = radius * cornerFactor + 6
    const bx = cx + Math.cos(t) * (rx - r * 0.15)
    const by = cy + Math.sin(t) * (ry - r * 0.15)
    const jx = (rand() - 0.5) * wobble
    const jy = (rand() - 0.5) * wobble
    pts.push([Math.max(2, Math.min(w - 2, bx + jx)), Math.max(2, Math.min(h - 2, by + jy))])
  }

  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const mx = (x0 + x1) / 2 + (rand() - 0.5) * wobble * 0.4
    const my = (y0 + y1) / 2 + (rand() - 0.5) * wobble * 0.4
    d += ` Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`
  }
  d += ' Z'
  return d
}

/** 手绘方形头像框路径 */
export function sketchSquarePath(size: number, seed: number): string {
  return sketchRoundedRectPath(size, size, seed, {
    radius: 4,
    wobble: 2.2,
    segments: 20,
  })
}

/** 气泡尾巴路径（相对坐标，指向左侧） */
export function sketchBubbleTailPath(
  side: 'left' | 'right',
  y: number,
  color: string,
): { path: string; fill: string } {
  const baseY = y
  if (side === 'left') {
    return {
      path: `M 0 ${baseY - 6} C -2 ${baseY - 2} -1 ${baseY + 4} 2 ${baseY + 10} L 8 ${baseY + 2} Z`,
      fill: color,
    }
  }
  return {
    path: `M 0 ${baseY - 6} C 2 ${baseY - 2} 1 ${baseY + 4} -2 ${baseY + 10} L -8 ${baseY + 2} Z`,
    fill: color,
  }
}
