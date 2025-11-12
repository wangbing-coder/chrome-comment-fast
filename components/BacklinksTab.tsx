import { useCallback, useState } from "react"
import { DEBUG } from "../config"
import { contentStyle, labelStyle, inputStyle, buttonStyle, disabledButtonStyle, secondaryButtonStyle, errorStyle } from "./styles"

type BacklinksTabProps = {
  backlinksDomain: string
  backlinksLoading: boolean
  backlinksError: string | null
  backlinksData: any
  checkLoading: boolean
  checkResults: {[key: string]: {exists: boolean, canSubmit: boolean}} | null
  savingUrls: Set<string>
  savedUrls: Set<string>
  onDomainChange: (domain: string) => void
  onFetchBacklinks: () => void
  onCheckBacklinks: () => void
  onSaveBacklink: (backlink: any) => void
}

export const BacklinksTab = ({
  backlinksDomain,
  backlinksLoading,
  backlinksError,
  backlinksData,
  checkLoading,
  checkResults,
  savingUrls,
  savedUrls,
  onDomainChange,
  onFetchBacklinks,
  onCheckBacklinks,
  onSaveBacklink
}: BacklinksTabProps) => {
  const backlinks = backlinksData?.[1]?.backlinks || backlinksData?.[1]?.topBacklinks?.backlinks

  return (
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
            onChange={(e) => onDomainChange(e.target.value)}
          />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            Enter domain or leave empty to use current page (http://, https://, and trailing slashes will be automatically removed)
          </span>
        </label>

        <button
          style={backlinksLoading ? disabledButtonStyle : buttonStyle}
          disabled={backlinksLoading}
          onClick={onFetchBacklinks}>
          {backlinksLoading ? "Fetching Backlinks..." : "Get Backlinks"}
        </button>

        {backlinksError && <p style={errorStyle}>{backlinksError}</p>}

        {backlinksData && (
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
                      backgroundColor: checkLoading ? "#a5b4fc" : (checkResults ? "#10b981" : "#4f46e5"),
                      color: "white",
                      borderColor: checkLoading ? "#a5b4fc" : (checkResults ? "#10b981" : "#4f46e5"),
                      cursor: checkLoading ? "not-allowed" : "pointer"
                    }}
                    disabled={checkLoading}
                    onClick={onCheckBacklinks}>
                    {checkLoading ? "Checking..." : (checkResults ? "✓ Checked" : "Check")}
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
                          {checkResult && isNew && !savedUrls.has(backlink.urlFrom) && (
                            <button
                              style={{
                                ...secondaryButtonStyle,
                                padding: "4px 12px",
                                fontSize: 11,
                                backgroundColor: savingUrls.has(backlink.urlFrom) ? "#a5b4fc" : "#10b981",
                                color: "white",
                                borderColor: savingUrls.has(backlink.urlFrom) ? "#a5b4fc" : "#10b981",
                                cursor: savingUrls.has(backlink.urlFrom) ? "not-allowed" : "pointer",
                                minWidth: 60
                              }}
                              disabled={savingUrls.has(backlink.urlFrom)}
                              onClick={() => onSaveBacklink(backlink)}>
                              {savingUrls.has(backlink.urlFrom) ? "..." : "Save"}
                            </button>
                          )}
                          {savedUrls.has(backlink.urlFrom) && (
                            <div style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#059669",
                              backgroundColor: "#dcfce7",
                              padding: "4px 12px",
                              borderRadius: 4
                            }}>
                              Saved
                            </div>
                          )}
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
        )}
      </section>
    </div>
  )
}

