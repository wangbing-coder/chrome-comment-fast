import { useCallback, useState } from "react"
import { contentStyle, buttonStyle, disabledButtonStyle, secondaryButtonStyle, cardStyle, errorStyle, inputStyle } from "./styles"

export type DomainInfo = {
  name: string
  domain: string
  fullUrl: string
  description: string
  markdown: string
  htmlLink: string
  addedAt: number
}

type GenerationStatus = "idle" | "loading" | "success" | "error"

type HomeTabProps = {
  comment: string
  status: GenerationStatus
  error: string | null
  currentDomain: string
  copyStatus: {[key: string]: string}
  domains: DomainInfo[]
  onGenerate: () => void
  onCopyComment: () => void
  onCopyToClipboard: (text: string, type: string) => void
  onDomainsChange: (domains: DomainInfo[]) => void
}

export const HomeTab = ({
  comment,
  status,
  error,
  currentDomain,
  copyStatus,
  domains,
  onGenerate,
  onCopyComment,
  onCopyToClipboard,
  onDomainsChange
}: HomeTabProps) => {
  const [showAddDomain, setShowAddDomain] = useState(false)
  const [newDomainName, setNewDomainName] = useState("")
  const [newDomainUrl, setNewDomainUrl] = useState("")
  const [domainLoading, setDomainLoading] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const isGenerating = status === "loading"

  const buttonLabel = status === "loading" ? "Generating..." : status === "success" ? "Regenerate" : "Generate Comment"

  const handleAddDomain = useCallback(async () => {
    if (!newDomainName.trim()) {
      return
    }
    if (!newDomainUrl.trim()) {
      return
    }

    let url = newDomainUrl.trim()
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }

    setDomainLoading(true)

    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      const name = newDomainName.trim()

      if (domains.some((d) => d.domain === domain)) {
        setDomainLoading(false)
        return
      }

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
      onDomainsChange(updatedDomains)
      await chrome.storage.sync.set({ userDomains: updatedDomains })

      setNewDomainName("")
      setNewDomainUrl("")
      setShowAddDomain(false)
      setDomainLoading(false)
    } catch (err) {
      setDomainLoading(false)
    }
  }, [newDomainName, newDomainUrl, domains, onDomainsChange])

  const handleRemoveDomain = useCallback(
    async (domain: string) => {
      const updatedDomains = domains.filter((d) => d.domain !== domain)
      onDomainsChange(updatedDomains)
      await chrome.storage.sync.set({ userDomains: updatedDomains })
    },
    [domains, onDomainsChange]
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

    onDomainsChange(newDomains)
    setDraggedIndex(null)

    chrome.storage.sync.set({ userDomains: newDomains })
  }, [domains, draggedIndex, onDomainsChange])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
  }, [])

  return (
    <div style={contentStyle}>
      <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          style={isGenerating ? disabledButtonStyle : buttonStyle}
          disabled={isGenerating}
          onClick={onGenerate}>
          {buttonLabel}
        </button>
      </section>

      {error ? <p style={errorStyle}>{error}</p> : null}

      {comment ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Generated Comment</span>
            {currentDomain && (
              <>
                <span style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  fontWeight: 400
                }}>for</span>
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
                onClick={() => onCopyToClipboard(currentDomain, "Domain")}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                  {currentDomain}
                </span>
              </>
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
              onClick={onCopyComment}>
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
                }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {domains.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {domains.map((d, index) => (
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
                      onClick={() => onCopyToClipboard(d.fullUrl, "Domain")}
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
                        onClick={() => onCopyToClipboard(d.name, "Name")}
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
                    onClick={() => onCopyToClipboard(d.description, "Description")}
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
                      onClick={() => onCopyToClipboard(d.htmlLink, "HTML Link")}
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
                      onClick={() => onCopyToClipboard(d.markdown, "Markdown Link")}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}>
                      <div>
                        {d.markdown}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
  )
}

