# 3angour — Red Cell

Portfolio and CTF write-ups of **Mootez Ben Slimen (3angour)** — AI offensive security, LLM red-teaming, CTF.
Live at [blog.3angour.tech](https://blog.3angour.tech).

**Theme:** graphite + signal red HUD. Particle wordmark that scatters from your cursor, glitch and decrypt text,
scroll reveals, page wipes, a first-visit boot intro, and a hidden shell (press <kbd>`</kbd>).

**Stack:** Next.js 15 (App Router) · TypeScript · plain CSS (no UI framework) · Lenis smooth scroll ·
View Transitions (`next-view-transitions`) · Markdown via unified/remark.

---

## Run it

```bash
npm install        # first install creates package-lock.json — commit it
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # optional type check
```

**Deploy:** push to GitHub — Vercel builds it with zero config (framework preset: Next.js).

---

## Edit content

Everything you'd normally change lives in **`content/`** and **`lib/site.ts`**. Pages read from these files; no
component edits needed.

| What | File |
| --- | --- |
| Name, email, social links, résumé path | `lib/site.ts` |
| Home highlights (WETICE, CSAW…) + hero ticker | `content/highlights.ts` |
| Projects | `content/projects.ts` |
| About: intro, education, publications, experience, skills, CTF log, community, languages | `content/about.ts` |
| Blog posts | `content/blog/*.md` |
| Hero rotating roles + the desktop "target_profile" panel | `components/hero/hero.tsx` (`ROLES`, `READOUT`) |
| Navigation | `lib/nav.ts` |
| Colours, spacing, motion timings | `styles/tokens.css` |
| Fonts | `app/fonts.ts` |

### Add a project

Add an object to the `projects` array in `content/projects.ts`:

```ts
{
  title: "My New Tool",
  description: "What it does, in a sentence or three.",
  technologies: ["Python", "LLM", "FastAPI"],
  github: repo("my-new-tool"), // or null to hide the link
  demo: null,                  // or "https://…"
  status: "Active",            // "Active" | "Completed" | "Research" | "Archived"
  featured: true,              // big card on /projects; first 4 also show on the home page
},
```

Order in the array = order on the page.

### Add a blog post / write-up

Create `content/blog/my-slug.md` — the file name becomes the URL (`/blog/my-slug`):

```markdown
---
title: "CSAW 2026 — Challenge Name: What You Exploited"
date: "2026-09-20"
tags: ["csaw-2026", "web", "sqli"]
excerpt: "One or two sentences for the card, RSS and social previews."
---

Write-up body in Markdown. GitHub tables, fenced code blocks with syntax highlighting
and copy buttons all work.
```

Long scripts: put a file name after the language and the block collapses to a clickable bar
(`solver.py · python · 170 lines`) that expands in place. Add `open` to start it expanded.

````markdown
```python solver.py
...
```
````

`tags` and `excerpt` are optional (the excerpt falls back to the first paragraph). Newest `date` shows first.
Tags appear as filters on `/blog`. Sitemap, RSS feed and the per-post OpenGraph image update automatically.

### Add or change a highlight

Edit `content/highlights.ts`. Each highlight is a card on the home page and an item in the hero ticker:

```ts
{
  id: "csaw-finals-2026",
  kind: "CTF",
  title: "CSAW CTF 2026 Finals",
  summary: "Placed Xth overall.",
  meta: "CSAW Capture The Flag — Finals",
  ticker: "CSAW CTF 2026 Finals — Xth",
  stats: [{ value: 3, prefix: "#", label: "Finals" }], // big numbers; or use `badge: "IEEE '26"` instead
  href: "/blog",                                        // optional link + `cta` label
  cta: "Read the write-ups",
},
```

---

## Motion, accessibility and performance

- **First-visit intro** plays once on the home page (stored in `localStorage` as `3angour:intro-seen` — delete it
  to see it again). Skippable with any key, click or the button; never shown with reduced motion.
- **Hidden shell:** press <kbd>`</kbd> or type `sudo` anywhere (also in the footer and mobile menu). Commands live in
  `components/terminal/commands.ts` — `help`, `ls blog`, `open <slug>`, `cat flag.txt`, `neofetch`…
- **prefers-reduced-motion:** no intro, no glitch, no smooth scroll, static particle wordmark, instant reveals.
- **Mobile:** fewer particles, touch repels them, no smooth scroll / tilt / scanlines.
- **Heavy bits load late:** the particle engine, Lenis and the terminal are separate chunks loaded on idle or on
  first use; the particle loop pauses off-screen and when nothing moves.
- **Accessible:** skip link, semantic landmarks, one `h1` per page, visible focus rings, keyboard-trapped menu and
  shell (Esc closes), all text ≥ 5:1 contrast on the dark background.
- **Security headers** (`next.config.mjs`): HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`.

## Structure

```
app/                 routes (unchanged URLs), metadata, OG images, sitemap, robots, RSS
  (site)/            /, /blog, /blog/[slug], /projects, /about, /contact
components/
  hero/              particle engine, lazy canvas loader, HUD clock, hero
  motion/            intro, glitch, decrypt, scramble, reveals, smooth scroll, pointer FX
  shell/             header + mobile menu, footer, site shell
  terminal/          hidden shell + commands
  ui/                cards, headings, icons
content/             ← your content (projects, highlights, about, blog/*.md)
lib/                 site config, posts loader, nav, motion helpers
styles/              tokens, base, motion, layout, components, hero, pages, prose, terminal
public/              avatar, résumé PDF, icons
```

---

Built by 3angour. "Have something that needs breaking?" → [contact](https://blog.3angour.tech/contact)
