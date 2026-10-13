import { repo, site } from "@/lib/site"

/**
 * Every project on /projects (and the featured ones on the home page).
 *
 * - `featured: true`  shows the project in the large cards at the top of /projects
 *                     and in "Selected work" on the home page (first 4)
 * - `github` / `demo` set to null to hide the link (e.g. private repos)
 * - order here = order on the page
 */
export type ProjectStatus = "Active" | "Completed" | "Research" | "Archived"

export interface Project {
  title: string
  description: string
  technologies: string[]
  github: string | null
  demo: string | null
  status: ProjectStatus
  featured: boolean
}

export const projects: Project[] = [
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
      "This very website! A portfolio and blog built with Next.js for CTF writeups — started life as a terminal theme, now a red-team HUD with a particle hero, glitch effects, smooth page transitions and a hidden shell (press ` to open it).",
    technologies: ["Next.js", "React", "TypeScript", "Canvas", "CSS"],
    github: repo("terminal-portfolio"),
    demo: site.url,
    status: "Active",
    featured: false,
  },
]

export const featuredProjects = projects.filter((p) => p.featured)
