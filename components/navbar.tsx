import Link from "next/link"
import ThemeToggle from "./themeToggle"

const links = [
  { href: "/blog", label: "blog" },
  { href: "/projects", label: "projects" },
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b terminal:border-terminal-accent/20 light:border-gray-200 backdrop-blur-md terminal:bg-terminal-bg/80 light:bg-light-bg/80">
      <div className="flex items-center gap-8 font-mono">
        <Link
          href="/"
          className="text-xl font-bold terminal:text-terminal-accent light:text-light-accent hover:opacity-80 transition-opacity cursor-blink"
        >
          ~/3angour
        </Link>
        <div className="hidden md:flex gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link terminal:hover:text-terminal-accent light:hover:text-light-accent transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <ThemeToggle />
    </nav>
  )
}
