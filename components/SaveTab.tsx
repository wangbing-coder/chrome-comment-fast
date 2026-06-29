import { useCallback, useState } from "react"

import {
  buttonStyle,
  contentStyle,
  disabledButtonStyle,
  errorStyle,
  inputStyle,
  labelStyle
} from "./styles"

export const SaveTab = () => {
  const [saveDomainTarget, setSaveDomainTarget] = useState("")
  const [saveDomainLoading, setSaveDomainLoading] = useState(false)
  const [saveDomainMessage, setSaveDomainMessage] = useState<string | null>(
    null
  )
  const [saveKeywordTarget, setSaveKeywordTarget] = useState("")
  const [saveKeywordLoading, setSaveKeywordLoading] = useState(false)
  const [saveKeywordMessage, setSaveKeywordMessage] = useState<string | null>(
    null
  )

  const successMessageStyle = {
    border: "1px solid #bbf7d0",
    backgroundColor: "#dcfce7",
    color: "#15803d",
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 12
  }

  const handleSaveDomain = useCallback(async () => {
    const typedTarget = saveDomainTarget.trim()
    const target = typedTarget || window.location.href
    const title = typedTarget ? undefined : document.title || undefined

    setSaveDomainLoading(true)
    setSaveDomainMessage(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SAVE_DOMAIN",
        payload: {
          target,
          title
        }
      })

      if (!response?.success) {
        throw new Error(response?.error || "Failed to save domain")
      }

      const statusLabel =
        response.status === "skipped" ? "Already saved" : "Saved"
      setSaveDomainMessage(`${statusLabel}: ${response.domain}`)
      setSaveDomainTarget("")
    } catch (error) {
      setSaveDomainMessage(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setSaveDomainLoading(false)
    }
  }, [saveDomainTarget])

  const handleSaveKeyword = useCallback(async () => {
    const keyword = saveKeywordTarget.replace(/\s+/g, " ").trim()

    if (!keyword) {
      setSaveKeywordMessage("Enter a keyword to save")
      return
    }

    setSaveKeywordLoading(true)
    setSaveKeywordMessage(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: "SAVE_KEYWORD",
        payload: {
          keyword,
          notes: window.location.href
        }
      })

      if (!response?.success) {
        throw new Error(response?.error || "Failed to save keyword")
      }

      const statusLabel =
        response.status === "skipped" ? "Already saved" : "Saved"
      setSaveKeywordMessage(`${statusLabel}: ${response.keyword}`)
      setSaveKeywordTarget("")
    } catch (error) {
      setSaveKeywordMessage(
        error instanceof Error ? error.message : String(error)
      )
    } finally {
      setSaveKeywordLoading(false)
    }
  }, [saveKeywordTarget])

  return (
    <div style={contentStyle}>
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}>
          Save Domain
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Save a domain to Link Manager default group.
        </p>

        <label style={labelStyle}>
          <span>Domain</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="Leave empty to save current page domain"
            value={saveDomainTarget}
            onChange={(e) => setSaveDomainTarget(e.target.value)}
          />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            Enter a domain or URL, or leave empty to save the current page.
          </span>
        </label>

        <button
          style={saveDomainLoading ? disabledButtonStyle : buttonStyle}
          disabled={saveDomainLoading}
          onClick={handleSaveDomain}>
          {saveDomainLoading ? "Saving Domain..." : "Save Domain"}
        </button>

        {saveDomainMessage ? (
          <p
            style={
              saveDomainMessage.startsWith("Saved") ||
              saveDomainMessage.startsWith("Already")
                ? successMessageStyle
                : errorStyle
            }>
            {saveDomainMessage}
          </p>
        ) : null}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}>
          Save Keyword
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          Save a search keyword to Link Manager default group.
        </p>

        <label style={labelStyle}>
          <span>Keyword</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="crossy road"
            value={saveKeywordTarget}
            onChange={(e) => setSaveKeywordTarget(e.target.value)}
          />
        </label>

        <button
          style={saveKeywordLoading ? disabledButtonStyle : buttonStyle}
          disabled={saveKeywordLoading}
          onClick={handleSaveKeyword}>
          {saveKeywordLoading ? "Saving Keyword..." : "Save Keyword"}
        </button>

        {saveKeywordMessage ? (
          <p
            style={
              saveKeywordMessage.startsWith("Saved") ||
              saveKeywordMessage.startsWith("Already")
                ? successMessageStyle
                : errorStyle
            }>
            {saveKeywordMessage}
          </p>
        ) : null}
      </section>
    </div>
  )
}
