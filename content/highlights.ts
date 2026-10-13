/**
 * Headline achievements shown on the home page (hero ticker + "Highlights" section).
 * Add, remove or reorder entries here — nothing else needs to change.
 *
 * - `kind`   short uppercase label shown above the title
 * - `stats`  optional big numbers, decoded with a scramble effect when scrolled into view
 * - `badge`  optional big outlined label shown when there are no stats
 * - `href`   optional link (internal like "/about" or external like "https://…")
 */
export interface HighlightStat {
  value: number
  prefix?: string
  suffix?: string
  label: string
}

export interface Highlight {
  id: string
  kind: string
  title: string
  summary: string
  meta: string
  /** Short version used in the hero ticker. */
  ticker: string
  stats?: HighlightStat[]
  badge?: string
  href?: string
  cta?: string
}

export const highlights: Highlight[] = [
  {
    id: "wetice-2026",
    kind: "Research",
    title: "Paper accepted at IEEE WETICE 2026",
    summary: "AI-driven threat knowledge platform inspired by MITRE ATT&CK.",
    meta: "34th Int'l Conference on Enabling Technologies — Paris",
    ticker: "IEEE WETICE 2026 — paper accepted",
    badge: "IEEE '26",
    href: "/about#publications",
    cta: "Read the abstract",
  },
  {
    id: "csaw-2026",
    kind: "CTF",
    title: "CSAW CTF 2026 quals",
    summary: "1st in MENA, 2nd worldwide. Qualified for the Finals.",
    meta: "CSAW Capture The Flag — Qualification round",
    ticker: "CSAW CTF 2026 — 1st MENA · 2nd worldwide",
    stats: [
      { value: 1, prefix: "#", label: "MENA" },
      { value: 2, prefix: "#", label: "Worldwide" },
    ],
    href: "/blog",
    cta: "Read the CSAW write-ups",
  },
]
