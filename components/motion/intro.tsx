import type { CSSProperties } from "react"
import IntroController from "./intro-controller"

const LOG = [
  "[ ok ] handshake with blog.3angour.tech",
  "[ ok ] loading payloads: write-ups, projects, research",
  "[ ok ] bypassing boredom filters",
  "[ ok ] escalating privileges → visitor",
  "[ .. ] decrypting operator profile",
]

/**
 * First-visit boot sequence for the home page.
 * The markup is server-rendered but hidden; the inline boot script in the root
 * layout sets html[data-intro="play"] before first paint to show it. The whole
 * animation is CSS, the controller only handles skip/finish. A CSS failsafe
 * hides it after a few seconds even if JavaScript never loads.
 */
export default function Intro() {
  return (
    <div className="intro" id="intro">
      <div className="intro__panel intro__panel--top" />
      <div className="intro__panel intro__panel--bottom" />
      <div className="intro__content">
        <p className="intro__brand" aria-hidden="true">
          <span>3ANGOUR</span>
          <span className="intro__ver">RED CELL // v2.0</span>
        </p>
        <ol className="intro__log" aria-hidden="true">
          {LOG.map((line, i) => {
            const end = line.indexOf("]") + 1
            const tag = line.slice(0, end)
            return (
              <li key={line} style={{ "--i": i } as CSSProperties}>
                <span className={`intro__tag${tag.includes("..") ? " intro__tag--wait" : ""}`}>{tag}</span>
                {line.slice(end)}
              </li>
            )
          })}
        </ol>
        <div className="intro__bar" aria-hidden="true">
          <span />
        </div>
        <p className="intro__granted" aria-hidden="true" data-text="ACCESS GRANTED">
          ACCESS GRANTED
        </p>
      </div>
      <IntroController />
    </div>
  )
}
