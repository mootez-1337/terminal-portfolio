"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { EVENTS } from "@/lib/motion"
import type { TermPost } from "./commands"

// The shell (and its CSS) is only downloaded the first time someone opens it.
const Terminal = dynamic(() => import("./terminal"), { ssr: false })

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")

/**
 * Easter egg: press ` (backtick) or type "sudo" anywhere to open a shell.
 * Also opens from the footer hint and the mobile menu.
 */
export default function TerminalLauncher({ posts }: { posts: TermPost[] }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    let buffer = ""
    const show = () => {
      setMounted(true)
      setOpen(true)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      if (e.key === "`") {
        e.preventDefault()
        show()
        return
      }
      if (e.key.length === 1) {
        buffer = (buffer + e.key.toLowerCase()).slice(-4)
        if (buffer === "sudo") {
          buffer = ""
          show()
        }
      }
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener(EVENTS.openTerminal, show)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(EVENTS.openTerminal, show)
    }
  }, [])

  if (!mounted) return null
  return <Terminal open={open} onClose={() => setOpen(false)} posts={posts} />
}
