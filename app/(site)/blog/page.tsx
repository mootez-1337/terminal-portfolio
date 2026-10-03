import type { Metadata } from "next"
import Link from "next/link"
import { getSortedPostsData } from "@/lib/posts"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Blog — CTF Write-ups & Security Research",
  description: "CTF write-ups, security research and technical notes by Mootez Ben Slimen (3angour).",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  const allPosts = getSortedPostsData()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 terminal:text-terminal-accent light:text-light-accent font-mono">
          $ ls blog/
        </h1>
        <p className="terminal:text-terminal-text light:text-light-text opacity-80 font-mono">
          CTF writeups, security research, and technical insights
        </p>
      </div>

      {allPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="terminal:text-terminal-accent light:text-light-accent font-mono text-lg mb-4">
            $ find . -name "*.md" -type f
          </div>
          <p className="terminal:text-terminal-text light:text-light-text opacity-60">
            No posts found. Check back soon for CTF writeups!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {allPosts.map(({ slug, date, title, excerpt, readingTime, tags }) => (
            <article
              key={slug}
              className="ember-card border terminal:border-terminal-accent light:border-gray-300 rounded-lg p-6 terminal:hover:bg-terminal-accent/5 light:hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-xl font-bold terminal:text-terminal-text light:text-light-text font-mono">
                  <Link
                    href={`/blog/${slug}`}
                    className="terminal:hover:text-terminal-accent light:hover:text-light-accent transition-colors"
                  >
                    {title}
                  </Link>
                </h2>
                <time
                  dateTime={date}
                  className="text-sm terminal:text-terminal-accent light:text-light-accent font-mono opacity-80 shrink-0"
                >
                  {date}
                </time>
              </div>

              {excerpt && (
                <p className="terminal:text-terminal-text light:text-light-text opacity-70 text-sm mb-4 leading-relaxed">
                  {excerpt}
                </p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono px-2 py-1 terminal:bg-terminal-accent/10 light:bg-gray-100 terminal:text-terminal-accent light:text-light-accent rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm font-mono">
                <Link
                  href={`/blog/${slug}`}
                  className="terminal:text-terminal-accent light:text-light-accent hover:underline"
                >
                  $ cat {slug}.md
                </Link>
                <span className="terminal:text-terminal-text light:text-light-text opacity-60">
                  • {readingTime} min read
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t terminal:border-terminal-accent/30 light:border-gray-300">
        <div className="text-center font-mono terminal:text-terminal-text light:text-light-text opacity-70">
          <p className="mb-2">$ echo "Want to see more content?"</p>
          <p>
            Follow me on{" "}
            <a
              href={site.github}
              target="_blank"
              rel="noopener noreferrer"
              className="terminal:text-terminal-accent light:text-light-accent hover:underline"
            >
              GitHub
            </a>{" "}
            or subscribe via{" "}
            <a href="/feed.xml" className="terminal:text-terminal-accent light:text-light-accent hover:underline">
              RSS
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
