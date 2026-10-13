"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import type Lenis from "lenis"
import { EVENTS, hasFinePointer, onIdle, prefersReducedMotion } from "@/lib/motion"

/**
 * Inertial smooth scrolling (Lenis) for mouse/trackpad users.
 * Off for touch devices (native momentum is better) and for reduced motion.
 * Loaded on idle so it never competes with first render.
 */
export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (prefersReducedMotion() || !hasFinePointer()) return

    let raf = 0
    let disposed = false

    const cancelIdle = onIdle(async () => {
      const { default: LenisCtor } = await import("lenis")
      if (disposed) return
      const lenis = new LenisCtor({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })
      lenisRef.current = lenis
      const loop = (time: number) => {
        lenis.raf(time)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      if (document.documentElement.hasAttribute("data-scroll-locked")) lenis.stop()
    })

    const onLock = (e: Event) => {
      const locked = (e as CustomEvent<boolean>).detail
      if (locked) lenisRef.current?.stop()
      else lenisRef.current?.start()
    }
    window.addEventListener(EVENTS.scrollLock, onLock)

    return () => {
      disposed = true
      cancelIdle()
      cancelAnimationFrame(raf)
      window.removeEventListener(EVENTS.scrollLock, onLock)
      lenisRef.current?.destroy()
      lenisRef.current = null
    }
  }, [])

  // Next.js scrolls to the top on navigation; make Lenis agree immediately.
  useEffect(() => {
    if (window.location.hash) return
    lenisRef.current?.scrollTo(0, { immediate: true, force: true })
  }, [pathname])

  return null
}
