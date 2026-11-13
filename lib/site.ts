/**
 * Single source of truth for identity, links and SEO defaults.
 * Update handles here — pages read from this, never hardcode.
 */
export const site = {
  name: "Mootez Ben Slimen",
  handle: "3angour",
  title: "Mootez Ben Slimen (3angour) — Cybersecurity & CTF",
  role: "AI Offensive Security Intern & Cybersecurity Master's Student",
  description:
    "Mootez Ben Slimen (3angour) — AI offensive security and LLM red-teaming, cybersecurity Master's student and CTF player. CTF write-ups, security tooling and research.",
  url: "https://blog.3angour.tech",
  locale: "en",
  location: "Ariana, Tunisia",
  email: "mootez.benslimen@medtech.tn",

  github: "https://github.com/mootez-1337",
  githubUser: "mootez-1337",
  linkedin: "https://linkedin.com/in/mootez-ben-slimen",
  gitlab: "https://gitlab.com/mootez",
  gitlabUser: "mootez",
  ctftime: "https://ctftime.org/user/180420",

  resume: {
    aiSecurity: "/mootez-ben-slimen-resume-ai-security.pdf",
    socThreatIntel: "/mootez-ben-slimen-resume-soc-threat-intel.pdf",
  },
} as const

/** Résumé variants offered by every "Résumé" button (the terminal keeps using `resume.aiSecurity`). */
export const resumes = [
  { id: "ai", label: "AI Security", meta: "LLM red-teaming & offensive security", href: site.resume.aiSecurity },
  { id: "soc", label: "SOC & Threat Intel", meta: "Detection, monitoring & threat intelligence", href: site.resume.socThreatIntel },
] as const

export const repo = (name: string) => `${site.github}/${name}`
