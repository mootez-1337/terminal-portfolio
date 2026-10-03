import type React from "react"
import type { Metadata } from "next"
import { site } from "@/lib/site"
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var html=document.documentElement;html.classList.remove('dark','light','terminal');if(t==='light'){html.classList.add('light');}else{html.classList.add('dark','terminal');}}catch(e){document.documentElement.classList.add('dark','terminal');} })()",
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
