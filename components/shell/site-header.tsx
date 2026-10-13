"use client"

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { usePathname } from "next/navigation"
import { Link } from "next-view-transitions"
import { site } from "@/lib/site"
import { isActive, navLinks } from "@/lib/nav"
import { lockScroll, openTerminal } from "@/lib/motion"
import { Download, Github, TerminalIcon } from "@/components/ui/icons"

export default function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }, [])

  // Close the menu whenever the route changes.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    lockScroll(true)
    const firstLink = menuRef.current?.querySelector<HTMLElement>("a, button")
    firstLink?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== "Tab") return
      // Trap focus between the toggle and the menu items.
      const items = [
        toggleRef.current,
        ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a, button") ?? []),
      ].filter(Boolean) as HTMLElement[]
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("keydown", onKey)
      lockScroll(false)
    }
  }, [open, close])

  return (
    <>
      <header className="site-header" data-scrolled={scrolled || undefined} data-menu-open={open || undefined}>
        <div className="container site-header__inner">
          <Link href="/" className="brand" aria-label={`${site.handle} — home`}>
            <span className="brand__mark" aria-hidden="true">
              3A
            </span>
            <span className="brand__name" aria-hidden="true">
              {site.handle}
            </span>
          </Link>

          <nav aria-label="Primary" className="site-nav">
            <ul className="site-nav__list">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href)
                return (
                  <li key={link.href}>
                    <Link href={link.href} className="site-nav__link" aria-current={active ? "page" : undefined}>
                      <span className="site-nav__code" aria-hidden="true">
                        {link.code}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="site-header__actions">
            <a href={site.resume.aiSecurity} download className="btn btn--ghost btn--sm site-header__resume">
              <Download size={15} />
              Résumé
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="menu-toggle__label">{open ? "Close" : "Menu"}</span>
              <span className="menu-toggle__icon" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        className="mobile-menu"
        data-open={open || undefined}
        inert={!open}
        aria-label="Site menu"
        role="dialog"
        aria-modal={open || undefined}
      >
        <nav aria-label="Mobile" className="container mobile-menu__inner">
          <ul className="mobile-menu__list">
            <li style={{ "--i": 0 } as CSSProperties}>
              <Link href="/" className="mobile-menu__link" aria-current={pathname === "/" ? "page" : undefined}>
                <span className="mobile-menu__code" aria-hidden="true">
                  00
                </span>
                home
              </Link>
            </li>
            {navLinks.map((link, i) => (
              <li key={link.href} style={{ "--i": i + 1 } as CSSProperties}>
                <Link
                  href={link.href}
                  className="mobile-menu__link"
                  aria-current={isActive(pathname, link.href) ? "page" : undefined}
                >
                  <span className="mobile-menu__code" aria-hidden="true">
                    {link.code}
                  </span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mobile-menu__extras">
            <a href={site.resume.aiSecurity} download className="btn btn--primary">
              <Download size={16} /> Download résumé
            </a>
            <a href={site.github} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
              <Github size={16} /> GitHub
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                close(false)
                openTerminal()
              }}
            >
              <TerminalIcon size={16} /> Open shell
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}
