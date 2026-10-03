import { ImageResponse } from "next/og"
import { getPostData, getSortedPostsData } from "@/lib/posts"
import { site } from "@/lib/site"

export const runtime = "nodejs"
export const alt = "CTF write-up"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return getSortedPostsData().map((post) => ({ slug: post.slug }))
}

export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostData(slug)
  const title = post?.title ?? "Write-up"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c0806",
          padding: "72px",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", color: "#ff6b3d", fontSize: 28 }}>$ cat {slug}.md</div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 48 ? 56 : 68,
            color: "#ede4d3",
            fontWeight: 700,
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#9c8873" }}>
            {post?.date ?? ""}
            {post ? `  •  ${post.readingTime} min read` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#ff6b3d" }}>~/{site.handle}</div>
        </div>
      </div>
    ),
    size,
  )
}
