import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import MatrixRain from "@/components/effects/matrix-rain"
import TypeWriter from "@/components/effects/type-writer"
import { site } from "@/lib/site"

const cards = [
  {
    href: "/blog",
    command: "$ ls blog/",
    description: "CTF writeups & security insights",
  },
  {
    href: "/projects",
    command: "$ ls projects/",
    description: "Tools, AI platforms & security tooling",
  },
  {
    href: "/about",
    command: "$ cat about.txt",
    description: "Learn more about me",
  },
]

export default function HomePage() {
  return (
    <>
      <MatrixRain />
      <div className="min-h-[70vh] flex items-center justify-center relative z-10">
        <section className="text-center space-y-8 max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-6 animate-rise">
              <div className="avatar-ring glow-pulse mb-4">
                <Avatar className="w-32 h-32 border-2 terminal:border-terminal-bg light:border-light-bg">
                  <AvatarImage src="/avatar.png" alt="3angour" />
                  <AvatarFallback>3</AvatarFallback>
                </Avatar>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold font-mono crt-flicker">
                <span className="glitch" data-text="~/3angour">
                  <span className="terminal:text-terminal-accent light:text-light-accent">~/</span>
                  <span className="terminal:text-terminal-text light:text-light-text">3angour</span>
                </span>
              </h1>
            </div>

            <TypeWriter
              className="text-base md:text-lg min-h-28 text-left inline-block"
              lines={[
                "$ whoami",
                "Mootez Ben Slimen — Cybersecurity Master's student",
                "Red-teaming LLMs @ AnTitech • CTF Player • Challenge Author",
              ]}
            />
          </div>

          {/* Publication highlight */}
          <div
            className="animate-rise mx-auto max-w-2xl border terminal:border-terminal-accent/40 light:border-light-accent/40 rounded-lg px-5 py-3 terminal:bg-terminal-accent/5 light:bg-orange-50 font-mono text-sm ember-card"
            style={{ animationDelay: "0.9s" }}
          >
            <span className="terminal:text-terminal-accent light:text-light-accent font-bold">[RESEARCH]</span>{" "}
            <span className="terminal:text-terminal-text light:text-light-text opacity-90">
              Paper accepted at <strong>IEEE WETICE 2026</strong>, Paris — AI-driven threat knowledge platform inspired
              by MITRE ATT&CK
            </span>
          </div>

          {/* CTF highlight */}
          <div
            className="animate-rise mx-auto max-w-2xl border terminal:border-terminal-accent/40 light:border-light-accent/40 rounded-lg px-5 py-3 terminal:bg-terminal-accent/5 light:bg-orange-50 font-mono text-sm ember-card"
            style={{ animationDelay: "1.0s" }}
          >
            <span className="terminal:text-terminal-accent light:text-light-accent font-bold">[CTF]</span>{" "}
            <span className="terminal:text-terminal-text light:text-light-text opacity-90">
              <strong>CSAW CTF 2026</strong> quals — 1st in MENA, 2nd worldwide. Qualified for the Finals.
            </span>
          </div>

          <div className="space-y-4 terminal:text-terminal-text light:text-light-text">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {cards.map((card, i) => (
                <Link
                  key={card.href}
                  href={card.href}
                  className="animate-rise ember-card p-4 border terminal:border-terminal-accent/50 light:border-gray-300 rounded terminal:hover:border-terminal-accent terminal:hover:bg-terminal-accent/10 light:hover:bg-orange-50 group"
                  style={{ animationDelay: `${1.15 + i * 0.12}s` }}
                >
                  <div className="font-mono">
                    <div className="terminal:text-terminal-accent light:text-light-accent font-bold">
                      {card.command}
                    </div>
                    <div className="text-sm opacity-80 mt-2">{card.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div
            className="pt-8 font-mono text-sm opacity-70 terminal:text-terminal-text light:text-light-text animate-rise"
            style={{ animationDelay: "1.6s" }}
          >
            <p className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/contact" className="terminal:text-terminal-accent light:text-light-accent hover:underline">
                $ contact --init
              </Link>
              <a
                href={site.resume.aiSecurity}
                download
                className="terminal:text-terminal-accent light:text-light-accent hover:underline"
              >
                $ wget resume.pdf
              </a>
              <a
                href={site.github}
                target="_blank"
                rel="noopener noreferrer"
                className="terminal:text-terminal-accent light:text-light-accent hover:underline"
              >
                $ git remote -v
              </a>
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
