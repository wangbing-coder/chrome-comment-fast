import { useCallback, useEffect, useMemo, useState } from "react"

type GenerationStatus = "idle" | "loading" | "success" | "error"
type TabType = "home" | "settings"

const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  fontSize: 14,
  color: "#1f2933",
  fontFamily: "system-ui, -apple-system, sans-serif"
}

const tabBarStyle: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff"
}

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px 0",
  border: "none",
  backgroundColor: "transparent",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  color: "#64748b",
  transition: "color 0.2s"
}

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: "#4f46e5",
  borderBottom: "2px solid #4f46e5"
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: 20,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 16
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
  fontSize: 12
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

const SidePanel = () => {
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

  useEffect(() => {
    void (async () => {
      const { aiApiKey, aiModel, commentLength: savedLength, userDomains } = await chrome.storage.sync.get([
        "aiApiKey",
        "aiModel",
        "commentLength",
        "userDomains"
      ])
      if (aiApiKey) setApiKey(aiApiKey)
      if (aiModel) setModel(aiModel)
      if (savedLength) setCommentLength(savedLength)
      if (userDomains) setDomains(userDomains)
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
      commentLength: commentLength
    })
    setSaveMessage("Settings saved successfully")
    setTimeout(() => setSaveMessage(null), 3000)
  }, [apiKey, model, commentLength])

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
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })

      if (!tab?.id) {
        throw new Error("Unable to find active tab")
      }

      // Extract domain from current tab URL
      if (tab.url) {
        try {
          const url = new URL(tab.url)
          setCurrentDomain(url.hostname)
        } catch (urlError) {
          console.warn("Could not parse domain from URL:", urlError)
          setCurrentDomain("Unknown")
        }
      }

      let pageContext
      try {
        pageContext = await chrome.tabs.sendMessage(tab.id, {
          type: "GET_PAGE_CONTEXT"
        })
      } catch (messageError) {
        console.error("❌ Content script connection failed:", messageError)
        throw new Error(`Could not establish connection. Receiving end does not exist. Please refresh the page and try again.`)
      }

      if (!pageContext?.success) {
        throw new Error(pageContext?.error ?? "Failed to get page context")
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
      <div style={tabBarStyle}>
        <button
          style={activeTab === "home" ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab("home")}>
          Home
        </button>
        <button
          style={activeTab === "settings" ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </div>

      {activeTab === "home" ? (
        <div style={contentStyle}>
          <header style={{ marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Comment Fast</h1>
            <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#64748b" }}>
              Generate high-quality comments for blog posts
            </p>
          </header>

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
      ) : (
        <div style={contentStyle}>
          <header style={{ marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Settings</h2>
            <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#64748b" }}>
              Configure your AI model and API credentials
            </p>
          </header>

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
  )
}

export default SidePanel

