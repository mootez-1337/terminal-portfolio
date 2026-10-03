"use client"

import { useEffect, useState } from "react"

interface TypeWriterProps {
  lines: string[]
  speed?: number
  startDelay?: number
  className?: string
}

/**
 * Types lines one after another like a terminal session.
 * Lines starting with "$" render in the accent color (commands),
 * other lines render as output.
 */
export default function TypeWriter({ lines, speed = 20, startDelay = 250, className = "" }: TypeWriterProps) {
  const [lineIdx, setLineIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay)
    return () => clearTimeout(t)
  }, [startDelay])

  useEffect(() => {
    if (!started || lineIdx >= lines.length) return

    const current = lines[lineIdx]
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), speed)
      return () => clearTimeout(t)
    }
    // pause at end of line, then advance
    const t = setTimeout(() => {
      setLineIdx((l) => l + 1)
      setCharIdx(0)
    }, 220)
    return () => clearTimeout(t)
  }, [started, lineIdx, charIdx, lines, speed])

  const done = lineIdx >= lines.length

  const renderLine = (line: string, text: string, active: boolean) => {
    const isCommand = line.startsWith("$")
    return (
      <div
        className={`${
          isCommand
            ? "terminal:text-terminal-accent light:text-light-accent font-bold"
            : "terminal:text-terminal-text light:text-light-text opacity-80"
        } ${active ? "cursor-blink" : ""}`}
      >
        {text || " "}
      </div>
    )
  }

  return (
    <div className={`font-mono ${className}`} aria-label={lines.join("\n")}>
      {lines.slice(0, lineIdx).map((line, i) => (
        <div key={i}>{renderLine(line, line, false)}</div>
      ))}
      {!done && renderLine(lines[lineIdx], lines[lineIdx].slice(0, charIdx), true)}
      {done && <div className="cursor-blink terminal:text-terminal-accent light:text-light-accent font-bold">$</div>}
    </div>
  )
}
