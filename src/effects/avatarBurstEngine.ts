import type { AvatarBurstPreset, Particle, ParticleKind } from './types'

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export class AvatarBurstEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private preset: AvatarBurstPreset
  private avatar: HTMLImageElement
  private container: HTMLElement
  private particles: Particle[] = []
  private running = false
  private raf = 0
  private lastTime = 0
  private spawnAcc = 0
  private w = 0
  private h = 0
  private dpr = 1
  /** 相对 375px 聊天区宽度的缩放 */
  private scale = 1

  constructor(
    canvas: HTMLCanvasElement,
    preset: AvatarBurstPreset,
    avatar: HTMLImageElement,
    container: HTMLElement,
  ) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    this.ctx = ctx
    this.preset = preset
    this.avatar = avatar
    this.container = container
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.w = this.container.clientWidth
    this.h = this.container.clientHeight
    this.scale = Math.max(0.65, Math.min(1.2, this.w / 355))
    this.canvas.width = Math.floor(this.w * this.dpr)
    this.canvas.height = Math.floor(this.h * this.dpr)
    this.canvas.style.width = `${this.w}px`
    this.canvas.style.height = `${this.h}px`
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  start() {
    if (this.running) return
    this.running = true
    this.particles = []
    this.spawnAcc = 0
    this.lastTime = performance.now()
    this.resize()
    this.primeScreen()
    const tick = (t: number) => {
      if (!this.running) return
      const dt = Math.min((t - this.lastTime) / 1000, 0.05)
      this.lastTime = t
      this.update(dt)
      this.draw(t / 1000)
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
    this.particles = []
    this.ctx.clearRect(0, 0, this.w, this.h)
  }

  /** 开场先铺一层，避免空白 */
  private primeScreen() {
    const n = Math.floor(this.preset.maxParticles * 0.65)
    for (let i = 0; i < n; i++) {
      const p = this.createParticle(true)
      p.y = rand(0, this.h)
      p.x = rand(0, this.w)
      p.life = rand(0.2, 1) * p.maxLife
      this.particles.push(p)
    }
  }

  private pickKind(): ParticleKind {
    const r = Math.random()
    const aw = this.preset.avatarWeight
    if (r < aw) return 'avatar'
    if (this.preset.emojiPool?.length && r < aw + 0.28) return 'emoji'
    if (this.preset.textPool?.length && r < aw + 0.48) return 'text'
    if (this.preset.motion === 'burst' || this.preset.motion === 'swirl') return 'stroke'
    return 'bubble'
  }

  private createParticle(scattered = false): Particle {
    const kind = this.pickKind()
    const s = this.scale
    const size =
      kind === 'avatar'
        ? rand(26, 42) * s
        : kind === 'text'
          ? rand(14, 22) * s
          : rand(8, 18) * s
    const color = pick(this.preset.accentColors)
    const maxLife = rand(4, 8)
    const { x, y, vx, vy } = this.initialState(size, scattered)
    return {
      kind,
      x,
      y,
      vx,
      vy,
      size,
      rotation: rand(0, Math.PI * 2),
      vr: rand(-2.5, 2.5),
      opacity: rand(0.55, 1),
      life: maxLife,
      maxLife,
      color,
      char: kind === 'emoji' ? pick(this.preset.emojiPool!) : kind === 'text' ? pick(this.preset.textPool!) : undefined,
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(1.5, 4),
      baseOpacity: rand(0.65, 1),
    }
  }

  private initialState(size: number, scattered: boolean) {
    const m = this.preset.motion
    const cx = this.w / 2
    const cy = this.h / 2

    if (m === 'rise') {
      return {
        x: scattered ? rand(0, this.w) : rand(-size, this.w + size),
        y: scattered ? rand(0, this.h) : this.h + size,
        vx: rand(-0.25, 0.25),
        vy: rand(-1.8, -0.8),
      }
    }
    if (m === 'fall') {
      return {
        x: scattered ? rand(0, this.w) : rand(-size, this.w + size),
        y: scattered ? rand(0, this.h) : -size,
        vx: rand(-0.35, 0.35),
        vy: rand(0.8, 2.2),
      }
    }
    if (m === 'bounce') {
      return {
        x: rand(0, this.w),
        y: scattered ? rand(0, this.h) : this.h + size,
        vx: rand(-1.2, 1.2),
        vy: rand(-5.5, -3.2),
      }
    }
    if (m === 'burst') {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(2.5, 7)
      return {
        x: scattered ? rand(0, this.w) : cx + rand(-40, 40),
        y: scattered ? rand(0, this.h) : cy + rand(-40, 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }
    }
    // swirl
    const angle = rand(0, Math.PI * 2)
    const dist = scattered ? rand(0, Math.min(cx, cy)) : rand(20, 80)
    return {
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * rand(1.5, 4),
      vy: Math.sin(angle + Math.PI / 2) * rand(1.5, 4),
    }
  }

  private update(dt: number) {
    this.spawnAcc += this.preset.spawnRate * dt
    const cap = Math.floor(this.preset.maxParticles * Math.min(1, (this.w * this.h) / (355 * 520)))
    while (this.spawnAcc >= 1 && this.particles.length < cap) {
      this.spawnAcc -= 1
      this.particles.push(this.createParticle())
    }

    const m = this.preset.motion
    for (const p of this.particles) {
      p.life -= dt
      p.wobble += p.wobbleSpeed * dt
      p.rotation += p.vr * dt

      if (m === 'rise') {
        p.x += p.vx + Math.sin(p.wobble) * 0.35
        p.y += p.vy
      } else if (m === 'fall') {
        p.x += p.vx + Math.sin(p.wobble) * 0.25
        p.y += p.vy
      } else if (m === 'bounce') {
        p.vy += 9.8 * dt * 0.85
        p.x += p.vx + Math.sin(p.wobble * 2) * 0.6
        p.y += p.vy
        if (p.y > this.h + p.size && p.vy > 0) {
          p.y = -p.size
          p.vy = rand(-5.5, -3)
          p.vx = rand(-1.4, 1.4)
        }
      } else if (m === 'burst') {
        p.vx *= 0.992
        p.vy *= 0.992
        p.vy += 0.08
        p.x += p.vx + Math.sin(p.wobble * 3) * 1.2
        p.y += p.vy + Math.cos(p.wobble * 2) * 0.8
      } else {
        const cx = this.w / 2
        const cy = this.h / 2
        const dx = p.x - cx
        const dy = p.y - cy
        const dist = Math.max(Math.hypot(dx, dy), 1)
        p.vx += (-dy / dist) * 0.15
        p.vy += (dx / dist) * 0.15
        p.x += p.vx
        p.y += p.vy
      }

      const fade = Math.min(1, p.life / (p.maxLife * 0.25))
      p.opacity = Math.max(0, fade) * p.baseOpacity
    }

    this.particles = this.particles.filter((p) => {
      if (p.life <= 0) return false
      const pad = p.size * 2
      if (m === 'rise' && p.y < -pad) return false
      if (m === 'fall' && p.y > this.h + pad) return false
      if (m === 'burst' || m === 'swirl') {
        return p.x > -pad && p.x < this.w + pad && p.y > -pad && p.y < this.h + pad
      }
      return true
    })
  }

  private drawBg(t: number) {
    const { overlayColor, bgPulse = 0, motion, accentColors } = this.preset
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)

    if (bgPulse > 0) {
      const pulse = (Math.sin(t * 2.2) + 1) / 2
      if (motion === 'swirl' || motion === 'burst') {
        const g = ctx.createRadialGradient(
          this.w / 2,
          this.h / 2,
          0,
          this.w / 2,
          this.h / 2,
          Math.max(this.w, this.h) * 0.75,
        )
        g.addColorStop(0, accentColors[0] + '55')
        g.addColorStop(0.45, accentColors[1 % accentColors.length] + '33')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, this.w, this.h)
      }
      ctx.fillStyle = overlayColor.replace(/[\d.]+\)$/, `${0.12 + pulse * bgPulse * 0.2})`)
    } else {
      ctx.fillStyle = overlayColor
    }
    ctx.fillRect(0, 0, this.w, this.h)
  }

  private drawParticle(p: Particle, t: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = p.opacity
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)

    if (p.kind === 'avatar') {
      const s = p.size
      ctx.drawImage(this.avatar, -s / 2, -s / 2, s, s)
    } else if (p.kind === 'emoji' || p.kind === 'text') {
      ctx.font = `bold ${p.size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = p.color
      if (p.kind === 'text') {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'
        ctx.lineWidth = 2
        ctx.strokeText(p.char ?? '!', 0, 0)
      }
      ctx.fillText(p.char ?? '♪', 0, 0)
    } else if (p.kind === 'bubble') {
      ctx.beginPath()
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
      ctx.fillStyle = p.color + 'aa'
      ctx.fill()
      ctx.strokeStyle = '#ffffff88'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.strokeStyle = p.color
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.beginPath()
      const len = p.size * 2
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + t * 3 + p.wobble
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len)
      }
      ctx.stroke()
    }

    ctx.restore()
  }

  private draw(timeSec: number) {
    this.drawBg(timeSec)
    const shake =
      this.preset.motion === 'burst'
        ? Math.sin(timeSec * 28) * 1.2 * (this.preset.bgPulse ?? 0)
        : 0
    if (shake) {
      this.ctx.save()
      this.ctx.translate(shake, shake * 0.6)
    }
    for (const p of this.particles) this.drawParticle(p, timeSec)
    if (shake) this.ctx.restore()
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}
