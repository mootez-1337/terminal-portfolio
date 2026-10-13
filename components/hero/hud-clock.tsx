"use client"

import { useEffect, useState } from "react"

const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Tunis",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})

/** Live local time in Tunis for the hero HUD. Renders a placeholder on the server. */
export default function HudClock() {
  const [time, setTime] = useState("--:--:--")

  useEffect(() => {
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  return <span className="tabular">{time}</span>
}
