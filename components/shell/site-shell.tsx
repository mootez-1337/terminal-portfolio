import type React from "react"
import { getSortedPostsData } from "@/lib/posts"
import SiteHeader from "./site-header"
import SiteFooter from "./site-footer"
import SmoothScroll from "@/components/motion/smooth-scroll"
import RevealObserver from "@/components/motion/reveal-observer"
import PointerFx from "@/components/motion/pointer-fx"
import TerminalLauncher from "@/components/terminal/terminal-launcher"

/** Chrome shared by every page: backdrop, header, footer and global effects. */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  // The hidden terminal can `ls blog` and `open <slug>`.
  const posts = getSortedPostsData().map(({ slug, title, date }) => ({ slug, title, date }))

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="backdrop" aria-hidden="true">
        <div className="backdrop__grid" />
        <div className="backdrop__glow" />
        <div className="backdrop__noise" />
      </div>
      <div className="scanlines" aria-hidden="true" />

      <SiteHeader />
      <main id="main" tabIndex={-1} className="site-main">
        {children}
      </main>
      <SiteFooter />

      <SmoothScroll />
      <RevealObserver />
      <PointerFx />
      <TerminalLauncher posts={posts} />
    </>
  )
}
