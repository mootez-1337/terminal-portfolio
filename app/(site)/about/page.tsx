import type { CSSProperties } from "react"
import type { Metadata } from "next"
import { site } from "@/lib/site"
import { achievements, community, education, experience, intro, languages, publications, skills } from "@/content/about"
import PageHeader from "@/components/ui/page-header"
import SectionHeading from "@/components/ui/section-heading"
import { Download, FileText, Flag, Github, Gitlab, Linkedin, Mail, MapPin } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "About",
  description:
    "Mootez Ben Slimen (3angour) — Cybersecurity Master's student at MedTech, UZH Deep Dive into Blockchain alum, IEEE WETICE 2026 author, CTF player and challenge author.",
  alternates: { canonical: "/about" },
}

const delay = (i: number, step = 70) => ({ "--delay": `${Math.min(i, 8) * step}ms` }) as CSSProperties

export default function AboutPage() {
  const contacts = [
    { label: "Email", value: site.email, href: `mailto:${site.email}`, Icon: Mail },
    { label: "LinkedIn", value: "Mootez Ben Slimen", href: site.linkedin, Icon: Linkedin },
    { label: "GitHub", value: `@${site.githubUser}`, href: site.github, Icon: Github },
    { label: "GitLab", value: `@${site.gitlabUser}`, href: site.gitlab, Icon: Gitlab },
    { label: "CTFtime", value: "Competition log", href: site.ctftime, Icon: Flag },
    { label: "Location", value: site.location, href: null, Icon: MapPin },
  ]

  return (
    <>
      <PageHeader code="03" label="whoami" title="About">
        <p>The long version — education, research, experience, skills and the full CTF log.</p>
      </PageHeader>

      {/* Introduction */}
      <section className="container section section--tight" aria-label="Introduction">
        <div className="about-intro">
          <figure className="avatar-frame" data-reveal="left">
            <span className="card__brackets" aria-hidden="true" />
            <div className="avatar-frame__img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/avatar.png" alt={`${site.handle} avatar`} width={300} height={300} decoding="async" />
              <span className="avatar-frame__scan" aria-hidden="true" />
            </div>
            <figcaption>
              <span>{site.handle}</span>
              <span>{site.location}</span>
            </figcaption>
          </figure>
          <div className="about-intro__text" data-reveal>
            <p className="kicker">$ whoami</p>
            <p className="lead">
              Hi! I&apos;m <strong className="text-red">Mootez Ben Slimen ({site.handle})</strong>, {intro.lead}
            </p>
            <p>{intro.body}</p>
            <div className="btn-row">
              <a href={site.resume.aiSecurity} download className="btn btn--primary">
                <Download size={16} /> Download résumé
              </a>
              <a href={site.github} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                <Github size={16} /> GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Education */}
      <section className="container section" aria-labelledby="education-title">
        <SectionHeading id="education-title" code="03.1" label="education.log" title="Education" />
        <ol className="timeline">
          {education.map((e, i) => (
            <li key={e.school} className="timeline__item" data-reveal style={delay(i)}>
              <span className="timeline__node" aria-hidden="true" />
              <div className="timeline__head">
                <h3 className="timeline__title">{e.school}</h3>
                <span className="timeline__period">{e.period}</span>
              </div>
              <p className="timeline__text">{e.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Research & Publications */}
      <section className="container section" aria-labelledby="publications-title" id="publications">
        <SectionHeading id="publications-title" code="03.2" label="publications.bib" title="Research & publications" />
        <ul className="stack" role="list">
          {publications.map((pub) => (
            <li key={pub.title} data-reveal>
              <article className="card publication" data-fx>
                <span className="card__brackets" aria-hidden="true" />
                <div className="publication__head">
                  <span className="status status--active">✓ Accepted</span>
                  <span className="publication__date">{pub.date}</span>
                </div>
                <h3 className="publication__title">{pub.title}</h3>
                <p className="publication__venue">{pub.venue}</p>
                <p className="publication__desc">{pub.description}</p>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Experience */}
      <section className="container section" aria-labelledby="experience-title">
        <SectionHeading id="experience-title" code="03.3" label="experience.log" title="Experience" />
        <ol className="timeline timeline--cards">
          {experience.map((exp, i) => (
            <li key={`${exp.company}-${exp.title}`} className="timeline__item" data-reveal style={delay(i)}>
              <span className="timeline__node" aria-hidden="true" />
              <div className="timeline__head">
                <div>
                  <h3 className="timeline__title">{exp.title}</h3>
                  <p className="timeline__org">{exp.company}</p>
                </div>
                <span className="timeline__period">{exp.period}</span>
              </div>
              <p className="timeline__text">{exp.description}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Skills */}
      <section className="container section" aria-labelledby="skills-title">
        <SectionHeading id="skills-title" code="03.4" label="ls skills/" title="Skills" />
        <ul className="skills-grid" role="list">
          {Object.entries(skills).map(([category, items], i) => (
            <li key={category} data-reveal style={delay(i, 60)}>
              <div className="card skill-card" data-fx>
                <h3 className="skill-card__title">{category}</h3>
                <ul className="chips" aria-label={`${category} skills`}>
                  {items.map((skill) => (
                    <li key={skill} className="chip">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTF Achievements */}
      <section className="container section" aria-labelledby="achievements-title">
        <SectionHeading id="achievements-title" code="03.5" label="ctf_achievements.log" title="CTF achievements" />
        <ul className="achievements" role="list">
          {achievements.map((a, i) => (
            <li
              key={`${a.title}-${a.date}`}
              data-reveal
              style={delay(i, 45)}
              className={a.highlight ? "achievements__hero" : undefined}
            >
              <div className={`card achievement${a.highlight ? " achievement--highlight" : ""}`} data-fx>
                {a.highlight ? <span className="card__brackets" aria-hidden="true" /> : null}
                <div className="achievement__head">
                  <h3 className="achievement__title">
                    {a.highlight ? (
                      <span className="text-red" aria-hidden="true">
                        ★{" "}
                      </span>
                    ) : null}
                    {a.title}
                  </h3>
                  <span className="achievement__date">{a.date}</span>
                </div>
                <p className="achievement__desc">{a.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Community & Volunteering */}
      <section className="container section" aria-labelledby="community-title">
        <SectionHeading id="community-title" code="03.6" label="community.log" title="Community & volunteering" />
        <ul className="card-grid card-grid--3" role="list">
          {community.map((c, i) => (
            <li key={c.title} data-reveal style={delay(i)}>
              <div className="card info-card" data-fx>
                <h3 className="info-card__title">{c.title}</h3>
                <p className="info-card__text">{c.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Languages */}
      <section className="container section" aria-labelledby="languages-title">
        <SectionHeading id="languages-title" code="03.7" label="languages.txt" title="Languages" />
        <ul className="lang-grid" role="list">
          {languages.map((l, i) => (
            <li key={l.name} data-reveal style={delay(i)} className="lang">
              <span className="lang__name">{l.name}</span>
              <span className="lang__level">{l.level}</span>
              <span className="lang__bar" aria-hidden="true">
                <span
                  style={{ "--level": l.level === "Native" ? 1 : l.level === "Fluent" ? 0.85 : 0.75 } as CSSProperties}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact Links */}
      <section className="container section" aria-labelledby="find-title">
        <SectionHeading id="find-title" code="03.8" label='find . -name "*contact*"' title="Find me" />
        <ul className="contact-grid" role="list">
          {contacts.map(({ label, value, href, Icon }, i) => (
            <li key={label} data-reveal style={delay(i, 50)}>
              {href ? (
                <a
                  href={href}
                  className="card contact-tile"
                  data-fx
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <Icon size={20} />
                  <span className="contact-tile__label">{label}</span>
                  <span className="contact-tile__value">{value}</span>
                </a>
              ) : (
                <div className="card contact-tile" data-fx>
                  <Icon size={20} />
                  <span className="contact-tile__label">{label}</span>
                  <span className="contact-tile__value">{value}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Resume */}
      <section className="container section" aria-labelledby="resume-title">
        <SectionHeading id="resume-title" code="03.9" label="wget resume.pdf" title="Résumé" />
        <div data-reveal>
          <a href={site.resume.aiSecurity} download className="card resume-tile" data-fx="tilt">
            <span className="card__brackets" aria-hidden="true" />
            <FileText size={28} />
            <span>
              <span className="resume-tile__title">Résumé</span>
              <span className="resume-tile__meta">PDF • AI &amp; offensive security</span>
            </span>
            <Download size={20} className="resume-tile__dl" />
          </a>
        </div>

        <div className="page-note" data-reveal>
          <p>$ echo &quot;Thanks for reading! Feel free to reach out.&quot;</p>
          <p className="kicker">~/about.txt [EOF]</p>
        </div>
      </section>
    </>
  )
}
