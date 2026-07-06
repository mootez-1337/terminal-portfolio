import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mootez Ben Slimen (3angour) — Cybersecurity & CTF",
  description:
    "Terminal portfolio of Mootez Ben Slimen: cybersecurity Master's student, CTF player and security researcher. Write-ups, projects and research.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('theme');var html=document.documentElement;html.classList.remove('dark','light','terminal');if(t==='light'){html.classList.add('light');}else{html.classList.add('dark','terminal');}}catch(e){document.documentElement.classList.add('dark','terminal');} })()",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
