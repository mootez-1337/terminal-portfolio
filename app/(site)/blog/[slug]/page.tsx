import type { Metadata } from "next"
import { getAdjacentPosts, getPostData, getSortedPostsData } from "@/lib/posts"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"
import rehypeCodeFiles from "@/lib/rehype-code-files"
import { Link } from "next-view-transitions"
import { notFound } from "next/navigation"
import { site } from "@/lib/site"
import GlitchText from "@/components/motion/glitch-text"
import ReadingProgress from "@/components/motion/reading-progress"
import CodeCopy from "@/components/blog/code-copy"
import { formatDate } from "@/components/ui/post-card"
import { ArrowLeft, ArrowRight } from "@/components/ui/icons"
import "@/styles/prose.css"

export async function generateStaticParams() {
  return getSortedPostsData().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPostData(slug)
  if (!post) return { title: "Post not found" }

  const url = `${site.url}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url,
      siteName: site.title,
      publishedTime: post.date,
      authors: [site.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostData(slug)

  if (!post) {
    notFound()
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeCodeFiles)
    .use(rehypeStringify)
    .process(post.content)

  const contentHtml = String(file)
  const { newer, older } = getAdjacentPosts(post.slug)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: site.name, url: site.url },
    mainEntityOfPage: `${site.url}/blog/${post.slug}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReadingProgress targetId="post-body" />

      <article className="post container">
        <header className="post__header">
          <Link href="/blog" className="back-link" data-enter>
            <ArrowLeft size={15} /> All write-ups
          </Link>

          <h1 className="post__title">
            <GlitchText text={post.title} className="glitch--boot glitch--quiet" />
          </h1>

          <dl className="post__meta" data-enter>
            <div>
              <dt>date</dt>
              <dd>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </dd>
            </div>
            <div>
              <dt>read_time</dt>
              <dd>{post.readingTime} min</dd>
            </div>
            <div>
              <dt>author</dt>
              <dd>{site.handle}</dd>
            </div>
            {post.tags.length > 0 ? (
              <div className="post__tags">
                <dt className="sr-only">tags</dt>
                <dd>
                  <ul className="chips">
                    {post.tags.map((tag) => (
                      <li key={tag} className="chip">
                        #{tag}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
        </header>

        <div id="post-body" className="prose" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        <CodeCopy containerId="post-body" />

        <footer className="post__footer">
          <p className="post__eof" aria-hidden="true">
            $ end_of_file
          </p>
          {newer || older ? (
            <nav className="post-nav" aria-label="More write-ups">
              {older ? (
                <Link href={`/blog/${older.slug}`} className="card post-nav__link" data-fx>
                  <span className="post-nav__dir">
                    <ArrowLeft size={14} /> Older
                  </span>
                  <span className="post-nav__title">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer ? (
                <Link href={`/blog/${newer.slug}`} className="card post-nav__link post-nav__link--next" data-fx>
                  <span className="post-nav__dir">
                    Newer <ArrowRight size={14} />
                  </span>
                  <span className="post-nav__title">{newer.title}</span>
                </Link>
              ) : null}
            </nav>
          ) : null}
          <Link href="/blog" className="btn btn--ghost">
            <ArrowLeft size={16} /> Back to all posts
          </Link>
        </footer>
      </article>
    </>
  )
}
