import type { CSSProperties } from "react"
import { Link } from "next-view-transitions"
import Hero from "@/components/hero/hero"
import SectionHeading from "@/components/ui/section-heading"
import HighlightCard from "@/components/ui/highlight-card"
import PostCard from "@/components/ui/post-card"
import ProjectCard from "@/components/ui/project-card"
import { ArrowRight } from "@/components/ui/icons"
import { highlights } from "@/content/highlights"
import { featuredProjects } from "@/content/projects"
import { focusAreas, intro } from "@/content/about"
import { getSortedPostsData } from "@/lib/posts"
import { site } from "@/lib/site"

const delay = (i: number, step = 90) => ({ "--delay": `${i * step}ms` }) as CSSProperties

export default function HomePage() {
  const latestPosts = getSortedPostsData().slice(0, 3)
  const selected = featuredProjects.slice(0, 4)

  return (
    <>
      <Hero />

      {/* Highlights */}
      <section className="section container" aria-labelledby="highlights-title">
        <SectionHeading id="highlights-title" code="00" label="signal" title="Latest wins" />
        <ul className="highlights" role="list">
          {highlights.map((h, i) => (
            <li key={h.id} data-reveal style={delay(i, 120)}>
              <HighlightCard highlight={h} />
            </li>
          ))}
        </ul>
      </section>

      {/* Profile */}
      <section className="section container" aria-labelledby="profile-title">
        <SectionHeading
          id="profile-title"
          code="01"
          label="operator profile"
          title={
            <>
              Breaking AI systems <span className="text-red">before someone else does.</span>
            </>
          }
        />
        <div className="profile">
          <figure className="avatar-frame" data-reveal="left">
            <span className="card__brackets" aria-hidden="true" />
            <div className="avatar-frame__img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/avatar.png"
                alt={`${site.handle} avatar`}
                width={300}
                height={300}
                loading="lazy"
                decoding="async"
              />
              <span className="avatar-frame__scan" aria-hidden="true" />
            </div>
            <figcaption>
              <span>{site.name}</span>
              <span>{site.location}</span>
            </figcaption>
          </figure>

          <div className="profile__body">
            <p className="lead" data-reveal>
              {intro.lead}
            </p>
            <ol className="focus-list">
              {focusAreas.map((f, i) => (
                <li key={f.code} className="focus-item" data-reveal style={delay(i)}>
                  <span className="focus-item__code" aria-hidden="true">
                    {f.code}
                  </span>
                  <div>
                    <h3 className="focus-item__title">{f.title}</h3>
                    <p className="focus-item__text">{f.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div data-reveal>
              <Link href="/about" className="link-arrow">
                Learn more about me <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Write-ups */}
      <section className="section container" aria-labelledby="writeups-title">
        <SectionHeading
          id="writeups-title"
          code="02"
          label="field notes"
          title="CTF write-ups"
          description="CTF writeups & security insights"
          action={
            <Link href="/blog" className="link-arrow">
              All write-ups <ArrowRight size={15} />
            </Link>
          }
        />
        <ul className="card-grid card-grid--3" role="list">
          {latestPosts.map((post, i) => (
            <li key={post.slug} data-reveal style={delay(i)}>
              <PostCard post={post} index={i} />
            </li>
          ))}
        </ul>
      </section>

      {/* Projects */}
      <section className="section container" aria-labelledby="projects-title">
        <SectionHeading
          id="projects-title"
          code="03"
          label="arsenal"
          title="Selected projects"
          description="Tools, AI platforms & security tooling"
          action={
            <Link href="/projects" className="link-arrow">
              All projects <ArrowRight size={15} />
            </Link>
          }
        />
        <ul className="card-grid card-grid--2" role="list">
          {selected.map((project, i) => (
            <li key={project.title} data-reveal style={delay(i)}>
              <ProjectCard project={project} index={i} variant="compact" />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
