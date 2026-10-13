"use client"

import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "@/lib/motion"

const GLYPHS = "!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

interface ScrambleProps {
  text: string
  /** Characters used while scrambling. */
  glyphs?: string
  className?: string
  /** Frames (≈16ms) before the first character locks in. */
  lead?: number
}

/**
 * Decodes `text` from random glyphs the first time it scrolls into view.
 * The real text is server-rendered and is what crawlers see; the animation
 * rewrites textContent for well under a second (no React re-render per frame)
 * and always ends on the original text.
 */
export default function Scramble({ text, glyphs = GLYPHS, className = "", lead = 8 }: ScrambleProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    let raf = 0
    const run = () => {
      let frame = 0
      const tick = () => {
        let out = ""
        let done = true
        for (let i = 0; i < text.length; i++) {
          const ch = text[i]
          if (ch === " " || frame >= lead + i * 2) {
            out += ch
          } else {
            done = false
            out += glyphs[(Math.random() * glyphs.length) | 0]
          }
        }
        el.textContent = out
        frame++
        if (!done) raf = requestAnimationFrame(tick)
      }
      tick()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        run()
      },
      { threshold: 0.6 },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      el.textContent = text
    }
  }, [text, glyphs, lead])

  return (
    <span ref={ref} className={`scramble ${className}`.trim()}>
      {text}
    </span>
  )
}
