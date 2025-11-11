import { useCallback, useEffect, useMemo, useState } from "react"
import { DEBUG } from "../config"

type GenerationStatus = "idle" | "loading" | "success" | "error"
type TabType = "home" | "backlinks" | "settings"

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  fontSize: 14,
  color: "#1f2933",
  fontFamily: "system-ui, -apple-system, sans-serif",
  overflow: "hidden"
}

const sidebarStyle: React.CSSProperties = {
  width: "80px",
  backgroundColor: "#f8fafc",
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: 20,
  flexShrink: 0
}

const headerStyle: React.CSSProperties = {
  padding: "16px 24px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

const iconContainerStyle: React.CSSProperties = {
  width: "18px",
  height: "18px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}

const tabButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 8px",
  border: "none",
  backgroundColor: "transparent",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  color: "#64748b",
  transition: "all 0.2s",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  borderLeft: "3px solid transparent"
}

const activeTabButtonStyle: React.CSSProperties = {
  ...tabButtonStyle,
  color: "#4f46e5",
  backgroundColor: "#eef2ff",
  borderLeftColor: "#4f46e5"
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: 24,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  backgroundColor: "#ffffff"
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 500
}

const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none"
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  color: "white",
  padding: "12px 0",
  borderRadius: 6,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer"
}

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#a5b4fc",
  cursor: "not-allowed"
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  color: "#334155",
  padding: "10px 0",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer"
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  borderRadius: 8,
  padding: 14,
  whiteSpace: "pre-line",
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.6
}

const errorStyle: React.CSSProperties = {
  border: "1px solid #fecdd3",
  backgroundColor: "#ffe4e6",
  color: "#be123c",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 12,
  whiteSpace: "pre-line",
  lineHeight: 1.5
}

const successStyle: React.CSSProperties = {
  border: "1px solid #bbf7d0",
  backgroundColor: "#dcfce7",
  color: "#15803d",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 12
}

type DomainInfo = {
  name: string
  domain: string
  fullUrl: string
  description: string
  markdown: string
  htmlLink: string
  addedAt: number
}

type SidePanelProps = {
  onClose?: () => void
}

// Helper functions for extracting page content
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

