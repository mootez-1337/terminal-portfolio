import Reveal from "@/components/effects/reveal"

export default function AboutPage() {
  const skills = {
    Programming: ["Python (Advanced)", "C", "Java", "JavaScript", "PHP", "Bash"],
    Cybersecurity: [
      "Web Security",
      "OWASP Top 10",
      "SSDLC",
      "Network Analysis",
      "Penetration Testing",
      "CTF (Forensics, Web, MISC, Pyjails)",
    ],
    "Web Development": ["HTML", "CSS", "JavaScript", "Node.js", "Next.js", "React.js", "Tailwind CSS"],
    "AI & Data": ["LightGBM", "RAG Pipelines", "ChromaDB", "Ollama (Local LLMs)", "Whisper", "Semantic Embeddings"],
    "Tools & Databases": ["PostgreSQL", "MySQL", "SQLite", "Steampipe", "Prisma ORM", "Docker", "Git", "FastAPI"],
    "DevOps & Deployment": ["Vercel", "GitHub Actions (CI/CD)", "Docker Compose", "Nginx"],
  }

  const achievements = [
    {
      title: "Claw The Flag CTF",
      description: "6th place",
      date: "2025",
    },
    {
      title: "Darkes Hour CTF",
      description: "5th place",
      date: "2025",
    },
    {
      title: "CSAW CTF 2024",
      description: "Quals 4th in MENA / Finals 5th in MENA",
      date: "2024",
    },
    {
      title: "CSAW CTF 2023",
      description: "Quals 4th in MENA / Finals 7th in MENA",
      date: "2023",
    },
    {
      title: "CyberMaze V3",
      description: "1st place",
      date: "2023",
    },
    {
      title: "CyberMaze V4",
      description: "2nd place",
      date: "2024",
    },
    {
      title: "KernelKombat CTF",
      description: "1st place",
      date: "2024",
    },
    {
      title: "GISAMM CTF",
      description: "2nd place",
      date: "2024",
    },
    {
      title: "Cyber Sky Hackathon",
      description: "3rd place",
      date: "2025",
    },
    {
      title: "AIMinds Hackathon",
      description: "5th place",
      date: "2026",
    },
    {
      title: "Space Heroes CTF",
      description: "9th place",
      date: "2024",
    },
    {
      title: "SwampCTF",
      description: "29th place",
      date: "2024",
    },
  ]

  const experience = [
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

  const publications = [
    {
      title: "AI-Driven Threat Knowledge Platform Inspired by MITRE ATT&CK Using Dark Web Intelligence",
      venue: "IEEE WETICE 2026 — 34th Int'l Conference on Enabling Technologies, Paris",
      date: "2026",
      description:
        "Proposes an AI-driven platform that aggregates Dark Web intelligence and maps threat actors, techniques and indicators to the MITRE ATT&CK framework to proactively enrich threat knowledge bases.",
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 animate-rise">
        <h1 className="text-3xl font-bold mb-4 terminal:text-terminal-accent light:text-light-accent font-mono">
          $ cat about.txt
        </h1>
      </div>

      {/* Introduction */}
      <Reveal>
        <section className="mb-12">
          <div className="border terminal:border-terminal-accent light:border-gray-300 rounded-lg p-6 terminal:bg-terminal-accent/5 light:bg-gray-50 ember-card">
            <div className="font-mono terminal:text-terminal-text light:text-light-text space-y-4">
              <p className="text-lg">
                <span className="terminal:text-terminal-accent light:text-light-accent">$ whoami</span>
              </p>
              <p className="leading-relaxed">
                Hi! I'm{" "}
                <strong className="terminal:text-terminal-accent light:text-light-accent">
                  Mootez Ben Slimen (3angour)
                </strong>
                , Master's student in Cybersecurity with a strong background in software engineering, CTF competitions
                and Python automation. Excellence Scholarship recipient at MedTech University.
              </p>
              <p className="leading-relaxed">
                Experienced in secure system development, vulnerability research and cybersecurity event organization.
                Published researcher (IEEE WETICE 2026) passionate about applying technical expertise and
                problem-solving skills in real-world security environments.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Education */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat education.log
          </h2>

          <div className="space-y-4">
            <div className="border-l-2 terminal:border-terminal-accent light:border-light-accent pl-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                  MedTech University (Mediterranean Institute of Technology)
                </h3>
                <span className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono">
                  Sep 2025 - Present
                </span>
              </div>
              <p className="terminal:text-terminal-text light:text-light-text opacity-80">
                Master's Degree in Cybersecurity • Excellence Scholarship (75%) • Tunis, Tunisia
              </p>
            </div>

            <div className="border-l-2 terminal:border-terminal-accent light:border-light-accent pl-4 py-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                  Higher Institute of Computer Science
                </h3>
                <span className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono">
                  2022 - 2025
                </span>
              </div>
              <p className="terminal:text-terminal-text light:text-light-text opacity-80">
                Bachelor's Degree in Software Engineering and Information Systems • Ariana, Tunisia
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Research & Publications */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat publications.bib
          </h2>
          <div className="space-y-4">
            {publications.map((pub, index) => (
              <div
                key={index}
                className="border terminal:border-terminal-accent/60 light:border-light-accent/60 rounded-lg p-5 terminal:bg-terminal-accent/5 light:bg-orange-50 ember-card"
              >
                <div className="flex items-start justify-between mb-2 gap-4">
                  <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                    {pub.title}
                  </h3>
                  <span className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono shrink-0">
                    {pub.date}
                  </span>
                </div>
                <p className="terminal:text-terminal-accent light:text-light-accent font-mono text-sm mb-2">
                  ✓ Accepted — {pub.venue}
                </p>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80 text-sm">
                  {pub.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Experience */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat experience.log
          </h2>
          <div className="space-y-6">
            {experience.map((exp, index) => (
              <div
                key={index}
                className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                      {exp.title}
                    </h3>
                    <p className="terminal:text-terminal-accent light:text-light-accent font-mono text-sm">
                      {exp.company}
                    </p>
                  </div>
                  <span className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono">
                    {exp.period}
                  </span>
                </div>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80">{exp.description}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Skills */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ ls skills/
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(skills).map(([category, items]) => (
              <div
                key={category}
                className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card"
              >
                <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-3">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs font-mono px-2 py-1 terminal:bg-terminal-accent/10 light:bg-gray-100 terminal:text-terminal-accent light:text-light-accent rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* CTF Achievements */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat ctf_achievements.log
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono">
                    {achievement.title}
                  </h3>
                  <span className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono">
                    {achievement.date}
                  </span>
                </div>
                <p className="terminal:text-terminal-text light:text-light-text opacity-80 text-sm">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Community & Volunteering */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat community.log
          </h2>
          <div className="space-y-4">
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">
                Cr4ck0ut CTF — Organizer & Challenge Author
              </h3>
              <p className="terminal:text-terminal-text light:text-light-text opacity-80 text-sm">
                Deployed and maintained CTFd infrastructure; designed Web, Forensics and MISC challenges, including
                advanced Python Jail scenarios.
              </p>
            </div>
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">
                SecuriCON — Core Organizer & Technical Lead
              </h3>
              <p className="terminal:text-terminal-text light:text-light-text opacity-80 text-sm">
                Co-organized a cybersecurity event with 240+ participants and international sponsors (Hack The Box,
                Altered Security, Security Impossible); supervised IoT Hacking, Active Directory, Friendly CTF and
                Attack & Defense competitions.
              </p>
            </div>
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">
                Training & Workshops
              </h3>
              <p className="terminal:text-terminal-text light:text-light-text opacity-80 text-sm">
                Delivered 4 introductory cybersecurity workshops; conducted hands-on Web Exploitation and Digital
                Forensics sessions; led CTF training with live challenge solving.
              </p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Languages */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ cat languages.txt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 text-center ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">Arabic</h3>
              <p className="terminal:text-terminal-accent light:text-light-accent text-sm">Native</p>
            </div>
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 text-center ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">French</h3>
              <p className="terminal:text-terminal-accent light:text-light-accent text-sm">Fluent</p>
            </div>
            <div className="border terminal:border-terminal-accent/30 light:border-gray-300 rounded-lg p-4 text-center ember-card">
              <h3 className="font-bold terminal:text-terminal-text light:text-light-text font-mono mb-2">English</h3>
              <p className="terminal:text-terminal-accent light:text-light-accent text-sm">Professional</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Contact Links */}
      <Reveal>
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 terminal:text-terminal-accent light:text-light-accent font-mono">
            $ find . -name "*contact*"
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="mailto:mootezmootez6@gmail.com"
              className="flex items-center gap-3 p-4 border terminal:border-terminal-accent/30 light:border-gray-300 rounded terminal:hover:border-terminal-accent light:hover:border-gray-400 ember-card"
            >
              <span className="text-2xl">📧</span>
              <div className="font-mono">
                <div className="terminal:text-terminal-text light:text-light-text font-bold">Email</div>
                <div className="terminal:text-terminal-accent light:text-light-accent text-sm">
                  mootezmootez6@gmail.com
                </div>
              </div>
            </a>

            <a
              href="https://linkedin.com/in/mootez-ben-slimen"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 border terminal:border-terminal-accent/30 light:border-gray-300 rounded terminal:hover:border-terminal-accent light:hover:border-gray-400 ember-card"
            >
              <span className="text-2xl">💼</span>
              <div className="font-mono">
                <div className="terminal:text-terminal-text light:text-light-text font-bold">LinkedIn</div>
                <div className="terminal:text-terminal-accent light:text-light-accent text-sm">Mootez Ben Slimen</div>
              </div>
            </a>

            <div className="flex items-center gap-3 p-4 border terminal:border-terminal-accent/30 light:border-gray-300 rounded ember-card">
              <span className="text-2xl">📍</span>
              <div className="font-mono">
                <div className="terminal:text-terminal-text light:text-light-text font-bold">Location</div>
                <div className="terminal:text-terminal-accent light:text-light-accent text-sm">Ariana, Tunisia</div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <div className="text-center font-mono terminal:text-terminal-text light:text-light-text opacity-70 pt-8 border-t terminal:border-terminal-accent/30 light:border-gray-300">
        <p>$ echo "Thanks for reading! Feel free to reach out."</p>
        <p className="mt-2">
          <span className="terminal:text-terminal-accent light:text-light-accent">~/about.txt</span> [EOF]
        </p>
      </div>
    </div>
  )
}
