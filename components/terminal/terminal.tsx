"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { usePathname } from "next/navigation"
import { useTransitionRouter } from "next-view-transitions"
import { site } from "@/lib/site"
import { lockScroll } from "@/lib/motion"
import { Close } from "@/components/ui/icons"
import { BANNER, complete, run, type Line, type TermPost } from "./commands"
import "@/styles/terminal.css"

interface Entry extends Line {
  id: number
  input?: boolean
}

interface TerminalProps {
  open: boolean
  onClose: () => void
  posts: TermPost[]
}

let nextId = 0
const withIds = (lines: Line[], input = false): Entry[] => lines.map((l) => ({ ...l, id: nextId++, input }))

export default function Terminal({ open, onClose, posts }: TerminalProps) {
  const router = useTransitionRouter()
  const pathname = usePathname()
  const [entries, setEntries] = useState<Entry[]>(() => withIds(BANNER))
  const [value, setValue] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const cwd = pathname === "/" ? "~" : `~${pathname}`
  const prompt = `visitor@${site.handle}:${cwd}$`

  // Open / close side effects: scroll lock, focus in and back out.
  useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    lockScroll(true)
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => {
      window.clearTimeout(t)
      lockScroll(false)
      returnFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  // Keep the newest output in view.
  useEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [entries])

  const go = (href: string) => {
    onClose()
    if (href.startsWith("/")) router.push(href)
    else window.open(href, "_blank", "noopener,noreferrer")
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const input = value
    const nextHistory = input.trim() ? [...history, input.trim()] : history
    const result = run(input, { posts, history: nextHistory })
    setHistory(nextHistory)
    setCursor(-1)
    setValue("")

    if (result.action?.type === "clear") {
      setEntries([])
      return
    }
    setEntries((prev) => [...prev, ...withIds([{ text: `${prompt} ${input}` }], true), ...withIds(result.lines)])

    const action = result.action
    if (!action) return
    if (action.type === "close") onClose()
    if (action.type === "navigate") window.setTimeout(() => go(action.href), 420)
    if (action.type === "external") window.open(action.href, "_blank", "noopener,noreferrer")
    if (action.type === "download") {
      const a = document.createElement("a")
      a.href = action.href
      a.download = ""
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault()
      const { value: completed, options } = complete(value, { posts, history })
      setValue(completed)
      if (options.length) {
        setEntries((prev) => [...prev, ...withIds([{ text: options.join("   "), tone: "muted" }])])
      }
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!history.length) return
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next)
      setValue(history[next])
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (cursor === -1) return
      const next = cursor + 1
      if (next >= history.length) {
        setCursor(-1)
        setValue("")
      } else {
        setCursor(next)
        setValue(history[next])
      }
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault()
      setEntries([])
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === "c") {
      e.preventDefault()
      setEntries((prev) => [...prev, ...withIds([{ text: `${prompt} ${value}^C` }], true)])
      setValue("")
    }
  }

  return (
    <div className="term" data-open={open || undefined} inert={!open}>
      <div className="term__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="term__window" role="dialog" aria-modal="true" aria-labelledby="term-title">
        <div className="term__bar">
          <span className="term__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2 id="term-title" className="term__title">
            <span className="sr-only">Hidden terminal — </span>
            {prompt.slice(0, -1)}
          </h2>
          <button type="button" className="term__close" onClick={onClose} aria-label="Close shell">
            <Close size={16} />
          </button>
        </div>

        <div className="term__body" ref={bodyRef} data-lenis-prevent onClick={() => inputRef.current?.focus()}>
          <div role="log" aria-live="polite" aria-relevant="additions">
            {entries.map((line) => (
              <div
                key={line.id}
                className={`term__line term__line--${line.input ? "input" : (line.tone ?? "default")}`}
              >
                {line.href ? (
                  <a
                    href={line.href}
                    onClick={(e) => {
                      e.preventDefault()
                      go(line.href as string)
                    }}
                  >
                    {line.text}
                  </a>
                ) : (
                  line.text
                )}
              </div>
            ))}
          </div>

          <form className="term__input-row" onSubmit={submit}>
            <span className="term__prompt" aria-hidden="true">
              {prompt}
            </span>
            <input
              ref={inputRef}
              className="term__input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Terminal command. Type help for a list of commands."
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
