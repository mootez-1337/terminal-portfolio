"use client"

import { useEffect, useState } from "react"
import { Sun, Terminal } from "lucide-react"

type Theme = "terminal" | "light"

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("terminal")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for saved theme preference or default to terminal
    const savedTheme = localStorage.getItem("theme") as Theme

    if (savedTheme && ["terminal", "light"].includes(savedTheme)) {
      setTheme(savedTheme)
    } else {
      setTheme("terminal")
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      // Remove all theme classes first
      document.documentElement.classList.remove("dark", "light", "terminal")

      // Apply the correct theme classes
      if (theme === "terminal") {
        document.documentElement.classList.add("dark", "terminal")
      } else if (theme === "light") {
        document.documentElement.classList.add("light")
      }

      localStorage.setItem("theme", theme)
    }
  }, [theme, mounted])

  const toggleTheme = () => setTheme(theme === "terminal" ? "light" : "terminal")

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-md border terminal:border-terminal-accent/30 light:border-gray-300" aria-hidden="true" />
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="group relative w-9 h-9 flex items-center justify-center rounded-md border transition-all duration-300 terminal:border-terminal-accent/30 terminal:text-terminal-accent terminal:hover:border-terminal-accent terminal:hover:bg-terminal-accent/10 terminal:hover:shadow-[0_0_16px_rgba(255,107,61,0.35)] light:border-gray-300 light:text-light-accent light:hover:border-light-accent light:hover:bg-orange-50"
      aria-label={theme === "terminal" ? "Switch to light theme" : "Switch to terminal theme"}
      title={theme === "terminal" ? "Switch to light theme" : "Switch to terminal theme"}
    >
      {theme === "terminal" ? (
        <Sun className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110" />
      ) : (
        <Terminal className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
      )}
    </button>
  )
}
