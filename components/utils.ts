// Helper functions for extracting page content
export const extractContentSnippet = () => {
  const articleElement = document.querySelector("article")
  const target = articleElement ?? document.body

  if (!target) {
    return ""
  }

  const texts: string[] = []
  target.querySelectorAll("p, h1, h2, h3, li").forEach((node) => {
    const text = node.textContent?.trim()
    if (text) {
      texts.push(text)
    }
  })

  const snippet = texts.join(" ").replace(/\s+/g, " ")
  return snippet.slice(0, 2000)
}

export const extractArticleStructure = () => {
  const structure: Record<string, string> = {}

  const h1 = document.querySelector("h1")
  if (h1) structure.mainTitle = h1.textContent?.trim() || ""

  const headings = Array.from(document.querySelectorAll("h2, h3")).slice(0, 5)
  structure.keyPoints = headings.map((h) => h.textContent?.trim() || "").filter(Boolean).join("; ")

  const firstParagraphs = Array.from(document.querySelectorAll("article p, .post-content p, .content p, p"))
    .slice(0, 3)
    .map((p) => p.textContent?.trim())
    .filter(Boolean)
    .join(" ")
    .slice(0, 500)

  structure.introduction = firstParagraphs

  const codeBlocks = document.querySelectorAll("pre, code").length
  structure.hasCode = codeBlocks > 0 ? "yes" : "no"

  return structure
}

