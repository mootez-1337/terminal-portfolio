"use client"

import type React from "react"
import { useState } from "react"
import { site } from "@/lib/site"
import PageHeader from "@/components/ui/page-header"
import { ArrowLeft, Github, Linkedin, Mail, MapPin } from "@/components/ui/icons"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  /**
   * Hands the message off to the visitor's mail client, pre-filled.
   * No backend, no third-party form service, and nothing is silently dropped —
   * the visitor sees the composed mail and presses send themselves.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const body = `${formData.message}\n\n—\n${formData.name} <${formData.email}>`
    const mailto = `mailto:${site.email}?subject=${encodeURIComponent(
      formData.subject,
    )}&body=${encodeURIComponent(body)}`

    window.location.href = mailto

    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <>
      <PageHeader code="04" label="contact --init" title="Contact">
        <p>Got a question about CTFs, want to collaborate on a project, or just want to say hi?</p>
      </PageHeader>

      <section className="container section section--tight contact" aria-label="Contact">
        <div className="contact__form-col" data-reveal>
          {submitted ? (
            <div className="card handoff" role="status">
              <span className="card__brackets" aria-hidden="true" />
              <p className="kicker">$ compose --handoff</p>
              <h2 className="handoff__title">Message ready in your mail client</h2>
              <p>
                Your mail client should have opened with the message ready to go. Press send there and it reaches me.
              </p>
              <p className="muted">
                Nothing happened? Mail me directly at{" "}
                <a href={`mailto:${site.email}`} className="inline-link">
                  {site.email}
                </a>
              </p>
              <button type="button" onClick={() => setSubmitted(false)} className="btn btn--ghost">
                <ArrowLeft size={16} /> Write another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card form">
              <span className="card__brackets" aria-hidden="true" />
              <p className="kicker">$ nano message.txt</p>

              <div className="form__row">
                <div className="field">
                  <label htmlFor="name" className="field__label">
                    Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="field__input"
                    placeholder="Your name"
                  />
                </div>
                <div className="field">
                  <label htmlFor="email" className="field__label">
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="field__input"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="subject" className="field__label">
                  Subject <span aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="field__input"
                  placeholder="What's this about?"
                />
              </div>

              <div className="field">
                <label htmlFor="message" className="field__label">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="field__input field__input--area"
                  placeholder="Your message here..."
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn--primary btn--block">
                {isSubmitting ? "$ sending..." : "$ send_message"}
              </button>
              <p className="form__hint">Opens your email app with the message pre-filled — nothing is stored here.</p>
            </form>
          )}
        </div>

        <aside className="contact__info" aria-label="Contact information">
          <div className="card info-card" data-reveal data-fx>
            <p className="kicker">$ cat contact_info.txt</p>
            <h2 className="info-card__title">Quick Contact</h2>
            <ul className="contact-list">
              <li>
                <Mail size={16} />
                <a href={`mailto:${site.email}`} className="inline-link">
                  {site.email}
                </a>
              </li>
              <li>
                <Github size={16} />
                <a href={site.github} target="_blank" rel="noopener noreferrer" className="inline-link">
                  @{site.githubUser}
                </a>
              </li>
              <li>
                <Linkedin size={16} />
                <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className="inline-link">
                  Mootez Ben Slimen
                </a>
              </li>
              <li>
                <MapPin size={16} />
                <span>{site.location}</span>
              </li>
            </ul>
          </div>

          <div className="card info-card" data-reveal data-fx>
            <h2 className="info-card__title">Response Time</h2>
            <ul className="bullet-list">
              <li>Email: Usually within 24-48 hours</li>
              <li>LinkedIn: Check messages regularly</li>
            </ul>
          </div>

          <div className="card info-card" data-reveal data-fx>
            <h2 className="info-card__title">Availability</h2>
            <ul className="bullet-list">
              <li>Open to cybersecurity opportunities</li>
              <li>Available for CTF collaborations</li>
              <li>Interested in research projects</li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  )
}
