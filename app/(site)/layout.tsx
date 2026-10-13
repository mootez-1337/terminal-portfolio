import type React from "react"
import SiteShell from "@/components/shell/site-shell"

/* Title/description come from the root layout so its `%s — 3angour`
   template reaches every page. Don't redeclare them here. */

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>
}
