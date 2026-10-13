import type { Metadata } from "next"
import { getAllTags, getSortedPostsData } from "@/lib/posts"
import { site } from "@/lib/site"
import PageHeader from "@/components/ui/page-header"
import PostList from "@/components/blog/post-list"
import { Github, Rss } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "Blog — CTF Write-ups & Security Research",
  description: "CTF write-ups, security research and technical notes by Mootez Ben Slimen (3angour).",
  alternates: { canonical: "/blog" },
}

export default function BlogPage() {
  const allPosts = getSortedPostsData()
  const tags = getAllTags()

  return (
    <>
      <PageHeader code="01" label="field notes" title="Write-ups">
        <p>CTF writeups, security research, and technical insights</p>
      </PageHeader>

      <section className="container section section--tight" aria-label="All write-ups">
        {allPosts.length === 0 ? (
          <div className="empty">
            <p className="kicker">$ find . -name &quot;*.md&quot; -type f</p>
            <p>No posts found. Check back soon for CTF writeups!</p>
          </div>
        ) : (
          <PostList posts={allPosts} tags={tags} />
        )}

        <div className="page-note" data-reveal>
          <p className="kicker">$ echo &quot;Want to see more content?&quot;</p>
          <p>
            Follow me on{" "}
            <a href={site.github} target="_blank" rel="noopener noreferrer" className="inline-link">
              <Github size={15} /> GitHub
            </a>{" "}
            or subscribe via{" "}
            <a href="/feed.xml" className="inline-link">
              <Rss size={15} /> RSS
            </a>
          </p>
        </div>
      </section>
    </>
  )
}
