"use client"

import { openTerminal } from "@/lib/motion"

/** The only visible clue that a shell exists. */
export default function TerminalHint() {
  return (
    <button type="button" className="terminal-hint" onClick={openTerminal}>
      <kbd>`</kbd>
      <span>open a shell</span>
    </button>
  )
}
