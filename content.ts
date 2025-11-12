import type { PlasmoCSConfig } from "plasmo"
import { createRoot } from "react-dom/client"
import React from "react"
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
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  
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

// Log that content script is loaded
if (DEBUG) console.log("✅ Comment Fast content script loaded on:", window.location.href)

// Ensure message listener is set up immediately
chrome.runtime.onMessage.addListener((message: ContentMessage | { type: "TOGGLE_FLOATING_PANEL" | "PING" }, _sender, sendResponse) => {
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
})

