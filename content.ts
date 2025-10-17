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

  return snippet.slice(0, 1000)
}

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message?.type !== "GET_PAGE_CONTEXT") {
    return
  }

  const title = document.title || ""
  const url = window.location.href
  const contentSnippet = extractContentSnippet()

  sendResponse({
    success: true,
    payload: {
      title,
      url,
      contentSnippet
    }
  })
})

