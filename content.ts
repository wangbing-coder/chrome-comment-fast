import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import { createRoot } from "react-dom/client"

import SidePanel from "./components/CommentPanel"
import { DEBUG } from "./config"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

const PANEL_ID = "comment-fast-floating-panel"

const removePanel = () => {
  const panel = document.getElementById(PANEL_ID)

  if (panel) {
    const root = (panel as any)._reactRoot
    if (root) {
      root.unmount()
    }
    panel.remove()
  }
}

const createFloatingPanel = async () => {
  // Check if panel already exists
  if (document.getElementById(PANEL_ID)) {
    removePanel()
    return
  }

  // Create Shadow DOM host container for complete style isolation
  const shadowHost = document.createElement("div")
  shadowHost.id = PANEL_ID
  // Shadow DOM will handle style isolation, so we only set essential positioning styles
  shadowHost.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 480px;
    height: 100vh;
    z-index: 2147483647;
    pointer-events: auto;
  `

  // Create Shadow DOM root for style isolation
  const shadowRoot = shadowHost.attachShadow({ mode: "open" })

  // Create style element with CSS reset and base styles for complete isolation
  const style = document.createElement("style")
  style.textContent = `
    /* CSS reset to prevent page styles from affecting the plugin */
    :host {
      all: initial;
      display: block;
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      z-index: 2147483647;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1f2933;
      background: white;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      direction: ltr;
      text-align: left;
    }
    
    #root {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: row;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 14px;
      color: #1f2933;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }
  `
  shadowRoot.appendChild(style)

  // Create React root container inside Shadow DOM
  const container = document.createElement("div")
  container.id = "root"
  shadowRoot.appendChild(container)

  document.body.appendChild(shadowHost)

  // Render React component
  try {
    const root = createRoot(container)
    ;(shadowHost as any)._reactRoot = root
    root.render(React.createElement(SidePanel, { onClose: removePanel }))
  } catch (error) {
    console.error("Failed to render React component:", error)
    container.innerHTML = `
      <div style="padding: 20px; color: red;">
        Failed to load panel. Please refresh the page.
      </div>
    `
  }
}

type GetPageContextRequest = {
  type: "GET_PAGE_CONTEXT"
}

type ContentMessage = GetPageContextRequest

const SEARCH_DOMAIN_BUTTON_CLASS = "comment-fast-save-domain-button"
const SEARCH_RESULT_CONTAINER_CLASS = "comment-fast-search-result-container"
const SEARCH_KEYWORD_BUTTON_CLASS = "comment-fast-save-keyword-button"

const isGoogleSearchPage = () => {
  return (
    /(^|\.)google\./i.test(window.location.hostname) &&
    window.location.pathname === "/search"
  )
}

const isSavableUrl = (href: string) => {
  try {
    const url = new URL(href)
    if (url.protocol !== "http:" && url.protocol !== "https:") return false
    if (/(^|\.)google\./i.test(url.hostname)) return false
    return true
  } catch {
    return false
  }
}

const findSearchResultContainer = (anchor: HTMLAnchorElement) => {
  const googleResult = anchor.closest<HTMLElement>("div.MjjYud, div.g")
  if (googleResult) return googleResult

  let node: HTMLElement | null = anchor
  let candidate: HTMLElement | null = null

  for (let index = 0; index < 10 && node; index += 1) {
    if (node.querySelector("h3") && node.querySelector("cite")) {
      candidate = node
    }
    node = node.parentElement
  }

  return candidate || anchor.parentElement
}

const saveDomainFromSearchResult = async (
  button: HTMLButtonElement,
  target: string,
  title?: string
) => {
  const previousText = button.textContent || "D+"
  button.disabled = true
  button.textContent = "..."
  button.dataset.state = "saving"

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_DOMAIN",
      payload: {
        target,
        title
      }
    })

    if (!response?.success) {
      throw new Error(response?.error || "Failed")
    }

    button.textContent = "✓"
    button.dataset.state = "saved"
    button.title =
      response.status === "skipped"
        ? "Domain already saved"
        : "Saved to Link Manager"
  } catch (error) {
    button.textContent = "!"
    button.dataset.state = "error"
    button.title = error instanceof Error ? error.message : String(error)

    window.setTimeout(() => {
      button.disabled = false
      button.textContent = previousText
      button.dataset.state = "idle"
    }, 2200)
  }
}

const buildSearchResultButton = (anchor: HTMLAnchorElement) => {
  const button = document.createElement("button")
  button.type = "button"
  button.className = SEARCH_DOMAIN_BUTTON_CLASS
  button.textContent = "D+"
  button.title = "Save domain to Link Manager"
  button.setAttribute("aria-label", "Save domain to Link Manager")
  button.dataset.state = "idle"

  button.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    void saveDomainFromSearchResult(
      button,
      anchor.href,
      anchor.querySelector("h3")?.textContent?.trim() || undefined
    )
  })

  return button
}

const getGoogleSearchKeyword = () => {
  const fromUrl = new URLSearchParams(window.location.search).get("q")
  const fromInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    'input[name="q"], textarea[name="q"]'
  )?.value

  return (fromUrl || fromInput || "").replace(/\s+/g, " ").trim()
}

const saveKeywordFromSearchPage = async (button: HTMLButtonElement) => {
  const previousText = button.textContent || "K+"
  const keyword = getGoogleSearchKeyword()

  if (!keyword) {
    button.textContent = "!"
    button.dataset.state = "error"
    button.title = "No search keyword found"
    window.setTimeout(() => {
      button.textContent = previousText
      button.dataset.state = "idle"
    }, 2200)
    return
  }

  button.disabled = true
  button.textContent = "..."
  button.dataset.state = "saving"

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_KEYWORD",
      payload: {
        keyword,
        notes: window.location.href
      }
    })

    if (!response?.success) {
      throw new Error(response?.error || "Failed")
    }

    button.textContent = "✓"
    button.dataset.state = "saved"
    button.title =
      response.status === "skipped"
        ? "Keyword already saved"
        : "Saved keyword to Link Manager"
  } catch (error) {
    button.textContent = "!"
    button.dataset.state = "error"
    button.title = error instanceof Error ? error.message : String(error)

    window.setTimeout(() => {
      button.disabled = false
      button.textContent = previousText
      button.dataset.state = "idle"
    }, 2200)
  }
}

const injectSearchKeywordButton = () => {
  if (!isGoogleSearchPage()) return
  if (document.querySelector(`.${SEARCH_KEYWORD_BUTTON_CLASS}`)) return

  const input = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    'input[name="q"], textarea[name="q"]'
  )
  const form = input?.closest<HTMLElement>('form[role="search"], form')
  if (!form) return

  form.style.position = form.style.position || "relative"

  const button = document.createElement("button")
  button.type = "button"
  button.className = SEARCH_KEYWORD_BUTTON_CLASS
  button.textContent = "K+"
  button.title = "Save search keyword to Link Manager"
  button.setAttribute("aria-label", "Save search keyword to Link Manager")
  button.dataset.state = "idle"
  button.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    void saveKeywordFromSearchPage(button)
  })

  form.appendChild(button)
}

const injectSearchResultDomainButtons = () => {
  if (!isGoogleSearchPage()) return

  const anchors = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("a[href]")
  ).filter((anchor) => anchor.querySelector("h3") && isSavableUrl(anchor.href))

  for (const anchor of anchors) {
    if (anchor.dataset.commentFastDomainButton === "1") continue

    const container = findSearchResultContainer(anchor)
    if (!container) continue

    anchor.dataset.commentFastDomainButton = "1"
    const button = buildSearchResultButton(anchor)
    container.classList.add(SEARCH_RESULT_CONTAINER_CLASS)
    container.appendChild(button)
  }
}

const installSearchResultDomainButtons = () => {
  if (!isGoogleSearchPage()) return

  const styleId = "comment-fast-search-domain-style"
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      .${SEARCH_RESULT_CONTAINER_CLASS} {
        position: relative !important;
      }
      .${SEARCH_DOMAIN_BUTTON_CLASS} {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 22px;
        min-width: 30px;
        border: 1px solid #dadce0;
        background: #fff;
        color: #5f6368;
        border-radius: 999px;
        padding: 0;
        margin: 0;
        font: 600 11px/1 Arial, sans-serif;
        cursor: pointer;
        position: absolute;
        top: 18px;
        right: -38px;
        z-index: 2;
        opacity: 0.46;
        box-sizing: border-box;
        box-shadow: none;
        text-decoration: none;
      }
      .${SEARCH_RESULT_CONTAINER_CLASS}:hover .${SEARCH_DOMAIN_BUTTON_CLASS},
      .${SEARCH_DOMAIN_BUTTON_CLASS}:hover {
        border-color: #9aa0a6;
        background: #f8fafd;
        color: #202124;
        opacity: 1;
      }
      .${SEARCH_DOMAIN_BUTTON_CLASS}[data-state="saving"] {
        cursor: wait;
        opacity: 0.72;
        font-size: 12px;
      }
      .${SEARCH_DOMAIN_BUTTON_CLASS}[data-state="saved"] {
        border-color: #34a853;
        background: #e6f4ea;
        color: #188038;
        cursor: default;
      }
      .${SEARCH_DOMAIN_BUTTON_CLASS}[data-state="error"] {
        border-color: #d93025;
        background: #fce8e6;
        color: #d93025;
      }
      .${SEARCH_KEYWORD_BUTTON_CLASS} {
        appearance: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px;
        min-width: 30px;
        border: 1px solid #dadce0;
        background: #fff;
        color: #5f6368;
        border-radius: 999px;
        padding: 0 7px;
        margin: 0;
        font: 600 11px/1 Arial, sans-serif;
        cursor: pointer;
        position: absolute;
        top: 50%;
        right: -42px;
        transform: translateY(-50%);
        z-index: 2;
        opacity: 0.6;
        box-sizing: border-box;
        box-shadow: none;
      }
      .${SEARCH_KEYWORD_BUTTON_CLASS}:hover {
        border-color: #9aa0a6;
        background: #f8fafd;
        color: #202124;
        opacity: 1;
      }
      .${SEARCH_KEYWORD_BUTTON_CLASS}[data-state="saving"] {
        cursor: wait;
        opacity: 0.72;
      }
      .${SEARCH_KEYWORD_BUTTON_CLASS}[data-state="saved"] {
        border-color: #34a853;
        background: #e6f4ea;
        color: #188038;
        cursor: default;
      }
      .${SEARCH_KEYWORD_BUTTON_CLASS}[data-state="error"] {
        border-color: #d93025;
        background: #fce8e6;
        color: #d93025;
      }
    `
    document.documentElement.appendChild(style)
  }

  injectSearchResultDomainButtons()
  injectSearchKeywordButton()

  const observer = new MutationObserver(() => {
    window.setTimeout(() => {
      injectSearchResultDomainButtons()
      injectSearchKeywordButton()
    }, 100)
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

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
  structure.keyPoints = headings
    .map((h) => h.textContent?.trim() || "")
    .filter(Boolean)
    .join("; ")

  const firstParagraphs = Array.from(
    document.querySelectorAll("article p, .post-content p, .content p, p")
  )
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

// Log that content script is loaded
if (DEBUG)
  console.log("✅ Comment Fast content script loaded on:", window.location.href)

installSearchResultDomainButtons()

// Ensure message listener is set up immediately
chrome.runtime.onMessage.addListener(
  (
    message: ContentMessage | { type: "TOGGLE_FLOATING_PANEL" | "PING" },
    _sender,
    sendResponse
  ) => {
    // Handle ping message (used to check if content script is loaded)
    if (message?.type === "PING") {
      sendResponse({ success: true, loaded: true })
      return true
    }

    // Handle toggle panel message
    if (message?.type === "TOGGLE_FLOATING_PANEL") {
      try {
        createFloatingPanel()
        sendResponse({ success: true })
      } catch (error) {
        console.error("❌ Error creating floating panel:", error)
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
      return true
    }

    // Handle get page context message
    if (message?.type === "GET_PAGE_CONTEXT") {
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

      // Return true to indicate we will send a response asynchronously
      return true
    }

    // Unknown message type
    return false
  }
)
