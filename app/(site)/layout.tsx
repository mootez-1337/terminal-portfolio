import type React from "react"
import Layout from "@/components/layout"

export const metadata = {
  title: "3angour — Terminal Portfolio",
  description: "CTF write-ups, security research and projects",
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  /* Re-use the existing Layout component everywhere */
  return <Layout>{children}</Layout>
}
