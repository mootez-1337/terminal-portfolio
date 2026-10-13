import { Link } from "next-view-transitions"
import { site } from "@/lib/site"
import { navLinks } from "@/lib/nav"
import { ArrowRight, Download, Flag, Github, Gitlab, Linkedin, Rss } from "@/components/ui/icons"
import Scramble from "@/components/motion/scramble"
import TerminalHint from "./terminal-hint"

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <section className="container footer-cta" aria-labelledby="footer-cta-title" data-reveal>
        <p className="kicker">
          <Scramble text="// end of transmission" />
        </p>
        <h2 id="footer-cta-title" className="footer-cta__title">
          Have something that <span className="text-red">needs breaking?</span>
        </h2>
        <p className="footer-cta__text">
          Open to cybersecurity opportunities, CTF collaborations and research projects.
        </p>
        <div className="btn-row">
          <Link href="/contact" className="btn btn--primary">
            Open a channel <ArrowRight size={16} />
          </Link>
          <a href={site.resume.aiSecurity} download className="btn btn--ghost">
            <Download size={16} /> Résumé
          </a>
          <a href={site.github} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
            <Github size={16} /> GitHub
          </a>
        </div>
      </section>

      <div className="container footer-bar">
        <p className="footer-bar__copy">
          &copy; {year} {site.name} ({site.handle}). Built for security researchers.
        </p>

        <nav aria-label="Footer" className="footer-bar__nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="footer-bar__social" aria-label="Elsewhere">
          <li>
            <a href={site.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github size={17} />
            </a>
          </li>
          <li>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={17} />
            </a>
          </li>
          <li>
            <a href={site.gitlab} target="_blank" rel="noopener noreferrer" aria-label="GitLab">
              <Gitlab size={17} />
            </a>
          </li>
          <li>
            <a href={site.ctftime} target="_blank" rel="noopener noreferrer" aria-label="CTFtime">
              <Flag size={17} />
            </a>
          </li>
          <li>
            <a href="/feed.xml" aria-label="RSS feed">
              <Rss size={17} />
            </a>
          </li>
        </ul>

        <TerminalHint />
      </div>
    </footer>
  )
}
