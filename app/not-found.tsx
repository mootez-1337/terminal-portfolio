import { Link } from "next-view-transitions"
import SiteShell from "@/components/shell/site-shell"
import GlitchText from "@/components/motion/glitch-text"
import { ArrowLeft } from "@/components/ui/icons"

export default function NotFound() {
  return (
    <SiteShell>
      <section className="container not-found" aria-labelledby="nf-title">
        <p className="kicker">{"// error 404 — target not found"}</p>
        <h1 id="nf-title" className="not-found__code">
          <GlitchText text="404" />
        </h1>
        <p className="not-found__text">This path isn&apos;t in scope. The page may have moved — or never existed.</p>
        <pre className="not-found__log" aria-hidden="true">
          {`$ curl -I ${"<this url>"}\nHTTP/2 404\nx-hint: try / or /blog`}
        </pre>
        <div className="btn-row">
          <Link href="/" className="btn btn--primary">
            <ArrowLeft size={16} /> Back to base
          </Link>
          <Link href="/blog" className="btn btn--ghost">
            Read the write-ups
          </Link>
        </div>
      </section>
    </SiteShell>
  )
}
