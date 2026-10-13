"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * One observer for every scroll-triggered reveal on the page.
 * Server components just add `data-reveal` (optionally `data-reveal="left"` etc.
 * and a `--delay` style); this flips them to `.is-in` once they scroll into view.
 * Content stays visible without JS because the hiding CSS is scoped to `html.js`.
 */
export default function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-in")
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    )

    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el))
    }
    scan(document)

    // Catch content rendered later (client filters, streamed sections).
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches("[data-reveal]:not(.is-in)")) io.observe(node)
          scan(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}
