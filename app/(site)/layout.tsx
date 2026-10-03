import type React from "react"
import Layout from "@/components/layout"

/* Title/description come from the root layout so its `%s — 3angour`
   template reaches every page. Don't redeclare them here. */

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  /* Re-use the existing Layout component everywhere */
  return <Layout>{children}</Layout>
}
