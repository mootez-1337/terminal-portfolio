"use client"

import { useEffect, useRef } from "react"
import { EVENTS, lockScroll } from "@/lib/motion"
import { site } from "@/lib/site"

const PLAY_MS = 2300 // keep in sync with the intro keyframes in styles/motion.css
const EXIT_MS = 650

/** Handles skip / finish for the CSS-driven boot intro. Renders the skip button. */
export default function IntroController() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const finished = useRef(false)

  useEffect(() => {
    const html = document.documentElement
    if (html.getAttribute("data-intro") !== "play") return

    try {
      localStorage.setItem(`${site.handle}:intro-seen`, "1")
    } catch {
      /* storage unavailable — intro may play again, that's fine */
    }

    lockScroll(true)
    buttonRef.current?.focus({ preventScroll: true })

    let exitTimer = 0
    const finish = () => {
      if (finished.current) return
      finished.current = true
      html.setAttribute("data-intro", "exit")
      lockScroll(false)
      window.dispatchEvent(new CustomEvent(EVENTS.introDone))
      exitTimer = window.setTimeout(() => {
        html.removeAttribute("data-intro")
        if (document.activeElement === buttonRef.current) buttonRef.current?.blur()
      }, EXIT_MS)
    }

    const playTimer = window.setTimeout(finish, PLAY_MS)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return
      finish()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", finish, { once: true })

    return () => {
      window.clearTimeout(playTimer)
      window.clearTimeout(exitTimer)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", finish)
    }
  }, [])

  return (
    <button ref={buttonRef} type="button" className="intro__skip">
      Skip intro <kbd>Esc</kbd>
    </button>
  )
}
