import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { site } from "@/lib/site"
import { projects, featuredProjects } from "@/content/projects"
import PageHeader from "@/components/ui/page-header"
import SectionHeading from "@/components/ui/section-heading"
import ProjectCard, { StatusBadge } from "@/components/ui/project-card"
import { ArrowUpRight, Github } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "Projects",
  description: "Security tooling, AI platforms, blockchain work and CTF contributions by Mootez Ben Slimen (3angour).",
  alternates: { canonical: "/projects" },
}

const delay = (i: number) => ({ "--delay": `${Math.min(i, 8) * 70}ms` }) as CSSProperties

export default function ProjectsPage() {
  return (
    <>
      <PageHeader code="02" label="arsenal" title="Projects">
        <p>AI platforms, security tooling, CTF contributions and research</p>
      </PageHeader>

      {/* Featured Projects */}
      <section className="container section section--tight" aria-labelledby="featured-title">
        <SectionHeading id="featured-title" code="02.1" label="featured" title="Featured work" />
        <ul className="bento" role="list">
          {featuredProjects.map((project, i) => (
            <li key={project.title} data-reveal style={delay(i)} className={i === 0 ? "bento__wide" : undefined}>
              <ProjectCard project={project} index={i} />
            </li>
          ))}
        </ul>
      </section>

      {/* All Projects */}
      <section className="container section" aria-labelledby="all-title">
        <SectionHeading id="all-title" code="02.2" label="ls -la" title="All projects" />
        <ol className="index-list">
          {projects.map((project, i) => (
            <li key={project.title} className="index-row" data-reveal style={delay(i)} data-fx>
              <span className="index-row__num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="index-row__main">
                <div className="index-row__head">
                  <h3 className="index-row__title">{project.title}</h3>
                  <StatusBadge status={project.status} />
                </div>
                <p className="index-row__desc">{project.description}</p>
                <p className="index-row__tech">
                  {project.technologies.slice(0, 3).join(" · ")}
                  {project.technologies.length > 3 ? (
                    <span className="muted"> +{project.technologies.length - 3} more</span>
                  ) : null}
                </p>
              </div>
              <div className="index-row__links">
                {project.github ? (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="link-arrow">
                    GitHub <span className="sr-only">repository for {project.title}</span>
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
                {project.demo ? (
                  <a href={project.demo} target="_blank" rel="noopener noreferrer" className="link-arrow">
                    Demo <span className="sr-only">for {project.title}</span>
                    <ArrowUpRight size={14} />
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <div className="page-note" data-reveal>
          <p className="kicker">$ echo &quot;More projects coming soon...&quot;</p>
          <p>
            Check out my{" "}
            <a href={site.github} target="_blank" rel="noopener noreferrer" className="inline-link">
              <Github size={15} /> GitHub
            </a>{" "}
            for the latest updates
          </p>
        </div>
      </section>
    </>
  )
}
