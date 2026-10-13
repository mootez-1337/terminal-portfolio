import type React from "react"
import type { CSSProperties } from "react"
import GlitchText from "@/components/motion/glitch-text"
import Scramble from "@/components/motion/scramble"

interface PageHeaderProps {
  code: string
  label: string
  title: string
  children?: React.ReactNode
}

/** Top of every inner page: kicker, glitching title, intro line, red rule. */
export default function PageHeader({ code, label, title, children }: PageHeaderProps) {
  return (
    <header className="page-header container">
      <p className="kicker" data-enter>
        <Scramble text={`// ${code} — ${label}`} />
      </p>
      <h1 className="page-title">
        <GlitchText text={title} className="glitch--boot" />
      </h1>
      {children ? (
        <div className="page-header__desc" data-enter style={{ "--d": 120 } as CSSProperties}>
          {children}
        </div>
      ) : null}
      <div className="page-header__rule" aria-hidden="true" />
    </header>
  )
}
