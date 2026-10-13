import { site } from "@/lib/site"
import { projects } from "@/content/projects"
import { highlights } from "@/content/highlights"
import { focusAreas, intro } from "@/content/about"

export interface TermPost {
  slug: string
  title: string
  date: string
}

export type Tone = "default" | "muted" | "accent" | "error" | "ok"

export interface Line {
  text: string
  tone?: Tone
  href?: string
}

export type Action =
  | { type: "navigate"; href: string }
  | { type: "external"; href: string }
  | { type: "download"; href: string }
  | { type: "clear" }
  | { type: "close" }

export interface Result {
  lines: Line[]
  action?: Action
}

export interface Context {
  posts: TermPost[]
  history: string[]
}

const PAGES: Record<string, string> = {
  "~": "/",
  "/": "/",
  home: "/",
  blog: "/blog",
  projects: "/projects",
  about: "/about",
  contact: "/contact",
}

const FILES = ["about.txt", "flag.txt", "resume.pdf", "contact.sh"]
const DIRS = ["blog/", "projects/"]

export const COMMANDS: { name: string; help: string; hidden?: boolean }[] = [
  { name: "help", help: "show this list" },
  { name: "whoami", help: "who is behind this shell" },
  { name: "ls", help: "list files — try `ls blog`" },
  { name: "cd", help: "go to a page — blog, projects, about, contact, ~" },
  { name: "open", help: "open a write-up by slug (tab completes)" },
  { name: "cat", help: "read a file — about.txt, flag.txt, <slug>.md" },
  { name: "projects", help: "list projects" },
  { name: "highlights", help: "latest wins" },
  { name: "resume", help: "download my résumé (or `wget resume.pdf`)" },
  { name: "github", help: "open my GitHub (or `git remote -v`)" },
  { name: "contact", help: "how to reach me" },
  { name: "socials", help: "links elsewhere" },
  { name: "neofetch", help: "system info" },
  { name: "history", help: "command history" },
  { name: "clear", help: "clear the screen (Ctrl+L)" },
  { name: "exit", help: "close the shell (Esc)" },
  { name: "sudo", help: "", hidden: true },
  { name: "rm", help: "", hidden: true },
  { name: "hack", help: "", hidden: true },
  { name: "matrix", help: "", hidden: true },
  { name: "theme", help: "", hidden: true },
  { name: "date", help: "", hidden: true },
  { name: "echo", help: "", hidden: true },
  { name: "pwd", help: "", hidden: true },
  { name: "uname", help: "", hidden: true },
  { name: "vim", help: "", hidden: true },
  { name: "wget", help: "", hidden: true },
  { name: "git", help: "", hidden: true },
]

const out = (text: string, tone: Tone = "default", href?: string): Line => ({ text, tone, href })

export const BANNER: Line[] = [
  out("RED CELL // shell v2.0 — connected to blog.3angour.tech", "accent"),
  out("You found the old terminal. Type `help` to list commands, Esc to close.", "muted"),
]

const NEOFETCH = [
  " _____   ___  ",
  "|____ | / _ \\ ",
  "    / // /_\\ \\",
  "    \\ \\|  _  |",
  ".___/ /| | | |",
  "\\____/ \\_| |_/",
]

function neofetch(): Line[] {
  const info: [string, string][] = [
    ["", `visitor@${site.handle}`],
    ["", "---------------"],
    ["OS", "Red Cell v2.0 (Next.js)"],
    ["Host", site.url.replace("https://", "")],
    ["Operator", site.name],
    ["Focus", "AI offensive security · LLM red-teaming"],
    ["CTF", "CSAW '26 quals — 1st MENA, 2nd worldwide"],
    ["Research", "IEEE WETICE 2026 — Paris"],
    ["Location", site.location],
  ]
  return info.map(([k, v], i) => {
    const art = (NEOFETCH[i] ?? "").padEnd(16, " ")
    return out(`${art}${k ? `${k}: ` : ""}${v}`, i < 2 ? "accent" : "default")
  })
}

