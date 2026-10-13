import type { CSSProperties } from "react"
import { Link } from "next-view-transitions"
import { site } from "@/lib/site"
import { highlights } from "@/content/highlights"
import GlitchText from "@/components/motion/glitch-text"
import DecryptText from "@/components/motion/decrypt-text"
import { ArrowRight, Download, Github } from "@/components/ui/icons"
import HeroCanvas from "./hero-canvas"
import HudClock from "./hud-clock"

/** Rotating roles under the name. Edit freely. */
const ROLES = [
  "AI offensive security",
  "Red-teaming LLMs @ AnTitech",
  "CTF player · CSAW '26 finalist",
  "Challenge author",
  "Cybersecurity Master's student",
]

/** Desktop-only HUD panel beside the hero copy. */
const READOUT: [string, string][] = [
  ["target", "LLMs · chatbots · agents"],
  ["vectors", "jailbreak / prompt injection / data poisoning"],
  ["last op", "CSAW CTF '26 — #1 MENA · #2 world"],
  ["research", "IEEE WETICE '26 — accepted"],
  ["base", "Ariana, Tunisia"],
  ["status", "open to opportunities"],
]

const d = (ms: number) => ({ "--d": ms }) as CSSProperties

export default function Hero() {
  const ticker = highlights.map((h) => h.ticker)

  return (
    <section className="hero" data-hero aria-labelledby="hero-title">
      <HeroCanvas text={site.handle.toUpperCase()} />

      {/* HUD chrome — decorative */}
      <div className="hero__hud" aria-hidden="true">
        <span className="hud-corner hud-corner--tl" />
        <span className="hud-corner hud-corner--tr" />
        <span className="hud-corner hud-corner--bl" />
        <span className="hud-corner hud-corner--br" />
        <p className="hud hud--tl">
          <span className="pulse-dot" /> operator online <span className="hud__sep">/</span> session 0x3A
        </p>
        <p className="hud hud--tr">
          36.86°N 10.19°E <span className="hud__sep">/</span> Ariana, TN <span className="hud__sep">/</span>{" "}
          <HudClock /> UTC+1
        </p>
        <p className="hud hud--bl">
          <span className="scroll-cue" /> scroll
        </p>
      </div>

      <div className="container hero__inner">
        <div className="hero__wordmark" data-wordmark aria-hidden="true">
          <span className="hero__wordmark-fallback">{site.handle}</span>
        </div>

        <div className="hero__body">
          <div className="hero__copy">
            <p className="kicker hero__kicker" data-enter style={d(0)}>
              {"// AI offensive security · LLM red-teaming"}
            </p>
            <h1 id="hero-title" className="hero__title">
              <GlitchText text={site.name} className="glitch--boot" />
              <span className="sr-only">, also known as {site.handle}</span>
            </h1>
            <p className="hero__role" data-enter style={d(140)}>
              <span className="hero__prompt" aria-hidden="true">
                &gt;
              </span>
              <DecryptText phrases={ROLES} />
              <span className="caret" aria-hidden="true" />
            </p>
            <p className="hero__lede" data-enter style={d(240)}>
              Cybersecurity Master&apos;s student and CTF player. I break LLMs and chatbots before attackers do —
              jailbreaks, prompt injection, data poisoning — then write up how.
            </p>
            <div className="btn-row" data-enter style={d(340)}>
              <Link href="/blog" className="btn btn--primary">
                Read the write-ups <ArrowRight size={16} />
              </Link>
              <a href={site.resume.aiSecurity} download className="btn btn--ghost">
                <Download size={16} /> Résumé
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost btn--icon"
                aria-label="GitHub profile"
              >
                <Github size={18} />
              </a>
            </div>
          </div>

          <div className="readout" data-enter style={d(480)}>
            <p className="readout__head" aria-hidden="true">
              <span>target_profile.dat</span>
              <span className="pulse-dot" />
            </p>
            <dl aria-label="Operator summary">
              {READOUT.map(([k, v], i) => (
                <div key={k} className="readout__row" style={{ "--i": i } as CSSProperties}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <div className="ticker__group" key={copy}>
              {[...ticker, ...ticker].map((t, i) => (
                <span key={`${copy}-${i}`} className="ticker__item">
                  <span className="ticker__mark">◆</span> {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
