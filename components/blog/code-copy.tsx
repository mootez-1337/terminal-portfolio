"use client"

import { useEffect } from "react"

const COPY_SVG =
  '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M9 9h11v11H9z"/><path d="M5 15H4V4h11v1"/></svg>'

/** Adds a "copy" button to every code block inside the given container. */
export default function CodeCopy({ containerId }: { containerId: string }) {
  useEffect(() => {
    const root = document.getElementById(containerId)
    if (!root || !navigator.clipboard) return

    const buttons: HTMLButtonElement[] = []
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".code-copy")) return
      const btn = document.createElement("button")
      btn.type = "button"
      btn.className = "code-copy"
      btn.innerHTML = `${COPY_SVG}<span>copy</span>`
      btn.setAttribute("aria-label", "Copy code to clipboard")
      btn.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.innerText ?? pre.innerText
        try {
          await navigator.clipboard.writeText(code)
          btn.dataset.copied = ""
          btn.querySelector("span")!.textContent = "copied"
          window.setTimeout(() => {
            delete btn.dataset.copied
            btn.querySelector("span")!.textContent = "copy"
          }, 1600)
        } catch {
          /* clipboard blocked — ignore */
        }
      })
      pre.appendChild(btn)
      buttons.push(btn)
    })

    return () => buttons.forEach((b) => b.remove())
  }, [containerId])

  return null
}
