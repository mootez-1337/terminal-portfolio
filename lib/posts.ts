import fs from "fs"
import path from "path"
import matter from "gray-matter"

const postsDirectory = path.join(process.cwd(), "content/blog")

export interface PostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  excerpt: string
  readingTime: number
}

export interface Post extends PostMeta {
  content: string
}

/** Frontmatter titles were sometimes written with a leading "# ". */
function cleanTitle(title: unknown, fallback: string) {
  if (typeof title !== "string") return fallback
  return title.replace(/^#\s*/, "").trim() || fallback
}

/** First real paragraph of the body, stripped of markdown, for meta/OG descriptions. */
function buildExcerpt(content: string, limit = 180) {
  const text = content
    .replace(/^---[\s\S]*?---/, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  if (text.length <= limit) return text
  return text.slice(0, text.lastIndexOf(" ", limit)).trimEnd() + "…"
}

function countWords(content: string) {
  return content.trim().split(/\s+/).filter(Boolean).length
}

function toMeta(slug: string, data: Record<string, unknown>, content: string): PostMeta {
  return {
    slug,
    title: cleanTitle(data.title, slug),
    date: typeof data.date === "string" ? data.date : "",
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    excerpt: typeof data.excerpt === "string" ? data.excerpt : buildExcerpt(content),
    readingTime: Math.max(1, Math.ceil(countWords(content) / 200)),
  }
}

export function getSortedPostsData(): PostMeta[] {
  try {
    return fs
      .readdirSync(postsDirectory)
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, "")
        const fileContents = fs.readFileSync(path.join(postsDirectory, fileName), "utf8")
        const { data, content } = matter(fileContents)
        return toMeta(slug, data, content)
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  } catch (error) {
    console.error("Error reading posts:", error)
    return []
  }
}

export function getPostData(slug: string): Post | null {
  try {
    const fileContents = fs.readFileSync(path.join(postsDirectory, `${slug}.md`), "utf8")
    const { data, content } = matter(fileContents)
    return { ...toMeta(slug, data, content), content }
  } catch (error) {
    console.error("Error reading post:", error)
    return null
  }
}

export function getAllTags(): string[] {
  const tags = new Set<string>()
  for (const post of getSortedPostsData()) {
    for (const tag of post.tags) tags.add(tag)
  }
  return [...tags].sort()
}