function resolvePage(arg: string): string | null {
  const clean = arg.replace(/^\.\//, "").replace(/\/$/, "").replace(/^~\//, "")
  if (PAGES[clean]) return PAGES[clean]
  if (clean.startsWith("blog/")) return `/${clean}`
  return null
}

export function complete(input: string, ctx: Context): { value: string; options: string[] } {
  const parts = input.split(/\s+/)
  if (parts.length <= 1) {
    const opts = COMMANDS.filter((c) => !c.hidden && c.name.startsWith(parts[0])).map((c) => c.name)
    return { value: opts.length === 1 ? `${opts[0]} ` : input, options: opts.length > 1 ? opts : [] }
  }
  const [cmd, ...rest] = parts
  const arg = rest.join(" ")
  let pool: string[] = []
  if (cmd === "cd" || cmd === "ls") pool = Object.keys(PAGES).filter((p) => p.length > 1)
  if (cmd === "open") pool = ctx.posts.map((p) => p.slug)
  if (cmd === "cat") pool = [...FILES, ...ctx.posts.map((p) => `${p.slug}.md`)]
  const opts = pool.filter((p) => p.startsWith(arg))
  return {
    value: opts.length === 1 ? `${cmd} ${opts[0]}` : input,
    options: opts.length > 1 ? opts : [],
  }
}

export function run(raw: string, ctx: Context): Result {
  const input = raw.trim()
  if (!input) return { lines: [] }
  const [cmd, ...args] = input.split(/\s+/)
  const arg = args.join(" ")

  switch (cmd) {
    case "help":
      return {
        lines: [
          out("available commands:", "accent"),
          ...COMMANDS.filter((c) => !c.hidden).map((c) => out(`  ${c.name.padEnd(12, " ")}${c.help}`)),
          out("  …and a few that aren't listed.", "muted"),
        ],
      }

    case "whoami":
      return {
        lines: [
          out(`${site.handle} — ${site.name}`, "accent"),
          out(site.role),
          ...focusAreas.map((f) => out(`  [${f.code}] ${f.title}`, "muted")),
        ],
      }

    case "ls": {
      if (!arg || arg === "~" || arg === ".") {
        return { lines: [out([...DIRS, ...FILES].join("   "))] }
      }
      if (arg.replace(/\/$/, "") === "blog") {
        if (!ctx.posts.length) return { lines: [out("blog/ is empty", "muted")] }
        return {
          lines: ctx.posts.map((p) => out(`${p.date}  ${p.slug}.md`, "default", `/blog/${p.slug}`)),
        }
      }
      if (arg.replace(/\/$/, "") === "projects") {
        return { lines: projects.map((p) => out(`[${p.status.toLowerCase()}]  ${p.title}`)) }
      }
      return { lines: [out(`ls: cannot access '${arg}': No such file or directory`, "error")] }
    }

    case "cd": {
      const target = resolvePage(arg || "~")
      if (!target) return { lines: [out(`cd: no such page: ${arg}`, "error")] }
      return { lines: [out(`→ ${target}`, "ok")], action: { type: "navigate", href: target } }
    }

    case "open": {
      if (!arg) return { lines: [out("usage: open <slug> — try `ls blog`", "muted")] }
      const page = resolvePage(arg)
      if (page) return { lines: [out(`→ ${page}`, "ok")], action: { type: "navigate", href: page } }
      const post = ctx.posts.find((p) => p.slug === arg.replace(/\.md$/, ""))
      if (!post) return { lines: [out(`open: no write-up called '${arg}'`, "error")] }
      return { lines: [out(`→ ${post.title}`, "ok")], action: { type: "navigate", href: `/blog/${post.slug}` } }
    }

    case "cat": {
      if (!arg) return { lines: [out("usage: cat <file>", "muted")] }
      if (arg === "about.txt") return { lines: [out(intro.lead), out(intro.body, "muted")] }
      if (arg === "flag.txt")
        return {
          lines: [
            out("3angour{y0u_f0und_th3_sh3ll_n0w_g0_r34d_th3_wr1t3ups}", "ok"),
            out("(not a CSAW flag. sorry.)", "muted"),
          ],
        }
      if (arg === "contact.sh") return { lines: [out("#!/bin/sh"), out(`mail ${site.email}`, "accent")] }
      if (arg === "resume.pdf") return { lines: [out("cat: resume.pdf: binary file — try `resume`", "error")] }
      const post = ctx.posts.find((p) => `${p.slug}.md` === arg || p.slug === arg)
      if (post)
        return {
          lines: [
            out(`# ${post.title}`, "accent"),
            out(`published ${post.date}`, "muted"),
            out(`open it: open ${post.slug}`, "default", `/blog/${post.slug}`),
          ],
        }
      return { lines: [out(`cat: ${arg}: No such file or directory`, "error")] }
    }

    case "projects":
      return {
        lines: projects.map((p) =>
          out(
            `${p.featured ? "★" : "·"} ${p.title}  [${p.status}]`,
            p.featured ? "accent" : "default",
            p.github ?? undefined,
          ),
        ),
      }

    case "highlights":
    case "news":
      return { lines: highlights.map((h) => out(`[${h.kind.toUpperCase()}] ${h.title} — ${h.summary}`, "accent")) }

    case "resume":
      return {
        lines: [out("downloading resume.pdf…", "ok")],
        action: { type: "download", href: site.resume.aiSecurity },
      }

    case "wget":
      if (arg.includes("resume"))
        return {
          lines: [out("downloading resume.pdf…", "ok")],
          action: { type: "download", href: site.resume.aiSecurity },
        }
      return { lines: [out("wget: missing URL — try `wget resume.pdf`", "error")] }

    case "github":
      return { lines: [out(site.github, "accent", site.github)], action: { type: "external", href: site.github } }

    case "git":
      if (arg === "remote -v")
        return {
          lines: [out(`origin  ${site.github} (fetch)`), out(`origin  ${site.github} (push)`)],
        }
      return { lines: [out("git: try `git remote -v`", "muted")] }

    case "contact":
      return {
        lines: [out(`mail: ${site.email}`, "accent", `mailto:${site.email}`), out("→ /contact", "ok")],
        action: { type: "navigate", href: "/contact" },
      }

    case "socials":
      return {
        lines: [
          out(`github    ${site.github}`, "default", site.github),
          out(`linkedin  ${site.linkedin}`, "default", site.linkedin),
          out(`gitlab    ${site.gitlab}`, "default", site.gitlab),
          out(`ctftime   ${site.ctftime}`, "default", site.ctftime),
          out(`rss       ${site.url}/feed.xml`, "default", "/feed.xml"),
        ],
      }

    case "neofetch":
      return { lines: neofetch() }

    case "history":
      return { lines: ctx.history.map((h, i) => out(`${String(i + 1).padStart(4, " ")}  ${h}`, "muted")) }

    case "clear":
      return { lines: [], action: { type: "clear" } }

    case "exit":
    case "logout":
    case "quit":
      return { lines: [], action: { type: "close" } }

    case "pwd":
      return { lines: [out(`/home/visitor/${site.handle}`)] }

    case "date":
      return { lines: [out(new Date().toString())] }

    case "echo":
      return { lines: [out(arg)] }

    case "uname":
      return { lines: [out("RedCell 2.0.0 next-15 x86_64 GNU/Portfolio")] }

    case "theme":
      return { lines: [out("theme: only one theme ships here, and it's red.", "accent")] }

    case "matrix":
      return { lines: [out("The green rain retired with v1. Respect.", "muted")] }

    case "sudo":
      if (arg === "rm -rf /" || arg === "rm -rf /*")
        return { lines: [out("Nice try. This is a static site — there's nothing to delete.", "error")] }
      return {
        lines: [
          out(`[sudo] password for visitor: `, "muted"),
          out("visitor is not in the sudoers file. This incident will be reported.", "error"),
        ],
      }

    case "rm":
      return { lines: [out("rm: permission denied. Breaking things is my job.", "error")] }

    case "vim":
    case "vi":
    case "nano":
    case "emacs":
      return { lines: [out("You're stuck now. (Just kidding — press Esc.)", "muted")] }

    case "hack":
      return {
        lines: [
          out("[*] enumerating attack surface…", "muted"),
          out(`[*] found: ${ctx.posts.length} write-ups, ${projects.length} projects, 1 accepted paper`, "muted"),
          out("[+] exploit chain complete: you are now reading a portfolio.", "ok"),
          out("[!] for real targets, see /blog", "accent", "/blog"),
        ],
      }

    default:
      return { lines: [out(`command not found: ${cmd}. Type \`help\`.`, "error")] }
  }
}
