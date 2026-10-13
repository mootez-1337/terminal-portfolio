import type React from "react"
import Scramble from "@/components/motion/scramble"

interface SectionHeadingProps {
  id: string
  code: string
  label: string
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

/** `// 02 — field notes` kicker + heading, revealed on scroll. */
export default function SectionHeading({ id, code, label, title, description, action }: SectionHeadingProps) {
  return (
    <div className="section-head" data-reveal>
      <div>
        <p className="kicker">
          <Scramble text={`// ${code} — ${label}`} />
        </p>
        <h2 id={id} className="section-title">
          {title}
        </h2>
        {description ? <p className="section-desc">{description}</p> : null}
      </div>
      {action ? <div className="section-head__action">{action}</div> : null}
    </div>
  )
}
