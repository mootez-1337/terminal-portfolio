import type { Metadata } from "next"
import { getPostData, getSortedPostsData } from "@/lib/posts"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeHighlight from "rehype-highlight"
import rehypeStringify from "rehype-stringify"
import Link from "next/link"
import { notFound } from "next/navigation"
import { site } from "@/lib/site"

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
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(post.content)

  const contentHtml = String(file)

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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="mb-12 border-b terminal:border-terminal-accent/20 light:border-gray-100 pb-12">
        <Link
          href="/blog"
          className="inline-flex items-center terminal:text-terminal-accent light:text-light-accent hover:underline font-mono text-xs mb-8 uppercase tracking-widest transition-colors"
        >
          [ back to entries ]
        </Link>

        <header className="space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold terminal:text-terminal-text light:text-light-text font-mono leading-tight tracking-tighter">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs font-mono opacity-70 uppercase tracking-wider">
            <div className="flex items-center gap-2 terminal:text-terminal-accent light:text-light-accent">
              <span>$ date:</span>
              <time dateTime={post.date}>{post.date}</time>
            </div>
            <div className="flex items-center gap-2 terminal:text-terminal-text light:text-light-text">
              <span>$ read_time:</span>
              <span>{post.readingTime} min</span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex items-center gap-2 terminal:text-terminal-text light:text-light-text opacity-70">
                {post.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </header>
      </div>

      {/* Content */}
      <article className="prose prose-invert light:prose-slate max-w-none">
        <div
          className="terminal:text-terminal-text light:text-light-text selection:bg-terminal-accent/30"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>

      {/* Footer */}
      <footer className="mt-20 pt-10 border-t terminal:border-terminal-accent/20 light:border-gray-200">
        <div className="flex items-center justify-between font-mono text-sm">
          <Link
            href="/blog"
            className="terminal:text-terminal-accent light:text-light-accent hover:underline px-4 py-2 border border-transparent hover:border-current rounded transition-all"
          >
            ← Back to all posts
          </Link>

          <div className="terminal:text-terminal-text light:text-light-text opacity-40 italic">$ end_of_file</div>
        </div>
      </footer>
    </div>
  )
}
