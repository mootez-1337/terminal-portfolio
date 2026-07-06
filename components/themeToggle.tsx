"use client"

import { useEffect, useState } from "react"

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

  const cycleTheme = () => {
    const themes: Theme[] = ["terminal", "light"]
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    switch (theme) {
      case "terminal":
        return "💻 Terminal"
      case "light":
        return "☀️ Light"
      default:
        return "💻 Terminal"
    }
  }

  if (!mounted) {
    return (
      <div className="p-2 rounded border border-gray-500">
        <span className="text-sm">🌙</span>
      </div>
    )
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded border transition-all duration-200 text-sm font-mono terminal:border-terminal-accent/50 terminal:hover:border-terminal-accent terminal:hover:bg-terminal-accent/10 terminal:text-terminal-text light:border-gray-300 light:hover:bg-gray-100 light:text-light-text"
      aria-label="Cycle theme"
    >
      {getThemeIcon()}
    </button>
  )
}