const SidePanel = ({ onClose }: SidePanelProps = {}) => {
  // Global error handler for debugging (only in debug mode)
  useEffect(() => {
    if (!DEBUG) return
    const errorHandler = (event: ErrorEvent) => {
      console.error("🔴 Global error caught:", event.error, event.message, event.filename, event.lineno)
    }
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])
  
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("anthropic/claude-3-haiku-20240307")
  const [commentLength, setCommentLength] = useState("medium")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState("")
  const [newDomainUrl, setNewDomainUrl] = useState("")
  const [newDomainDesc, setNewDomainDesc] = useState("")
  const [domainLoading, setDomainLoading] = useState(false)
  const [copyStatus, setCopyStatus] = useState<{[key: string]: string}>({})
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showCopyToast, setShowCopyToast] = useState<string>("")
  const [currentDomain, setCurrentDomain] = useState<string>("")
  
  // Backlinks states
  const [capsolverApiKey, setCapsolverApiKey] = useState("")
  const [backlinksDomain, setBacklinksDomain] = useState("")
  const [backlinksLoading, setBacklinksLoading] = useState(false)
  const [backlinksData, setBacklinksData] = useState<any>(null)
  const [backlinksError, setBacklinksError] = useState<string | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkResults, setCheckResults] = useState<{[key: string]: {exists: boolean, canSubmit: boolean}} | null>(null)

  useEffect(() => {
    void (async () => {
      const { aiApiKey, aiModel, commentLength: savedLength, userDomains, capsolverApiKey: savedCapsolverKey } = await chrome.storage.sync.get([
        "aiApiKey",
        "aiModel",
        "commentLength",
        "userDomains",
        "capsolverApiKey"
      ])
      if (aiApiKey) setApiKey(aiApiKey)
      if (aiModel) setModel(aiModel)
      if (savedLength) setCommentLength(savedLength)
      if (userDomains) setDomains(userDomains)
      if (savedCapsolverKey) setCapsolverApiKey(savedCapsolverKey)
    })()
  }, [])

  const isGenerating = status === "loading"

  const buttonLabel = useMemo(() => {
    switch (status) {
      case "loading":
        return "Generating..."
      case "success":
        return "Regenerate"
      default:
        return "Generate Comment"
    }
  }, [status])

  const handleSaveSettings = useCallback(async () => {
    if (!apiKey.trim()) {
      setSaveMessage("Please enter API Key")
      return
    }
    if (!model.trim()) {
      setSaveMessage("Please enter Model")
      return
    }

    await chrome.storage.sync.set({
      aiApiKey: apiKey.trim(),
      aiModel: model.trim(),
      commentLength: commentLength,
      capsolverApiKey: capsolverApiKey.trim()
    })
    setSaveMessage("Settings saved successfully")
    setTimeout(() => setSaveMessage(null), 3000)
  }, [apiKey, model, commentLength, capsolverApiKey])

  // Refresh settings from storage after saving
  const refreshSettings = useCallback(async () => {
    const { aiApiKey, aiModel, commentLength: savedLength } = await chrome.storage.sync.get([
      "aiApiKey",
      "aiModel",
      "commentLength"
    ])
    if (aiApiKey) setApiKey(aiApiKey)
    if (aiModel) setModel(aiModel)
    if (savedLength) setCommentLength(savedLength)
  }, [])

  const handleGenerate = useCallback(async () => {
    // Always read from storage to ensure we have the latest settings
    const { aiApiKey, aiModel, commentLength } = await chrome.storage.sync.get([
      "aiApiKey",
      "aiModel",
      "commentLength"
    ])

    if (!aiApiKey?.trim() || !aiModel?.trim()) {
      setError("Please configure API Key and Model in Settings")
      return
    }

    setStatus("loading")
    setError(null)
    setCurrentDomain("") // Clear previous domain

    try {
      // Get current page URL from window.location
      const currentUrl = window.location.href
      
      // Check if this is a special page that can't have content scripts
      if (currentUrl.startsWith("chrome://") || 
          currentUrl.startsWith("chrome-extension://") || 
          currentUrl.startsWith("edge://") ||
          currentUrl.startsWith("about:") ||
          currentUrl.startsWith("moz-extension://")) {
        throw new Error("Cannot generate comments on this page type. Please navigate to a regular webpage.")
      }

      // Extract domain from current URL
      try {
        const url = new URL(currentUrl)
        setCurrentDomain(url.hostname)
      } catch (urlError) {
        if (DEBUG) console.warn("Could not parse domain from URL:", urlError)
        setCurrentDomain("Unknown")
      }

      // Get page context from content script (we're already in the page context)
      const title = document.title || ""
      const contentSnippet = extractContentSnippet()
      const structure = extractArticleStructure()

      const pageContext = {
        success: true,
        payload: {
          title,
          url: currentUrl,
          contentSnippet,
          structure
        }
      }

      if (!pageContext?.success) {
        throw new Error("Failed to get page context")
      }

      let response
      try {
        response = await chrome.runtime.sendMessage({
          type: "GENERATE_COMMENT",
          payload: pageContext.payload
        })
      } catch (runtimeError) {
        console.error("❌ Background script connection failed:", runtimeError)
        throw new Error(`Could not establish connection. Please refresh the page and try again.`)
      }

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to generate comment")
      }

      setComment(response.comment)
      setStatus("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("❌ Generation failed:", message)
      setError(message)
      setStatus("error")
      setCurrentDomain("") // Clear domain on error
    }
  }, [])

  const handleCopyComment = useCallback(() => {
    if (comment) {
      navigator.clipboard.writeText(comment)
      setCopyStatus(prev => ({ ...prev, comment: "Copied!" }))
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, comment: "" }))
      }, 2000)
    }
  }, [comment])

  const handleCopyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setShowCopyToast("copied")
    setTimeout(() => {
      setShowCopyToast("")
    }, 1500)
  }, [])

  const handleAddDomain = useCallback(async () => {
    if (!newDomainName.trim()) {
      setError("Please enter a name")
      return
    }
    if (!newDomainUrl.trim()) {
      setError("Please enter a domain URL")
      return
    }

    let url = newDomainUrl.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    setDomainLoading(true)
    setError(null)

    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const name = newDomainName.trim()

      if (domains.some((d) => d.domain === domain)) {
        setError("Domain already exists")
        setDomainLoading(false)
        return
      }

      // Fetch description from the website
      const response = await fetch(url)
      const html = await response.text()

      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      const description =
        doc.querySelector('meta[name="description"]')?.getAttribute("content") ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        `Website: ${domain}`

      const markdown = `[${name}](${url})`
      const htmlLink = `<a href="${url}">${name}</a>`

      const domainInfo: DomainInfo = {
        name,
        domain,
        fullUrl: url,
        description,
        markdown,
        htmlLink,
        addedAt: Date.now()
      }

      const updatedDomains = [...domains, domainInfo]
      setDomains(updatedDomains)
      await chrome.storage.sync.set({ userDomains: updatedDomains })

      setNewDomainName("")
      setNewDomainUrl("")
      setNewDomainDesc("")
      setShowAddDomain(false)
      setDomainLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Failed to fetch domain info: ${message}`)
      setDomainLoading(false)
    }
  }, [newDomainName, newDomainUrl, domains])

  const handleRemoveDomain = useCallback(
    async (domain: string) => {
      const updatedDomains = domains.filter((d) => d.domain !== domain)
      setDomains(updatedDomains)
      await chrome.storage.sync.set({ userDomains: updatedDomains })
    },
    [domains]
  )

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newDomains = [...domains]
    const [removed] = newDomains.splice(draggedIndex, 1)
    newDomains.splice(dropIndex, 0, removed)

    setDomains(newDomains)
    setDraggedIndex(null)

    // Save the new order
    chrome.storage.sync.set({ userDomains: newDomains })
  }, [domains, draggedIndex])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  // Backlinks functionality
  const handleFetchBacklinks = useCallback(async () => {
    if (DEBUG) console.log("🔵 handleFetchBacklinks called, backlinksDomain:", backlinksDomain)
    let domainToFetch = backlinksDomain.trim()
    
    // If no domain entered, use current page domain
    if (!domainToFetch) {
      if (DEBUG) console.log("🔵 No domain entered, trying to get current page domain...")
      try {
        // Get current tab info from background script
        const response = await chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB" })
        if (DEBUG) console.log("🔵 Current tab response:", response)
        
        if (response?.success && response.domain) {
          domainToFetch = response.domain
          if (DEBUG) console.log("✅ Extracted domain:", domainToFetch)
          setBacklinksDomain(domainToFetch) // Update the input field
        } else {
          console.error("❌ Failed to get current tab:", response?.error)
          setBacklinksError(response?.error || "Failed to get current page domain")
          return
        }
      } catch (err) {
        console.error("❌ Error getting current domain:", err)
        setBacklinksError(`Error: ${err instanceof Error ? err.message : String(err)}`)
        return
      }
    }
    
    if (DEBUG) console.log("🔵 Domain to fetch:", domainToFetch)

    // Get the latest CapSolver API key from storage
    const { capsolverApiKey: savedCapsolverKey } = await chrome.storage.sync.get(["capsolverApiKey"])

    if (!savedCapsolverKey?.trim()) {
      setBacklinksError("Please configure CapSolver API Key in Settings")
      return
    }

    setBacklinksLoading(true)
    setBacklinksError(null)
    setBacklinksData(null)
    setCheckResults(null) // Clear previous check results

    try {
      // Send message to background script to fetch backlinks
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_BACKLINKS",
        payload: {
          domain: domainToFetch,
          capsolverApiKey: savedCapsolverKey
        }
      })

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to fetch backlinks")
      }

      setBacklinksData(response.data)
      setBacklinksLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setBacklinksError(message)
      setBacklinksLoading(false)
    }
  }, [backlinksDomain])

  // Check which backlinks exist in database
  const handleCheckBacklinks = useCallback(async () => {
    if (!backlinksData) return

    const backlinks = backlinksData[1]?.backlinks || backlinksData[1]?.topBacklinks?.backlinks
    if (!backlinks || backlinks.length === 0) {
      setBacklinksError("No backlinks to check")
      return
    }

    setCheckLoading(true)
    setBacklinksError(null)

    try {
      const urls = backlinks.map((bl: any) => bl.urlFrom)
      
      const response = await fetch("https://link-manager.leobing2023.workers.dev/api/external/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to check backlinks: ${errorText}`)
      }

      const data = await response.json()
      
      // Create a map of URL to check result
      const resultsMap: {[key: string]: {exists: boolean, canSubmit: boolean}} = {}
      data.results.forEach((result: any) => {
        resultsMap[result.url] = {
          exists: result.exists,
          canSubmit: result.canSubmit
        }
      })

      setCheckResults(resultsMap)
      setCheckLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setBacklinksError(message)
      setCheckLoading(false)
    }
  }, [backlinksData])

  return (
    <div style={containerStyle}>
      {showCopyToast && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(59, 130, 246, 0.9)",
          color: "white",
          padding: "10px 16px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(2px)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
          {showCopyToast}
        </div>
      )}
      
      {/* Left Sidebar */}
      <div style={sidebarStyle}>
        <button
          style={activeTab === "home" ? activeTabButtonStyle : tabButtonStyle}
          onClick={() => setActiveTab("home")}>
          <span>Home</span>
        </button>
        <button
          style={activeTab === "backlinks" ? activeTabButtonStyle : tabButtonStyle}
          onClick={() => setActiveTab("backlinks")}>
          <span>Backlinks</span>
        </button>
        <button
          style={activeTab === "settings" ? activeTabButtonStyle : tabButtonStyle}
          onClick={() => setActiveTab("settings")}>
          <span>Settings</span>
        </button>
      </div>

      {/* Right Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937", fontFamily: "system-ui, -apple-system, sans-serif" }}>
              Comment Fast
            </h1>
          </div>
          {onClose && (
            <button
              style={{
                border: "none",
                backgroundColor: "transparent",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 20,
                padding: "4px 8px",
                borderRadius: 4,
                transition: "background-color 0.2s"
              }}
              onClick={onClose}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
              ×
            </button>
          )}
        </div>

        {activeTab === "home" ? (
        <div style={contentStyle}>

          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              style={isGenerating ? disabledButtonStyle : buttonStyle}
              disabled={isGenerating}
              onClick={handleGenerate}>
              {buttonLabel}
            </button>
          </section>

          {error ? <p style={errorStyle}>{error}</p> : null}

          {comment ? (
            <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Generated Comment</span>
                {currentDomain && (
                  <span style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    fontWeight: 400
                  }}>for</span>
                )}
                {currentDomain && (
                  <span style={{
                    fontSize: 11,
                    fontFamily: "monospace",
                    color: "#6b7280",
                    backgroundColor: "#f8fafc",
                    padding: "1px 5px",
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    cursor: "pointer",
                    userSelect: "text"
                  }}
                  onClick={() => handleCopyToClipboard(currentDomain, "Domain")}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                    {currentDomain}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={cardStyle}>{comment}</p>
                <button
                  style={{
                    ...secondaryButtonStyle,
                    backgroundColor: copyStatus.comment ? "#10b981" : "#f1f5f9",
                    color: copyStatus.comment ? "white" : "#334155",
                    borderColor: copyStatus.comment ? "#10b981" : "#cbd5e1",
                    transition: "all 0.3s ease",
                    padding: "6px 12px",
                    fontSize: 11,
                    height: "auto",
                    alignSelf: "flex-start",
                    width: "fit-content"
                  }}
                  onClick={handleCopyComment}>
                  {copyStatus.comment || "Copy to Clipboard"}
                </button>
              </div>
            </section>
          ) : null}

          <section style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>My Domains</span>
              <button
                style={{
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 20,
                  width: 32,
                  height: 32,
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onClick={() => setShowAddDomain(true)}>
                +
              </button>
            </div>

            {domains.length > 1 && (
              <div style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>
                💡 拖拽域名卡片重新排序
              </div>
            )}

            {showAddDomain && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Name (e.g., attractiveness test)"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                />
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Domain (e.g., attractivenessscale.com)"
                  value={newDomainUrl}
                  onChange={(e) => setNewDomainUrl(e.target.value)}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={{ ...buttonStyle, flex: 1 }}
                    disabled={domainLoading}
                    onClick={handleAddDomain}>
                    {domainLoading ? "Adding..." : "Add Domain"}
                  </button>
                  <button
                    style={{ ...secondaryButtonStyle, flex: 1 }}
                    onClick={() => {
                      setShowAddDomain(false)
                      setNewDomainName("")
                      setNewDomainUrl("")
                      setNewDomainDesc("")
                    }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {domains.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {domains.map((d, index) => {
                  const domainKey = `domain-${d.domain}`
                  const descKey = `desc-${d.domain}`
                  const htmlKey = `html-${d.domain}`
                  const mdKey = `md-${d.domain}`

                  return (
                    <div
                      key={d.domain}
                      style={{
                        border: draggedIndex === index ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 16,
                        backgroundColor: "#ffffff",
                        marginBottom: 12,
                        cursor: draggedIndex === null ? "default" : "move",
                        opacity: draggedIndex === index ? 0.8 : 1,
                        transition: "all 0.2s ease"
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 6,
                              cursor: "pointer",
                              padding: "4px 8px",
                              borderRadius: 4,
                              border: "1px solid transparent",
                              transition: "all 0.2s"
                            }}
                            onClick={() => handleCopyToClipboard(d.fullUrl, "Domain")}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f3f4f6"
                              e.currentTarget.style.borderColor = "#d1d5db"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent"
                              e.currentTarget.style.borderColor = "transparent"
                            }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>{d.fullUrl}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Name:</span>
                            <div
                              style={{
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 4,
                                padding: "4px 8px",
                                fontSize: 12,
                                color: "#374151",
                                cursor: "pointer",
                                userSelect: "text",
                                fontFamily: "monospace"
                              }}
                              onClick={() => handleCopyToClipboard(d.name, "Name")}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                              {d.name}
                            </div>
                          </div>
                        </div>
                        <button
                          style={{
                            border: "none",
                            backgroundColor: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: 18,
                            padding: 4,
                            marginLeft: 12,
                            borderRadius: 4,
                            transition: "background-color 0.2s"
                          }}
                          onClick={() => handleRemoveDomain(d.domain)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                          ×
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Description:</span>
                        <div
                          style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 4,
                            padding: 6,
                            fontSize: 11,
                            color: "#374151",
                            lineHeight: 1.4,
                            cursor: "pointer",
                            userSelect: "text"
                          }}
                          onClick={() => handleCopyToClipboard(d.description, "Description")}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                          {d.description}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>HTML Link:</label>
                          <div
                            style={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 4,
                              padding: 6,
                              fontSize: 11,
                              color: "#374151",
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              cursor: "pointer",
                              userSelect: "text",
                              position: "relative"
                            }}
                            onClick={() => handleCopyToClipboard(d.htmlLink, "HTML Link")}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                            <div>
                              {d.htmlLink}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <label style={{ fontSize: 10, color: "#6b7280", fontWeight: 500 }}>Markdown Link:</label>
                          <div
                            style={{
                              backgroundColor: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 4,
                              padding: 6,
                              fontSize: 11,
                              color: "#374151",
                              fontFamily: "monospace",
                              wordBreak: "break-all",
                              cursor: "pointer",
                              userSelect: "text",
                              position: "relative"
                            }}
                            onClick={() => handleCopyToClipboard(d.markdown, "Markdown Link")}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                            <div>
                              {d.markdown}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", margin: "16px 0" }}>
                No domains added yet. Click + to add your first domain.
              </p>
            )}
          </section>

          <footer style={{ marginTop: "auto", paddingTop: 16, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
            AI automatically detects and matches the article's language
          </footer>
        </div>
      ) : activeTab === "backlinks" ? (
        <div style={contentStyle}>
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, fontFamily: "system-ui, -apple-system, sans-serif" }}>Backlinks Checker</h2>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
              Get backlinks data from Ahrefs using CapSolver to bypass verification
            </p>

            <label style={labelStyle}>
              <span>Domain</span>
              <input
                style={inputStyle}
                type="text"
                placeholder="Leave empty to use current page domain"
                value={backlinksDomain}
                onChange={(e) => setBacklinksDomain(e.target.value)}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Enter domain or leave empty to use current page (http://, https://, and trailing slashes will be automatically removed)
              </span>
            </label>

            <button
              style={backlinksLoading ? disabledButtonStyle : buttonStyle}
              disabled={backlinksLoading}
              onClick={handleFetchBacklinks}>
              {backlinksLoading ? "Fetching Backlinks..." : "Get Backlinks"}
            </button>

            {backlinksError && <p style={errorStyle}>{backlinksError}</p>}

            {backlinksData && (() => {
              // Support both data structures: data[1].backlinks or data[1].topBacklinks.backlinks
              const backlinks = backlinksData[1]?.backlinks || backlinksData[1]?.topBacklinks?.backlinks
              
              return (
                <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Backlinks Results</h3>
                  
                  {backlinks && backlinks.length > 0 ? (
                    <>
                    <div style={{ 
                      fontSize: 12, 
                      color: "#059669", 
                      backgroundColor: "#dcfce7",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span>✅ Found {backlinks.length} backlink{backlinks.length > 1 ? 's' : ''}</span>
                      <button
                        style={{
                          ...secondaryButtonStyle,
                          padding: "6px 16px",
                          fontSize: 12,
                          marginLeft: 12,
                          backgroundColor: checkLoading ? "#a5b4fc" : (checkResults ? "#10b981" : "#4f46e5"),
                          color: "white",
                          borderColor: checkLoading ? "#a5b4fc" : (checkResults ? "#10b981" : "#4f46e5"),
                          cursor: checkLoading ? "not-allowed" : "pointer"
                        }}
                        disabled={checkLoading}
                        onClick={handleCheckBacklinks}>
                        {checkLoading ? "Checking..." : (checkResults ? "✓ Checked" : "Check Database")}
                      </button>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {backlinks.map((backlink: any, index: number) => {
                        const checkResult = checkResults?.[backlink.urlFrom]
                        const isNew = checkResult?.canSubmit === true
                        const isExisting = checkResult?.exists === true
                        
                        return (
                          <div
                            key={index}
                            style={{
                              border: `1px solid ${isNew ? "#bbf7d0" : isExisting ? "#fed7aa" : "#e2e8f0"}`,
                              borderRadius: 6,
                              padding: "10px 12px",
                              backgroundColor: isNew ? "#dcfce7" : isExisting ? "#ffedd5" : "#ffffff",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 12,
                              transition: "all 0.2s ease"
                            }}>
                            <a
                              href={backlink.urlFrom}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 13,
                                color: isNew ? "#15803d" : isExisting ? "#9a3412" : "#4f46e5",
                                textDecoration: "none",
                                wordBreak: "break-all",
                                flex: 1,
                                fontWeight: isNew ? 600 : 400
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}>
                              {backlink.urlFrom}
                            </a>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                              {backlink.domainRating !== undefined && (
                                <div style={{ 
                                  fontSize: 12, 
                                  fontWeight: 600,
                                  color: "#059669", 
                                  backgroundColor: "#dcfce7",
                                  padding: "4px 10px",
                                  borderRadius: 4,
                                  minWidth: 40,
                                  textAlign: "center"
                                }}>
                                  DR {backlink.domainRating}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{
                    border: "1px solid #fecdd3",
                    backgroundColor: "#ffe4e6",
                    color: "#be123c",
                    borderRadius: 6,
                    padding: "12px 16px",
                    fontSize: 13
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>No backlinks found</div>
                    <div style={{ fontSize: 12 }}>
                      This domain may not have any backlinks indexed by Ahrefs, or the data structure is unexpected.
                      Check the browser console (F12) for detailed logs.
                    </div>
                    <details style={{ marginTop: 8, fontSize: 11 }}>
                      <summary style={{ cursor: "pointer", fontWeight: 500 }}>View raw response</summary>
                      <pre style={{ 
                        marginTop: 8, 
                        padding: 8, 
                        backgroundColor: "#fff1f2",
                        borderRadius: 4,
                        overflow: "auto",
                        maxHeight: 200
                      }}>
                        {JSON.stringify(backlinksData, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </section>
            )})()}
          </section>
        </div>
      ) : (
        <div style={contentStyle}>
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={labelStyle}>
              <span>API Key</span>
              <input
                style={inputStyle}
                type="password"
                placeholder="sk-or-v1-xxxxxxxx"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                OpenRouter API key from{" "}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
                  openrouter.ai/keys
                </a>
              </span>
            </label>

            <label style={labelStyle}>
              <span>Model</span>
              <input
                style={inputStyle}
                type="text"
                placeholder="anthropic/claude-3-haiku-20240307"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Model identifier (e.g., anthropic/claude-3-haiku-20240307)
              </span>
            </label>

            <label style={labelStyle}>
              <span>Comment Length</span>
              <select
                style={inputStyle}
                value={commentLength}
                onChange={(event) => setCommentLength(event.target.value)}>
                <option value="short">Short (20-30 words)</option>
                <option value="medium">Medium (30-50 words)</option>
                <option value="long">Long (50-100 words)</option>
              </select>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Controls the length of generated comments
              </span>
            </label>

            <label style={labelStyle}>
              <span>CapSolver API Key</span>
              <input
                style={inputStyle}
                type="password"
                placeholder="CAP-XXXXXXXXXXXXXX"
                value={capsolverApiKey}
                onChange={(event) => setCapsolverApiKey(event.target.value)}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                CapSolver API key from{" "}
                <a href="https://www.capsolver.com" target="_blank" rel="noreferrer">
                  capsolver.com
                </a>
                {" "}for backlinks feature
              </span>
            </label>

            <button style={buttonStyle} onClick={handleSaveSettings}>
              Save Settings
            </button>

            {saveMessage ? <p style={saveMessage.includes("success") ? successStyle : errorStyle}>{saveMessage}</p> : null}
          </section>

          <footer style={{ marginTop: "auto", paddingTop: 16 }}>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#f8fafc",
                fontSize: 12,
                color: "#475569",
                lineHeight: 1.5
              }}>
              <strong>Popular Models:</strong>
              <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
                <li>google/gemini-2.0-flash-001</li>
                <li>openai/gpt-4o-mini</li>
              </ul>
            </div>
          </footer>
        </div>
        )}
      </div>
    </div>
  )
}

export default SidePanel

