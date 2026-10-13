"use client"

import { useEffect } from "react"
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion"

/**
 * Delegated hover effects for every card, without a client component per card.
 *  - `data-fx`            spotlight: sets --mx / --my (px) under the cursor
 *  - `data-fx="tilt"`     spotlight + 3D tilt via --rx / --ry (deg)
 * Mouse/trackpad only; tilt is skipped for reduced motion.
 */
export default function PointerFx() {
  useEffect(() => {
    if (!hasFinePointer()) return
    const allowTilt = !prefersReducedMotion()

    let current: HTMLElement | null = null
    let frame = 0
    let lastEvent: PointerEvent | null = null

    const reset = (el: HTMLElement) => {
      el.style.setProperty("--rx", "0deg")
      el.style.setProperty("--ry", "0deg")
      el.removeAttribute("data-hover")
    }

    const apply = () => {
      frame = 0
      const e = lastEvent
      if (!e) return
      const target = (e.target as Element | null)?.closest<HTMLElement>("[data-fx]") ?? null
      if (target !== current) {
        if (current) reset(current)
        current = target
        current?.setAttribute("data-hover", "")
      }
      if (!current) return

      const r = current.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      current.style.setProperty("--mx", `${x.toFixed(1)}px`)
      current.style.setProperty("--my", `${y.toFixed(1)}px`)

      if (allowTilt && current.dataset.fx === "tilt") {
        const px = x / r.width - 0.5
        const py = y / r.height - 0.5
        current.style.setProperty("--rx", `${(-py * 5).toFixed(2)}deg`)
        current.style.setProperty("--ry", `${(px * 7).toFixed(2)}deg`)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return
      lastEvent = e
      if (!frame) frame = requestAnimationFrame(apply)
    }
    const onLeaveWindow = () => {
      if (current) reset(current)
      current = null
    }

    document.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeaveWindow)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeaveWindow)
    }
  }, [])

  return null
}
