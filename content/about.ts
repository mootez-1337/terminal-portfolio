/**
 * Everything shown on /about. Edit the arrays below; the page renders them in order.
 * Achievements with `highlight: true` get the large red card treatment.
 */

export const intro = {
  lead: "Master's student in Cybersecurity with a strong background in software engineering, CTF competitions and Python automation. Excellence Scholarship recipient at MedTech University, and a full-scholarship alum of the University of Zurich's Deep Dive into Blockchain summer school.",
  body: "Experienced in secure system development, vulnerability research and cybersecurity event organization. Published researcher (IEEE WETICE 2026) passionate about applying technical expertise and problem-solving skills in real-world security environments.",
}

/** Short focus areas used on the home page "Operator profile" strip. */
export const focusAreas = [
  {
    code: "01",
    title: "AI offensive security",
    text: "Red-teaming LLMs and chatbots — jailbreaks, prompt injection and data poisoning — and building the tooling that helps autonomous agents find new ones.",
  },
  {
    code: "02",
    title: "Capture the flag",
    text: "Web, forensics, MISC and pyjails. Competitor, team lead and challenge author for national CTFs.",
  },
  {
    code: "03",
    title: "Threat research",
    text: "Dark Web intelligence mapped to MITRE ATT&CK, OSINT automation and vulnerability operations.",
  },
]

export const education = [
  {
    school: "MedTech University (Mediterranean Institute of Technology)",
    period: "Sep 2025 - Present",
    detail: "Master's Degree in Cybersecurity • Excellence Scholarship (75%) • Tunis, Tunisia",
  },
  {
    school: "University of Zurich (UZH), Switzerland",
    period: "2026",
    detail: "Deep Dive into Blockchain (DDiB) Summer School • Full Scholarship",
  },
  {
    school: "Higher Institute of Computer Science",
    period: "2022 - 2025",
    detail: "Bachelor's Degree in Software Engineering and Information Systems • Ariana, Tunisia",
  },
]

export const publications = [
  {
    title: "AI-Driven Threat Knowledge Platform Inspired by MITRE ATT&CK Using Dark Web Intelligence",
    venue: "IEEE WETICE 2026 — 34th Int'l Conference on Enabling Technologies, Paris",
    date: "2026",
    description:
      "Proposes an AI-driven platform that aggregates Dark Web intelligence and maps threat actors, techniques and indicators to the MITRE ATT&CK framework to proactively enrich threat knowledge bases.",
  },
]

export const experience = [
  {
    title: "AI Offensive Security Intern",
    company: "AnTitech",
    period: "Jul 2026 - Present",
    description:
      "Building an observer system that gathers data to help autonomous AI red-teaming agents discover new jailbreak, prompt-injection and data-poisoning techniques against target LLMs and chatbots.",
  },
  {
    title: "OSINT Automation Intern",
    company: "Mazars Forvis",
    period: "Jun 2026",
    description:
      "Built an OSINT automation platform and data pipelines to collect, normalize and correlate open-source intelligence for security assessments.",
  },
  {
    title: "Graduation Internship",
    company: "ITC-Consulting",
    period: "Feb 2025 - May 2025",
    description:
      "Designed and implemented a Vulnerability Operation Center (VOC): DNS traffic monitoring for anomaly & exfiltration detection, Python-based CVE scanners for web applications, and automated CVE aggregation, alerting and monthly reporting.",
  },
  {
    title: "Internship",
    company: "DefensyLab",
    period: "Aug 2023",
    description:
      "Developed a custom Sysreptor plugin using Microsoft Steampipe and created specialized cybersecurity report templates for assessment teams.",
  },
  {
    title: "Technical Leader",
    company: "Securinets SMU",
    period: "2025 - 2026",
    description:
      "Defining the technical roadmap for cybersecurity activities; mentoring members in exploitation techniques, forensic analysis and scripting.",
  },
  {
    title: "Team Leader & CTF Author",
    company: "Securinets ISI",
    period: "2022 - 2023",
    description:
      "Mentored 20+ students in Web, Forensics and MISC; authored challenges for Mini-CTF, Qualifications and Finals; co-organized SecuriCON (240+ participants, sponsors incl. Hack The Box).",
  },
]

export const skills: Record<string, string[]> = {
  Programming: ["Python (Advanced)", "C", "Java", "JavaScript", "PHP", "Bash"],
  Cybersecurity: [
    "Web Security",
    "OWASP Top 10",
    "SSDLC",
    "Network Analysis",
    "Penetration Testing",
    "OSINT",
    "CTF (Forensics, Web, MISC, Pyjails)",
  ],
  "AI & Automation": [
    "RAG Pipelines",
    "LLM Integration (Ollama, local & API)",
    "Agentic Workflow Design",
    "AI Red-Teaming",
    "Python Automation",
    "LightGBM",
    "ChromaDB",
    "Whisper",
    "Semantic Embeddings",
  ],
  "Blockchain & Web3": ["Smart Contracts", "Token Incentive Design", "UZH DDiB"],
  "Web Development": ["HTML", "CSS", "JavaScript", "Node.js", "Next.js", "React.js", "Tailwind CSS"],
  "Tools & Databases": ["PostgreSQL", "MySQL", "SQLite", "Steampipe", "Prisma ORM", "Docker", "Git", "FastAPI"],
  "DevOps & Deployment": ["Vercel", "GitHub Actions (CI/CD)", "Docker Compose", "Nginx"],
}

export interface Achievement {
  title: string
  description: string
  date: string
  highlight?: boolean
}

export const achievements: Achievement[] = [
  {
    title: "CSAW CTF 2026",
    description: "Quals 1st in MENA / 2nd worldwide — qualified for Finals",
    date: "2026",
    highlight: true,
  },
  { title: "Claw The Flag CTF", description: "6th place", date: "2025" },
  { title: "Darkes Hour CTF", description: "5th place", date: "2025" },
  { title: "CSAW CTF 2024", description: "Quals 4th in MENA / Finals 5th in MENA", date: "2024" },
  { title: "CSAW CTF 2023", description: "Quals 4th in MENA / Finals 7th in MENA", date: "2023" },
  { title: "CyberMaze V3", description: "1st place", date: "2023" },
  { title: "CyberMaze V4", description: "2nd place", date: "2024" },
  { title: "KernelKombat CTF", description: "1st place", date: "2024" },
  { title: "GISAMM CTF", description: "2nd place", date: "2024" },
  { title: "Cyber Sky Hackathon", description: "3rd place", date: "2025" },
  { title: "AIMinds Hackathon", description: "5th place", date: "2026" },
  { title: "Space Heroes CTF", description: "9th place", date: "2024" },
  { title: "SwampCTF", description: "29th place", date: "2024" },
]

export const community = [
  {
    title: "Cr4ck0ut CTF — Organizer & Challenge Author",
    description:
      "Deployed and maintained CTFd infrastructure; designed Web, Forensics and MISC challenges, including advanced Python Jail scenarios.",
  },
  {
    title: "SecuriCON — Core Organizer & Technical Lead",
    description:
      "Co-organized a cybersecurity event with 240+ participants and international sponsors (Hack The Box, Altered Security, Security Impossible); supervised IoT Hacking, Active Directory, Friendly CTF and Attack & Defense competitions.",
  },
  {
    title: "Training & Workshops",
    description:
      "Delivered 4 introductory cybersecurity workshops; conducted hands-on Web Exploitation and Digital Forensics sessions; led CTF training with live challenge solving.",
  },
]

export const languages = [
  { name: "Arabic", level: "Native" },
  { name: "French", level: "Fluent" },
  { name: "English", level: "Professional" },
]
