"use client"

import { useEffect, useRef } from "react"
import { prefersReducedMotion } from "@/lib/motion"

const GLYPHS = "01ABCDEF#$%&*+=<>/\\|"

interface DecryptTextProps {
  phrases: string[]
  /** How long each phrase stays readable, in ms. */
  hold?: number
  className?: string
}

/**
 * Cycles through phrases with a decrypt effect (hero roles).
 * Screen readers get the full list once; the animated copy is aria-hidden.
 * With reduced motion every phrase is shown statically.
 */
export default function DecryptText({ phrases, hold = 2600, className = "" }: DecryptTextProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || phrases.length < 2) return
    if (prefersReducedMotion()) {
      el.textContent = phrases.join(" · ")
      return
    }

    let index = 0
    let raf = 0
    let timer = 0
    let visible = true

    const decrypt = (from: string, to: string) => {
      const len = Math.max(from.length, to.length)
      let frame = 0
      const tick = () => {
        let out = ""
        let done = true
        for (let i = 0; i < len; i++) {
          const lockAt = 10 + i * 1.6
          if (frame >= lockAt) {
            out += to[i] ?? ""
          } else {
            done = false
            // keep the old character briefly, then noise
            out += frame < i * 0.6 ? (from[i] ?? "") : GLYPHS[(Math.random() * GLYPHS.length) | 0]
          }
        }
        el.textContent = out
        frame++
        if (!done) raf = requestAnimationFrame(tick)
        else timer = window.setTimeout(next, hold)
      }
      tick()
    }

    const next = () => {
      if (!visible) {
        timer = window.setTimeout(next, 500)
        return
      }
      const from = phrases[index]
      index = (index + 1) % phrases.length
      decrypt(from, phrases[index])
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
    })
    io.observe(el)
    timer = window.setTimeout(next, hold + 600)

    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      el.textContent = phrases[0]
    }
  }, [phrases, hold])

  return (
    <span className={className}>
      <span className="sr-only">{phrases.join(", ")}</span>
      <span ref={ref} aria-hidden="true">
        {phrases[0]}
      </span>
    </span>
  )
}
