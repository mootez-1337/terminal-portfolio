"use client"

import { useEffect, useRef } from "react"
import { hasFinePointer, isSmallScreen, onIdle, prefersReducedMotion, whenIntroDone } from "@/lib/motion"

/**
 * Lazy loader for the particle wordmark. Nothing heavy runs until the browser
 * is idle (and the first-visit intro has finished), so it never competes with
 * first paint. Until then the CSS outline wordmark is shown.
 */
export default function HeroCanvas({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.closest<HTMLElement>("[data-hero]")
    const target = host?.querySelector<HTMLElement>("[data-wordmark]")
    if (!canvas || !host || !target) return

    let cancelled = false
    let engine: { destroy(): void } | null = null

    const cancelIdle = onIdle(async () => {
      await whenIntroDone()
      const { createParticleEngine } = await import("./particle-engine")
      const css = getComputedStyle(document.documentElement)
      const fontFamily = css.getPropertyValue("--font-display").trim() || "sans-serif"
      const monoFamily = css.getPropertyValue("--font-mono").trim() || "monospace"
      try {
        await document.fonts.load(`700 100px ${fontFamily}`)
      } catch {
        /* fall back to whatever is loaded */
      }
      if (cancelled) return
      engine = createParticleEngine({
        canvas,
        host,
        target,
        text,
        fontFamily,
        monoFamily,
        reducedMotion: prefersReducedMotion(),
        lite: isSmallScreen() || !hasFinePointer(),
      })
      host.classList.add("is-live")
    }, 1200)

    return () => {
      cancelled = true
      cancelIdle()
      engine?.destroy()
      host.classList.remove("is-live")
    }
  }, [text])

  return <canvas ref={canvasRef} className="hero__canvas" aria-hidden="true" />
}
