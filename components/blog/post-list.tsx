"use client"

import { useMemo, useState, type CSSProperties } from "react"
import type { PostMeta } from "@/lib/posts"
import PostCard from "@/components/ui/post-card"

/** Write-up list with tag filter chips. Fully server-rendered; filtering is client-side. */
export default function PostList({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const [active, setActive] = useState<string | null>(null)

  const visible = useMemo(() => (active ? posts.filter((p) => p.tags.includes(active)) : posts), [posts, active])

  return (
    <>
      {tags.length > 0 ? (
        <div className="filter" role="group" aria-label="Filter write-ups by tag">
          <button type="button" className="filter__chip" aria-pressed={active === null} onClick={() => setActive(null)}>
            all <span className="filter__count">{posts.length}</span>
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="filter__chip"
              aria-pressed={active === tag}
              onClick={() => setActive((cur) => (cur === tag ? null : tag))}
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {active ? `Showing ${visible.length} write-ups tagged ${active}` : `Showing all ${visible.length} write-ups`}
      </p>

      <ul className="post-list" role="list">
        {visible.map((post, i) => (
          <li key={post.slug} data-reveal style={{ "--delay": `${Math.min(i, 6) * 70}ms` } as CSSProperties}>
            <PostCard post={post} index={posts.indexOf(post)} headingLevel="h2" />
          </li>
        ))}
      </ul>
    </>
  )
}
