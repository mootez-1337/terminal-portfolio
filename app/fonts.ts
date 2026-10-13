import { Chakra_Petch, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"

/* Self-hosted at build time by next/font — no request to Google at runtime. */

/** Display: headings, wordmark, numbers. */
export const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
})

/** Body copy. */
export const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

/** HUD labels, code, terminal. */
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  // only small labels use mono above the fold — skip the preload to keep LCP fast
  preload: false,
})
