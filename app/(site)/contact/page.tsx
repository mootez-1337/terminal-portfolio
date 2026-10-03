"use client"

import type React from "react"
import { useState } from "react"
import { site } from "@/lib/site"

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

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border terminal:border-terminal-accent light:border-gray-300 rounded-lg p-8 terminal:bg-terminal-accent/5 light:bg-gray-50">
          <div className="text-center font-mono">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-2xl font-bold mb-4 terminal:text-terminal-accent light:text-light-accent">
              $ compose --handoff
            </h2>
            <p className="terminal:text-terminal-text light:text-light-text mb-2">
              Your mail client should have opened with the message ready to go. Press send there and it reaches me.
            </p>
            <p className="terminal:text-terminal-text light:text-light-text opacity-70 text-sm mb-6">
              Nothing happened? Mail me directly at{" "}
              <a
                href={`mailto:${site.email}`}
                className="terminal:text-terminal-accent light:text-light-accent hover:underline"
              >
                {site.email}
              </a>
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="terminal:text-terminal-accent light:text-light-accent hover:underline"
            >
              ← $ write_another_message
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 terminal:text-terminal-accent light:text-light-accent font-mono">
          $ contact --init
        </h1>
        <p className="terminal:text-terminal-text light:text-light-text opacity-80 font-mono">
          Got a question about CTFs, want to collaborate on a project, or just want to say hi?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ nano message.txt
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2 font-mono terminal:text-terminal-text light:text-light-text"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-transparent border terminal:border-terminal-accent light:border-gray-300 rounded focus:outline-none focus:ring-2 terminal:focus:ring-terminal-accent light:focus:ring-light-accent transition-colors font-mono terminal:text-terminal-text light:text-light-text"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 font-mono terminal:text-terminal-text light:text-light-text"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-transparent border terminal:border-terminal-accent light:border-gray-300 rounded focus:outline-none focus:ring-2 terminal:focus:ring-terminal-accent light:focus:ring-light-accent transition-colors font-mono terminal:text-terminal-text light:text-light-text"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium mb-2 font-mono terminal:text-terminal-text light:text-light-text"
              >
                Subject *
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-transparent border terminal:border-terminal-accent light:border-gray-300 rounded focus:outline-none focus:ring-2 terminal:focus:ring-terminal-accent light:focus:ring-light-accent transition-colors font-mono terminal:text-terminal-text light:text-light-text"
                placeholder="What's this about?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-2 font-mono terminal:text-terminal-text light:text-light-text"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-transparent border terminal:border-terminal-accent light:border-gray-300 rounded focus:outline-none focus:ring-2 terminal:focus:ring-terminal-accent light:focus:ring-light-accent transition-colors resize-vertical font-mono terminal:text-terminal-text light:text-light-text"
                placeholder="Your message here..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 terminal:bg-terminal-accent light:bg-light-accent terminal:text-terminal-bg light:text-white font-medium rounded hover:opacity-90 disabled:opacity-50 transition-all duration-200 font-mono"
            >
              {isSubmitting ? "$ sending..." : "$ send_message"}
            </button>
          </form>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat contact_info.txt
          </h2>

          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-3">
                Quick Contact
              </h3>
              <div className="space-y-2 font-mono text-sm">
                <p className="terminal:text-terminal-text light:text-light-text opacity-80 break-all">
                  📧{" "}
                  <a
                    href={`mailto:${site.email}`}
                    className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                  >
                    {site.email}
                  </a>
                </p>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80">
                  🐙{" "}
                  <a
                    href={site.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                  >
                    @{site.githubUser}
                  </a>
                </p>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80">
                  💼{" "}
                  <a
                    href={site.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                  >
                    Mootez Ben Slimen
                  </a>
                </p>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80">📍 {site.location}</p>
              </div>
            </div>

            {/* Response Time */}
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-3">
                Response Time
              </h3>
              <div className="font-mono text-sm terminal:text-terminal-text light:text-light-text opacity-80">
                <p>• Email: Usually within 24-48 hours</p>
                <p>• LinkedIn: Check messages regularly</p>
              </div>
            </div>

            {/* Availability */}
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-3">
                Availability
              </h3>
              <div className="font-mono text-sm terminal:text-terminal-text light:text-light-text opacity-80">
                <p>• Open to cybersecurity opportunities</p>
                <p>• Available for CTF collaborations</p>
                <p>• Interested in research projects</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
