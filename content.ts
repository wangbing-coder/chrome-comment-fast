import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

type GetPageContextRequest = {
  type: "GET_PAGE_CONTEXT"
}

type ContentMessage = GetPageContextRequest

const extractContentSnippet = () => {
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

const extractArticleStructure = () => {
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

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message?.type !== "GET_PAGE_CONTEXT") {
    return
  }

  try {
    const title = document.title || ""
    const url = window.location.href
    const contentSnippet = extractContentSnippet()
    const structure = extractArticleStructure()

    const response = {
      success: true,
      payload: {
        title,
        url,
        contentSnippet,
        structure
      }
    }

    sendResponse(response)
  } catch (error) {
    console.error("❌ Error in content script:", error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
})

