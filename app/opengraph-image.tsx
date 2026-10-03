import { ImageResponse } from "next/og"
import { site } from "@/lib/site"

export const runtime = "nodejs"
export const alt = site.title
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0c0806",
          padding: "80px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", color: "#ff6b3d", fontSize: 30, marginBottom: 24 }}>$ whoami</div>
        <div style={{ display: "flex", fontSize: 76, color: "#ede4d3", fontWeight: 700, lineHeight: 1.1 }}>
          <span style={{ color: "#ff6b3d" }}>~/</span>
          {site.handle}
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#ede4d3", marginTop: 28, opacity: 0.9 }}>
          {site.name}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#9c8873", marginTop: 14 }}>
          CTF Player • Security Researcher • Challenge Author
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            height: 6,
            width: 260,
            background: "#ff6b3d",
          }}
        />
      </div>
    ),
    size,
  )
}
