/**
 * Particle wordmark for the hero — plain Canvas 2D, no dependencies.
 *
 * The text is rasterised off-screen, sampled on a grid, and every sample becomes
 * a particle on a spring to its "home". The cursor (or a finger) repels them,
 * clicks send a shockwave, and every few seconds a horizontal slice is knocked
 * sideways for a glitch. Typed arrays keep ~4k particles cheap; the loop idles
 * when nothing moves and stops entirely when the hero is off-screen.
 */

export interface ParticleEngineOptions {
  canvas: HTMLCanvasElement
  /** Element that receives pointer events and defines the canvas size (the hero). */
  host: HTMLElement
  /** Element whose box the wordmark fills. */
  target: HTMLElement
  text: string
  fontFamily: string
  monoFamily: string
  reducedMotion: boolean
  /** Lighter settings for phones / touch devices. */
  lite: boolean
}

export interface ParticleEngine {
  destroy(): void
}

const COLORS = {
  red: "#ff3b47",
  deep: "#b4202b",
  bone: "#ede8df",
  hot: "#ff9aa1",
}

export function createParticleEngine(o: ParticleEngineOptions): ParticleEngine {
  const ctx = o.canvas.getContext("2d", { alpha: true })
  if (!ctx) return { destroy() {} }

  const MAX = o.lite ? 1700 : 4200
  const REPEL_R = o.lite ? 70 : 110
  const REPEL = o.lite ? 5 : 7
  const SPRING = 0.055
  const DAMP = 0.84

  let width = 0
  let height = 0
  let count = 0
  let size = 2
  let hx = new Float32Array(0)
  let hy = new Float32Array(0)
  let x = new Float32Array(0)
  let y = new Float32Array(0)
  let vx = new Float32Array(0)
  let vy = new Float32Array(0)
  let tone = new Uint8Array(0) // 0 red, 1 deep, 2 bone
  let box = { x: 0, y: 0, w: 0, h: 0 }

  const pointer = { x: -9999, y: -9999, active: false, fine: false }
  const reticle = { x: -9999, y: -9999, alpha: 0 }

  let raf = 0
  let last = 0
  let running = false
  let visible = true
  let dirty = true
  let nextGlitch = 0
  let destroyed = false

  /* ---------------- build ---------------- */

  function build(entrance: boolean) {
    const hostRect = o.host.getBoundingClientRect()
    const t = o.target.getBoundingClientRect()
    width = Math.max(1, hostRect.width)
    height = Math.max(1, hostRect.height)
    const dpr = Math.min(window.devicePixelRatio || 1, o.lite ? 1.5 : 2)
    o.canvas.width = Math.round(width * dpr)
    o.canvas.height = Math.round(height * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

    box = { x: t.left - hostRect.left, y: t.top - hostRect.top, w: Math.max(1, t.width), h: Math.max(1, t.height) }

    // Rasterise the text into the target box.
    const off = document.createElement("canvas")
    off.width = Math.ceil(box.w)
    off.height = Math.ceil(box.h)
    const octx = off.getContext("2d", { willReadFrequently: true })
    if (!octx) return
    octx.font = `700 100px ${o.fontFamily}`
    const m = octx.measureText(o.text)
    const asc = m.actualBoundingBoxAscent || 72
    const desc = m.actualBoundingBoxDescent || 0
    const scale = Math.min((box.w * 0.995) / m.width, (box.h * 0.98) / (asc + desc))
    const fontSize = 100 * scale
    octx.font = `700 ${fontSize}px ${o.fontFamily}`
    octx.textBaseline = "alphabetic"
    octx.fillStyle = "#fff"
    const top = (box.h - (asc + desc) * scale) / 2
    octx.fillText(o.text, 0, top + asc * scale)
    const data = octx.getImageData(0, 0, off.width, off.height).data

    const sample = (gap: number) => {
      const pts: number[] = []
      for (let sy = 0; sy < off.height; sy += gap) {
        for (let sx = 0; sx < off.width; sx += gap) {
          if (data[(Math.floor(sy) * off.width + Math.floor(sx)) * 4 + 3] > 140) pts.push(sx, sy)
        }
      }
      return pts
    }

    let gap = Math.max(3, Math.round(box.h / (o.lite ? 34 : 52)))
    let pts = sample(gap)
    if (pts.length / 2 > MAX) {
      gap = gap * Math.sqrt(pts.length / 2 / MAX)
      pts = sample(gap)
    }

    count = pts.length / 2
    size = Math.max(1.4, gap * 0.58)
    hx = new Float32Array(count)
    hy = new Float32Array(count)
    x = new Float32Array(count)
    y = new Float32Array(count)
    vx = new Float32Array(count)
    vy = new Float32Array(count)
    tone = new Uint8Array(count)

    for (let i = 0; i < count; i++) {
      const px = box.x + pts[i * 2]
      const py = box.y + pts[i * 2 + 1]
      hx[i] = px
      hy[i] = py
      if (entrance && !o.reducedMotion) {
        // "materialise": start scattered along horizontal scan rows
        x[i] = px + (Math.random() - 0.5) * box.w * 0.5
        y[i] = py + (Math.random() - 0.5) * 24
      } else {
        x[i] = px
        y[i] = py
      }
      const r = Math.random()
      tone[i] = r < 0.03 ? 2 : r < 0.3 ? 1 : 0
    }
    dirty = true
  }

  /* ---------------- simulation ---------------- */

  function glitch() {
    const bands = 1 + ((Math.random() * 3) | 0)
    for (let b = 0; b < bands; b++) {
      const bandY = box.y + Math.random() * box.h
      const half = 2 + Math.random() * 8
      const shift = (Math.random() < 0.5 ? -1 : 1) * (14 + Math.random() * 46)
      for (let i = 0; i < count; i++) {
        if (Math.abs(y[i] - bandY) < half) x[i] += shift
      }
    }
    dirty = true
  }

  function shock(px: number, py: number) {
    const R = o.lite ? 180 : 260
    for (let i = 0; i < count; i++) {
      const dx = x[i] - px
      const dy = y[i] - py
      const d = Math.sqrt(dx * dx + dy * dy) + 0.001
      if (d > R) continue
      const f = (1 - d / R) * 16
      vx[i] += (dx / d) * f
      vy[i] += (dy / d) * f
    }
    dirty = true
  }

  function step(f: number): number {
    const damp = Math.pow(DAMP, f)
    const R2 = REPEL_R * REPEL_R
    let energy = 0
    for (let i = 0; i < count; i++) {
      let ax = (hx[i] - x[i]) * SPRING
      let ay = (hy[i] - y[i]) * SPRING
      if (pointer.active) {
        const dx = x[i] - pointer.x
        const dy = y[i] - pointer.y
        const d2 = dx * dx + dy * dy
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.001
          const k = 1 - d / REPEL_R
          const force = k * k * REPEL
          ax += (dx / d) * force
          ay += (dy / d) * force
        }
      }
      vx[i] = (vx[i] + ax * f) * damp
      vy[i] = (vy[i] + ay * f) * damp
      x[i] += vx[i] * f
      y[i] += vy[i] * f
      energy += Math.abs(vx[i]) + Math.abs(vy[i]) + Math.abs(hx[i] - x[i]) * 0.05
    }
    return energy
  }

  /* ---------------- render ---------------- */

  function draw() {
    const c = ctx!
    c.clearRect(0, 0, width, height)

    // HUD tracking lines + reticle under the particles (mouse only).
    if (reticle.alpha > 0.01) {
      c.globalAlpha = reticle.alpha * 0.12
      c.fillStyle = COLORS.red
      c.fillRect(0, Math.round(reticle.y), width, 1)
      c.fillRect(Math.round(reticle.x), 0, 1, height)
      c.globalAlpha = 1
    }

    const s = size
    // pass 1: settled particles by tone; pass 2: fast ones glow "hot"
    const paint = (fill: string, want: number) => {
      c.fillStyle = fill
      for (let i = 0; i < count; i++) {
        const fast = vx[i] * vx[i] + vy[i] * vy[i] > 3.5
        if (want === 3 ? fast : !fast && tone[i] === want) c.fillRect(x[i], y[i], s, s)
      }
    }
    paint(COLORS.deep, 1)
    paint(COLORS.red, 0)
    paint(COLORS.bone, 2)
    paint(COLORS.hot, 3)

    if (reticle.alpha > 0.01) {
      const rx = reticle.x
      const ry = reticle.y
      c.globalAlpha = reticle.alpha
      c.strokeStyle = COLORS.red
      c.lineWidth = 1
      c.beginPath()
      c.arc(rx, ry, 15, 0, Math.PI * 2)
      c.moveTo(rx - 26, ry)
      c.lineTo(rx - 19, ry)
      c.moveTo(rx + 19, ry)
      c.lineTo(rx + 26, ry)
      c.moveTo(rx, ry - 26)
      c.lineTo(rx, ry - 19)
      c.moveTo(rx, ry + 19)
      c.lineTo(rx, ry + 26)
      c.stroke()
      c.fillStyle = COLORS.red
      c.fillRect(rx - 1, ry - 1, 2, 2)
      c.font = `500 10px ${o.monoFamily}`
      const label = `X ${String(Math.round(rx)).padStart(4, "0")}  Y ${String(Math.round(ry)).padStart(4, "0")}`
      const lw = c.measureText(label).width
      c.globalAlpha = reticle.alpha * 0.85
      c.fillStyle = "#0a0a0b"
      c.fillRect(rx + 19, ry + 20, lw + 8, 14)
      c.fillStyle = COLORS.bone
      c.fillText(label, rx + 23, ry + 30)
      c.globalAlpha = 1
    }
  }

  function frame(now: number) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    const f = Math.min(3, last ? (now - last) / 16.667 : 1)
    last = now

    if (now > nextGlitch) {
      glitch()
      nextGlitch = now + 2600 + Math.random() * 3600
    }

    // reticle follows the mouse with a little lag
    const wantAlpha = pointer.active && pointer.fine ? 1 : 0
    reticle.alpha += (wantAlpha - reticle.alpha) * 0.15 * f
    if (pointer.active && pointer.fine) {
      if (reticle.x < -1000) {
        reticle.x = pointer.x
        reticle.y = pointer.y
      }
      reticle.x += (pointer.x - reticle.x) * 0.3 * f
      reticle.y += (pointer.y - reticle.y) * 0.3 * f
    }

    const energy = step(f)
    const moving = energy > count * 0.002 || reticle.alpha > 0.01 || pointer.active
    if (moving || dirty) {
      draw()
      dirty = false
    }
  }

  function start() {
    if (running || destroyed || o.reducedMotion || !visible || document.hidden) return
    running = true
    last = 0
    raf = requestAnimationFrame(frame)
  }

  function stop() {
    running = false
    cancelAnimationFrame(raf)
  }

  /* ---------------- input ---------------- */

  const local = (clientX: number, clientY: number) => {
    const r = o.host.getBoundingClientRect()
    pointer.x = clientX - r.left
    pointer.y = clientY - r.top
  }

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return
    local(e.clientX, e.clientY)
    pointer.active = true
    pointer.fine = true
  }
  const onPointerLeave = () => {
    pointer.active = false
  }
  const onPointerDown = (e: PointerEvent) => {
    if ((e.target as Element | null)?.closest("a, button, input, textarea")) return
    const r = o.host.getBoundingClientRect()
    shock(e.clientX - r.left, e.clientY - r.top)
  }
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    local(t.clientX, t.clientY)
    pointer.active = true
    pointer.fine = false
  }
  const onTouchEnd = () => {
    pointer.active = false
  }

  /* ---------------- lifecycle ---------------- */

  build(!o.reducedMotion)
  if (o.reducedMotion) {
    draw()
  } else {
    nextGlitch = performance.now() + 1800
    o.host.addEventListener("pointermove", onPointerMove, { passive: true })
    o.host.addEventListener("pointerleave", onPointerLeave)
    o.host.addEventListener("pointerdown", onPointerDown)
    o.host.addEventListener("touchstart", onTouch, { passive: true })
    o.host.addEventListener("touchmove", onTouch, { passive: true })
    o.host.addEventListener("touchend", onTouchEnd)
    o.host.addEventListener("touchcancel", onTouchEnd)
    start()
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else stop()
  })
  io.observe(o.host)

  const onVisibility = () => (document.hidden ? stop() : start())
  document.addEventListener("visibilitychange", onVisibility)

  let resizeTimer = 0
  let lastW = o.host.clientWidth
  let lastH = o.host.clientHeight
  const ro = new ResizeObserver(() => {
    const w = o.host.clientWidth
    const h = o.host.clientHeight
    // ignore the small height jitter from mobile browser toolbars
    if (w === lastW && Math.abs(h - lastH) < 80) return
    lastW = w
    lastH = h
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      build(false)
      if (o.reducedMotion) draw()
    }, 160)
  })
  ro.observe(o.host)

  return {
    destroy() {
      destroyed = true
      stop()
      io.disconnect()
      ro.disconnect()
      window.clearTimeout(resizeTimer)
      document.removeEventListener("visibilitychange", onVisibility)
      o.host.removeEventListener("pointermove", onPointerMove)
      o.host.removeEventListener("pointerleave", onPointerLeave)
      o.host.removeEventListener("pointerdown", onPointerDown)
      o.host.removeEventListener("touchstart", onTouch)
      o.host.removeEventListener("touchmove", onTouch)
      o.host.removeEventListener("touchend", onTouchEnd)
      o.host.removeEventListener("touchcancel", onTouchEnd)
    },
  }
}
