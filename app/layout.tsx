import type React from "react"
import type { Metadata, Viewport } from "next"
import { ViewTransitions } from "next-view-transitions"
import { site } from "@/lib/site"
import Intro from "@/components/motion/intro"
import { display, mono, sans } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.handle}`,
  },
  description: site.description,
  applicationName: site.title,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: [
    "cybersecurity",
    "CTF",
    "capture the flag",
    "AI red-teaming",
    "LLM security",
    "prompt injection",
    "OSINT",
    "security research",
    "write-ups",
    "penetration testing",
    "MITRE ATT&CK",
    "Mootez Ben Slimen",
    "3angour",
  ],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": `${site.url}/feed.xml` },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.title,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
}

/**
 * Runs before first paint:
 *  - `js` class lets CSS hide scroll-reveal content only when JS can reveal it again
 *  - `data-intro="play"` shows the boot intro on the first visit to the home page
 *    (skipped entirely for prefers-reduced-motion)
 */
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r&&location.pathname==='/'&&!localStorage.getItem('${site.handle}:intro-seen')){d.setAttribute('data-intro','play')}}catch(e){}})()`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    alternateName: site.handle,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: site.role,
    sameAs: [site.github, site.linkedin, site.gitlab, site.ctftime].filter(Boolean),
  }

  return (
    <ViewTransitions>
      <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: bootScript }} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
        </head>
        <body>
          <Intro />
          {children}
        </body>
      </html>
    </ViewTransitions>
  )
}
