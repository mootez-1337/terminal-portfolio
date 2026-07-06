"use client"

import { useEffect, useRef } from "react"

const GLYPHS = "アイウエオカキクケコサシスセソ0123456789ABCDEF$#@&%"

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let drops: number[] = []
    const fontSize = 14

    const resize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      drops = Array(Math.ceil(width / fontSize)).fill(1)
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    let last = 0
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 55) return // ~18fps, keep it chill
      last = now

      // fade trail in the warm background color
      ctx.fillStyle = "rgba(12, 8, 6, 0.12)"
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        // mostly dim rust, occasional bright ember head
        ctx.fillStyle = Math.random() > 0.92 ? "#ff6b3d" : "rgba(181, 73, 42, 0.55)"
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />
}
