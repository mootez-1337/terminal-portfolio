"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { resumes } from "@/lib/site"
import { Download, FileText } from "@/components/ui/icons"

type Props = {
  /** classes for the trigger button, e.g. "btn btn--ghost" */
  className?: string
  label?: string
  iconSize?: number
  /** open the menu above the trigger (for buttons near the bottom of the page) */
  placement?: "bottom" | "top"
  align?: "start" | "end"
}

/** A "Résumé" button that lets the visitor pick which résumé to download. */
export default function ResumeMenu({
  className = "btn btn--ghost",
  label = "Résumé",
  iconSize = 16,
  placement = "bottom",
  align = "start",
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    // move focus to the first option for keyboard users
    rootRef.current?.querySelector<HTMLAnchorElement>("[role=menuitem]")?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>("[role=menuitem]"))
    const i = items.indexOf(document.activeElement as HTMLAnchorElement)
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length
    items[next]?.focus()
  }

  return (
    <div className="resume-menu" ref={rootRef} data-open={open || undefined}>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={iconSize} /> {label}
        <span className="resume-menu__caret" aria-hidden="true" />
      </button>
      <div
        id={menuId}
        role="menu"
        aria-label="Choose a résumé"
        className="resume-menu__panel"
        data-placement={placement}
        data-align={align}
        hidden={!open}
        onKeyDown={onMenuKey}
      >
        <p className="resume-menu__head" aria-hidden="true">
          $ ls ./resume/
        </p>
        {resumes.map((r) => (
          <a
            key={r.id}
            role="menuitem"
            href={r.href}
            download
            className="resume-menu__item"
            onClick={() => setOpen(false)}
          >
            <FileText size={18} />
            <span>
              <span className="resume-menu__label">{r.label}</span>
              <span className="resume-menu__meta">{r.meta}</span>
            </span>
            <Download size={15} className="resume-menu__dl" />
          </a>
        ))}
      </div>
    </div>
  )
}
