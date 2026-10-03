import type { Metadata } from "next"
import Reveal from "@/components/effects/reveal"
import { site, repo } from "@/lib/site"

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Security tooling, AI platforms, blockchain work and CTF contributions by Mootez Ben Slimen (3angour).",
  alternates: { canonical: "/projects" },
}

export default function ProjectsPage() {
  const projects = [
    {
      title: "OceanClean — Blockchain Ocean Cleanup Marketplace",
      description:
        "Final project for Group 13 at the University of Zurich's Deep Dive into Blockchain summer school. Closes the trust gap that keeps ocean cleanup underfunded: a marketplace where verified collectors are paid directly in OCT tokens for proven waste retrieval. Tamper-resistant payout model verified independently before release and weighted by material value and retrieval difficulty, plus a self-sustaining funding loop routing recycler purchases and donor contributions into a liquidity pool.",
      technologies: ["Blockchain", "Smart Contracts", "Token Design", "UZH DDiB"],
      // Repo is private (owned by a teammate) — a public visitor would get a 404.
      github: null,
      demo: null,
      status: "Completed",
      featured: true,
    },
    {
      title: "CapAI — Founder Intelligence Platform",
      description:
        "Multi-source founder data aggregation engine (FastAPI, aiohttp, asyncio) normalizing LinkedIn, GitHub, Product Hunt and DEV.to profiles into structured JSON. Identity resolution via multi-engine search cascade + GitHub API verification. LightGBM classifier predicting startup acquisition/IPO success — ROC-AUC 0.84 on 196K companies.",
      technologies: ["FastAPI", "asyncio", "LightGBM", "Python", "Crunchbase Data"],
      github: repo("capAI-hackathon"),
      demo: null,
      status: "Completed",
      featured: true,
    },
    {
      title: "Forgot me ? — Local-First Cognitive Assistant",
      description:
        "Privacy-first mobile + backend system that scans documents, images, audio and calendars on-device and indexes them with a local LLM (Qwen2.5-3B via Ollama) — no data ever leaves the network. Multi-modal ingestion (PyMuPDF, BLIP, Whisper), self-verifying RAG pipeline with ChromaDB, React Native/Expo app. Built for AIMinds Hackathon (5th place).",
      technologies: ["Ollama", "ChromaDB", "Whisper", "BLIP", "React Native", "FastAPI", "Docker Compose"],
      github: repo("forgot-me"),
      demo: null,
      status: "Completed",
      featured: true,
    },
    {
      title: "AI-Driven Threat Knowledge Platform",
      description:
        "Research project accepted at IEEE WETICE 2026 (Paris). Aggregates Dark Web intelligence and maps threat actors, techniques and indicators to the MITRE ATT&CK framework to proactively enrich threat knowledge bases.",
      technologies: ["AI/ML", "MITRE ATT&CK", "Dark Web Intelligence", "Threat Intel"],
      github: null,
      demo: null,
      status: "Research",
      featured: true,
    },
    {
      title: "Vulnerability Operation Center",
      description:
        "Comprehensive VOC built during my graduation internship at ITC-Consulting: DNS traffic monitoring for anomaly & exfiltration detection, Python-based CVE scanners for web applications, automated CVE aggregation, alerting and monthly reporting.",
      technologies: ["Python", "DNS Monitoring", "CVE APIs", "Automation", "Alerting"],
      github: null,
      demo: null,
      status: "Completed",
      featured: true,
    },
    {
      title: "claude-bug-bounty",
      description:
        "Claude Code skill for AI-assisted bug bounty hunting — recon, IDOR, XSS, SSRF, OAuth, GraphQL and LLM prompt-injection workflows, with report generation built in.",
      technologies: ["Python", "Claude Code", "Bug Bounty", "Automation"],
      github: repo("claude-bug-bounty"),
      demo: null,
      status: "Active",
      featured: false,
    },
    {
      title: "Secure Web Application — OWASP Top 10",
      description:
        "Deliberately vulnerable Flask web application (SQLite3) implementing the OWASP Top 10 for educational purposes, with SSDLC principles applied to identify, mitigate and fix each flaw.",
      technologies: ["Flask", "SQLite3", "OWASP Top 10", "SSDLC"],
      github: repo("app-sec-project"),
      demo: null,
      status: "Active",
      featured: false,
    },
    {
      title: "CTF Challenge Author",
      description:
        "Web, Forensics and MISC challenges for multiple national CTF events (Cr4ck0ut, Securinets Guided/Mini/Quals/Finals CTFs), including advanced Python Jail and forensic scenarios. CTFd infrastructure deployment and maintenance.",
      technologies: ["Python", "CTFd", "Pyjails", "Forensics", "Challenge Design"],
      github: null,
      demo: null,
      status: "Active",
      featured: false,
    },
    {
      title: "Sysreptor Plugin with Microsoft Steampipe",
      description:
        "Customized plugin for Sysreptor using Microsoft Steampipe, with specialized report templates to enhance cybersecurity documentation and analysis workflows.",
      technologies: ["Microsoft Steampipe", "Plugin Development", "Report Templates"],
      github: null,
      demo: null,
      status: "Completed",
      featured: false,
    },
    {
      title: "Terminal Portfolio",
      description:
        "This very website! A terminal-themed portfolio and blog built with Next.js, featuring theme switching, animations and markdown blog support for CTF writeups.",
      technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      github: repo("terminal-portfolio"),
      demo: site.url,
      status: "Active",
      featured: false,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-orange-400"
      case "Completed":
        return "text-stone-400"
      case "Research":
        return "text-amber-300"
      case "Archived":
        return "text-red-400"
      default:
        return "terminal:text-terminal-text light:text-light-text"
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 animate-rise">
        <h1 className="text-3xl font-bold mb-4 terminal:text-terminal-accent light:text-light-accent font-mono">
          $ ls projects/
        </h1>
        <p className="terminal:text-terminal-text light:text-light-text opacity-80 font-mono">
          AI platforms, security tooling, CTF contributions and research
        </p>
      </div>

      {/* Featured Projects */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono animate-rise">
          $ find . -name "*featured*"
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects
            .filter((p) => p.featured)
            .map((project, index) => (
              <Reveal key={index} delay={index * 100}>
                <div className="h-full ember-card border terminal:border-terminal-accent light:border-gray-300 rounded-lg p-6 terminal:hover:bg-terminal-accent/5 light:hover:bg-orange-50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold terminal:text-terminal-text light:text-light-text font-mono">
                      {project.title}
                    </h3>
                    <span className={`text-xs font-mono px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="terminal:text-terminal-text light:text-light-text opacity-80 mb-4 leading-relaxed text-sm">
                    {project.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="text-xs font-mono px-2 py-1 terminal:bg-terminal-accent/10 light:bg-gray-100 terminal:text-terminal-accent light:text-light-accent rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-sm">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                      >
                        $ git clone
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                      >
                        $ open demo
                      </a>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
        </div>
      </section>

      {/* All Projects */}
      <section>
        <h2 className="text-xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
          $ ls -la
        </h2>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <Reveal key={index} delay={index * 60}>
              <div className="ember-card border terminal:border-terminal-accent/30 light:border-gray-300 rounded p-4 terminal:hover:border-terminal-accent light:hover:border-gray-400">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                        {project.title}
                      </h3>
                      <span className={`text-xs font-mono ${getStatusColor(project.status)}`}>[{project.status}]</span>
                    </div>
                    <p className="terminal:text-terminal-text light:text-light-text opacity-70 text-sm mb-2">
                      {project.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      {project.technologies.slice(0, 3).map((tech, techIndex) => (
                        <span key={techIndex} className="terminal:text-terminal-accent light:text-light-accent opacity-80">
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="terminal:text-terminal-text light:text-light-text opacity-50">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-sm">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                      >
                        GitHub
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                      >
                        Demo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="mt-12 pt-8 border-t terminal:border-terminal-accent/30 light:border-gray-300 text-center">
        <div className="font-mono terminal:text-terminal-text light:text-light-text opacity-70">
          <p className="mb-2">$ echo "More projects coming soon..."</p>
          <p>
            Check out my{" "}
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="terminal:text-terminal-accent light:text-light-accent hover:underline"
            >
              GitHub
            </a>{" "}
            for the latest updates
          </p>
        </div>
      </div>
    </div>
  )
}
