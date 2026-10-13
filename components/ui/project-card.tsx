import type { Project } from "@/content/projects"
import { ArrowUpRight, Github } from "@/components/ui/icons"

export function StatusBadge({ status }: { status: Project["status"] }) {
  return <span className={`status status--${status.toLowerCase()}`}>{status}</span>
}

interface ProjectCardProps {
  project: Project
  index: number
  variant?: "featured" | "compact"
  headingLevel?: "h2" | "h3"
}

export default function ProjectCard({
  project,
  index,
  variant = "featured",
  headingLevel: Heading = "h3",
}: ProjectCardProps) {
  const max = variant === "compact" ? 4 : project.technologies.length
  const shown = project.technologies.slice(0, max)
  const hidden = project.technologies.length - shown.length

  return (
    <article className={`card project-card project-card--${variant}`} data-fx="tilt">
      <span className="card__brackets" aria-hidden="true" />
      <div className="project-card__head">
        <span className="project-card__index" aria-hidden="true">
          P-{String(index + 1).padStart(2, "0")}
        </span>
        <StatusBadge status={project.status} />
      </div>
      <Heading className="project-card__title">{project.title}</Heading>
      <p className="project-card__desc">{project.description}</p>
      <ul className="chips" aria-label="Technologies">
        {shown.map((tech) => (
          <li key={tech} className="chip">
            {tech}
          </li>
        ))}
        {hidden > 0 ? <li className="chip chip--muted">+{hidden} more</li> : null}
      </ul>
      {project.github || project.demo ? (
        <div className="project-card__links">
          {project.github ? (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="link-arrow">
              <Github size={15} /> Source <span className="sr-only">for {project.title}</span>
              <ArrowUpRight size={14} />
            </a>
          ) : null}
          {project.demo ? (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="link-arrow">
              Live <span className="sr-only">site for {project.title}</span>
              <ArrowUpRight size={14} />
            </a>
          ) : null}
        </div>
      ) : (
        <p className="project-card__private">
          <span aria-hidden="true">■</span> No public repository
        </p>
      )}
    </article>
  )
}
