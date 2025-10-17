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

const SidePanel = () => {
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("anthropic/claude-3-haiku-20240307")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState("English")
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const { aiApiKey, aiModel } = await chrome.storage.sync.get(["aiApiKey", "aiModel"])
      if (aiApiKey) setApiKey(aiApiKey)
      if (aiModel) setModel(aiModel)
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

    await chrome.storage.sync.set({ aiApiKey: apiKey.trim(), aiModel: model.trim() })
    setSaveMessage("Settings saved successfully")
    setTimeout(() => setSaveMessage(null), 3000)
  }, [apiKey, model])

  const handleGenerate = useCallback(async () => {
    if (!apiKey.trim() || !model.trim()) {
      setError("Please configure API Key and Model in Settings")
      return
    }

    setStatus("loading")
    setError(null)

    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })

      if (!tab?.id) {
        throw new Error("Unable to find active tab")
      }

      const pageContext = await chrome.tabs.sendMessage(tab.id, {
        type: "GET_PAGE_CONTEXT"
      })

      if (!pageContext?.success) {
        throw new Error(pageContext?.error ?? "Failed to get page context")
      }

      const response = await chrome.runtime.sendMessage({
        type: "GENERATE_COMMENT",
        payload: {
          ...pageContext.payload,
          language
        }
      })

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to generate comment")
      }

      setComment(response.comment)
      setStatus("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setStatus("error")
    }
  }, [apiKey, model, language])

  const handleCopyComment = useCallback(() => {
    if (comment) {
      navigator.clipboard.writeText(comment)
    }
  }, [comment])

  return (
    <div style={containerStyle}>
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
            <label style={labelStyle}>
              <span>Comment Language</span>
              <select
                style={inputStyle}
                value={language}
                onChange={(event) => setLanguage(event.target.value)}>
                <option value="English">English</option>
                <option value="简体中文">简体中文</option>
                <option value="繁體中文">繁體中文</option>
                <option value="日本語">日本語</option>
                <option value="한국어">한국어</option>
              </select>
            </label>

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
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Generated Comment</span>
              <p style={cardStyle}>{comment}</p>
              <button style={secondaryButtonStyle} onClick={handleCopyComment}>
                Copy to Clipboard
              </button>
            </section>
          ) : null}

          <footer style={{ marginTop: "auto", paddingTop: 16, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
            Ensure the current page allows content script injection
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
                <li>anthropic/claude-3-haiku-20240307</li>
                <li>anthropic/claude-3-sonnet-20240229</li>
                <li>openai/gpt-4o-mini</li>
                <li>openai/gpt-4o</li>
              </ul>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}

export default SidePanel

