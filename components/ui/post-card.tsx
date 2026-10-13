import { Link } from "next-view-transitions"
import type { PostMeta } from "@/lib/posts"
import { ArrowRight } from "@/components/ui/icons"

interface PostCardProps {
  post: PostMeta
  index: number
  headingLevel?: "h2" | "h3"
}

const formatDate = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

/** Write-up card. The whole card is clickable via the stretched title link. */
export default function PostCard({ post, index, headingLevel: Heading = "h3" }: PostCardProps) {
  return (
    <article className="card post-card" data-fx="tilt">
      <span className="card__brackets" aria-hidden="true" />
      <div className="post-card__meta">
        <span className="post-card__index" aria-hidden="true">
          {String(index + 1).padStart(3, "0")}
        </span>
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span aria-hidden="true">·</span>
        <span>{post.readingTime} min read</span>
      </div>
      <Heading className="post-card__title">
        <Link href={`/blog/${post.slug}`} className="card__link">
          {post.title}
        </Link>
      </Heading>
      {post.excerpt ? <p className="post-card__excerpt">{post.excerpt}</p> : null}
      <div className="post-card__foot">
        {post.tags.length > 0 ? (
          <ul className="chips" aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag} className="chip">
                #{tag}
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <span className="post-card__cta" aria-hidden="true">
          Read <ArrowRight size={15} />
        </span>
      </div>
    </article>
  )
}

export { formatDate }
