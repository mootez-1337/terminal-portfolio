/**
 * Turns code blocks that name a file into collapsible blocks:
 *
 *   ```python solver.py        → collapsed, click "solver.py" to show the code
 *   ```python solver.py open   → same, but starts expanded
 *
 * Blocks without a file name render as plain code blocks. Uses native
 * <details>/<summary>, so it works without JS and with the keyboard.
 */

interface Node {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: Node[]
  data?: { meta?: string }
}

const el = (tagName: string, properties: Record<string, unknown>, children: Node[]): Node => ({
  type: "element",
  tagName,
  properties,
  children,
})
const txt = (value: string): Node => ({ type: "text", value })

function textOf(node: Node): string {
  if (node.type === "text") return node.value ?? ""
  return (node.children ?? []).map(textOf).join("")
}

/** `solver.py`, `title="solver.py"` or `title=solver.py`, plus an optional `open` flag. */
function parseMeta(meta: string): { file: string; open: boolean } | null {
  const tokens = meta.trim().split(/\s+/)
  const open = tokens.includes("open")
  const titled = meta.match(/title=(?:"([^"]+)"|'([^']+)'|(\S+))/)
  const file = titled ? (titled[1] ?? titled[2] ?? titled[3]) : tokens.find((t) => t !== "open")
  return file ? { file, open } : null
}

function language(code: Node): string | null {
  const cls = code.properties?.className
  const list = Array.isArray(cls) ? cls.map(String) : []
  const lang = list.find((c) => c.startsWith("language-"))
  return lang ? lang.slice("language-".length) : null
}

function wrap(pre: Node): Node | null {
  const code = pre.children?.find((c) => c.type === "element" && c.tagName === "code")
  const meta = code?.data?.meta
  if (!code || !meta) return null
  const parsed = parseMeta(meta)
  if (!parsed) return null

  const lines = textOf(code).replace(/\n$/, "").split("\n").length
  const lang = language(code)

  const summary = el("summary", { className: ["code-file__bar"] }, [
    el("span", { className: ["code-file__chevron"], ariaHidden: "true" }, [txt("▸")]),
    el("span", { className: ["code-file__name"] }, [txt(parsed.file)]),
    el("span", { className: ["code-file__meta"] }, [
      txt([lang, `${lines} line${lines === 1 ? "" : "s"}`].filter(Boolean).join(" · ")),
    ]),
  ])

  return el("details", { className: ["code-file"], open: parsed.open || undefined }, [summary, pre])
}

function walk(node: Node) {
  const children = node.children
  if (!children) return
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (child.type === "element" && child.tagName === "pre") {
      const wrapped = wrap(child)
      if (wrapped) children[i] = wrapped
    } else {
      walk(child)
    }
  }
}

export default function rehypeCodeFiles() {
  return (tree: Node) => walk(tree)
}
