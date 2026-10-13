import type { Highlight } from "@/content/highlights"
import Scramble from "@/components/motion/scramble"
import SmartLink from "@/components/ui/smart-link"
import { ArrowRight } from "@/components/ui/icons"

export default function HighlightCard({ highlight: h }: { highlight: Highlight }) {
  return (
    <article className={`card highlight highlight--${h.stats ? "stats" : "badge"}`} data-fx="tilt">
      <span className="card__brackets" aria-hidden="true" />
      <p className="highlight__kind">
        <span className="pulse-dot" aria-hidden="true" />
        {h.kind}
      </p>

      {h.stats ? (
        <dl className="highlight__stats">
          {h.stats.map((s) => (
            <div key={s.label} className="stat">
              <dt className="stat__label">{s.label}</dt>
              <dd className="stat__value">
                <Scramble text={`${s.prefix ?? ""}${s.value}${s.suffix ?? ""}`} glyphs="0123456789#" lead={14} />
              </dd>
            </div>
          ))}
        </dl>
      ) : h.badge ? (
        <p className="highlight__badge" aria-hidden="true">
          {h.badge}
        </p>
      ) : null}

      <h3 className="highlight__title">{h.title}</h3>
      <p className="highlight__summary">{h.summary}</p>
      <p className="highlight__meta">{h.meta}</p>
      {h.href ? (
        <SmartLink href={h.href} className="link-arrow card__link">
          {h.cta ?? "Read more"} <ArrowRight size={15} />
        </SmartLink>
      ) : null}
    </article>
  )
}
