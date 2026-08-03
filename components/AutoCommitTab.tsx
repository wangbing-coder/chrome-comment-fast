import type { CSSProperties, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import type { AutoCommitLink, AutoCommitSite } from "../autoCommit"
import { getAutoCommitLinks, getAutoCommitSites } from "../autoCommitClient"
import { contentStyle } from "./styles"

type Progress = {
  completed: number
  total: number
  url: string
  success: boolean
  error?: string
}

type CurrentPage = {
  url: string
  domain: string
}

type CurrentPageResult = {
  success: boolean
  message: string
}

type AutoCommitTabProps = {
  onOpenSettings: () => void
}

const colors = {
  ink: "#182230",
  muted: "#667085",
  subtle: "#98a2b3",
  border: "#e4e7ec",
  surface: "#f8fafc",
  primary: "#5b4df5",
  primarySoft: "#f0efff",
  success: "#039855",
  successSoft: "#ecfdf3",
  danger: "#d92d20",
  dangerSoft: "#fef3f2"
}

const cardStyle: CSSProperties = {
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
  overflow: "hidden"
}

const Icon = ({
  children,
  size = 16
}: {
  children: ReactNode
  size?: number
}) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round">
    {children}
  </svg>
)

export const AutoCommitTab = ({ onOpenSettings }: AutoCommitTabProps) => {
  const [sites, setSites] = useState<AutoCommitSite[]>([])
  const [links, setLinks] = useState<AutoCommitLink[]>([])
  const [siteId, setSiteId] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState<Progress[]>([])
  const [currentPage, setCurrentPage] = useState<CurrentPage | null>(null)
  const [currentPageRunning, setCurrentPageRunning] = useState(false)
  const [currentPageResult, setCurrentPageResult] =
    useState<CurrentPageResult | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [sitesData, linksData] = await Promise.all([
        getAutoCommitSites(),
        getAutoCommitLinks(page, 20)
      ])
      setSites(sitesData.items)
      setLinks(linksData.items)
      setTotal(linksData.total)
      setSiteId((current) => current || sitesData.items[0]?.id || "")
      setSelectedIds(new Set(linksData.items.map((link) => link.id)))
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : String(loadError)
      )
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void chrome.runtime
      .sendMessage({ type: "GET_CURRENT_TAB" })
      .then((response) => {
        if (response?.success && response.url && response.domain) {
          setCurrentPage({ url: response.url, domain: response.domain })
        }
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const listener = (message: any) => {
      if (message?.type === "COMMENT_PREPARATION_ERROR") {
        setError(message.payload?.error || "Comment preparation failed")
        setRunning(false)
        return
      }
      if (message?.type === "COMMENT_PREPARATION_PROGRESS") {
        setProgress((items) => [...items, message.payload])
        if (message.payload?.completed >= message.payload?.total) {
          setRunning(false)
        }
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [load])

  const selectedLinks = useMemo(
    () => links.filter((link) => selectedIds.has(link.id)),
    [links, selectedIds]
  )
  const selectedSite = sites.find((site) => site.id === siteId)
  const totalPages = Math.max(1, Math.ceil(total / 20))
  const allSelected = links.length > 0 && selectedIds.size === links.length
  const isTokenError = error.toLowerCase().includes("api token")

  const start = async () => {
    if (!selectedSite || selectedLinks.length === 0) return
    setRunning(true)
    setError("")
    setProgress([])
    try {
      const response = await chrome.runtime.sendMessage({
        type: "START_COMMENT_PREPARATION",
        payload: {
          site: selectedSite,
          links: selectedLinks
        }
      })
      if (!response?.success) {
        throw new Error(response?.error || "Comment preparation failed")
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : String(runError))
      setRunning(false)
    }
  }

  const prepareCurrentPage = async () => {
    if (!selectedSite || !currentPage) return
    setCurrentPageRunning(true)
    setCurrentPageResult(null)
    setError("")

    try {
      const response = await chrome.runtime.sendMessage({
        type: "PREPARE_CURRENT_PAGE_AND_ADD",
        payload: { site: selectedSite }
      })
      if (!response?.success) {
        throw new Error(
          response?.prepared
            ? `Form filled, but Links was not updated: ${response?.error || "Link Manager request failed"}`
            : response?.error || "Current page preparation failed"
        )
      }

      const status = response.link?.status
      const message =
        status === "created"
          ? "Filled and added to Links. Review and submit manually."
          : status === "updated"
            ? "Filled and updated the existing domain link. Review and submit manually."
            : response.link?.message ||
              "Filled successfully, but this domain was already submitted."
      setCurrentPageResult({ success: true, message })
      await load()
      if (response.link?.id) {
        setSelectedIds((current) => {
          const next = new Set(current)
          next.delete(response.link.id)
          return next
        })
      }
    } catch (prepareError) {
      setCurrentPageResult({
        success: false,
        message:
          prepareError instanceof Error
            ? prepareError.message
            : String(prepareError)
      })
    } finally {
      setCurrentPageRunning(false)
    }
  }

  return (
    <div
      style={{
        ...contentStyle,
        gap: 16,
        padding: "16px 16px 24px",
        background: "#fbfcfe",
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden"
      }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 21, color: colors.ink }}>
              Prepare Comments
            </h2>
            <span
              style={{
                padding: "3px 7px",
                borderRadius: 999,
                background: colors.primarySoft,
                color: colors.primary,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".04em"
              }}>
              WORDPRESS
            </span>
          </div>
          <p style={{ margin: "5px 0 0", color: colors.muted, fontSize: 12 }}>
            Open article tabs, fill each comment form, then submit manually.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            alignSelf: "flex-start",
            padding: "6px 9px",
            borderRadius: 999,
            color: running ? colors.primary : colors.success,
            background: running ? colors.primarySoft : colors.successSoft,
            fontSize: 11,
            fontWeight: 600
          }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "currentColor"
            }}
          />
          {running ? "Preparing" : "Ready"}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 14, display: "grid", gap: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p
              style={{
                margin: 0,
                color: colors.ink,
                fontSize: 13,
                fontWeight: 650
              }}>
              Step 1 · Select domain
            </p>
            <p style={{ margin: "3px 0 0", color: colors.muted, fontSize: 11 }}>
              Chrome fills its anchor names, URL, and email.
            </p>
          </div>
          <div style={{ color: colors.subtle }}>
            <Icon size={18}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
            </Icon>
          </div>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: colors.muted, fontSize: 11, fontWeight: 600 }}>
            Domain to promote
          </span>
          <select
            style={{
              width: "100%",
              minHeight: 40,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "0 11px",
              background: colors.surface,
              color: colors.ink,
              fontSize: 12,
              outline: "none"
            }}
            value={siteId}
            disabled={running}
            onChange={(event) => setSiteId(event.target.value)}>
            {sites.length === 0 ? (
              <option value="">No domain available</option>
            ) : null}
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.website}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ ...cardStyle, padding: 14, display: "grid", gap: 10 }}>
        <div>
          <p
            style={{
              margin: 0,
              color: colors.ink,
              fontSize: 13,
              fontWeight: 650
            }}>
            Current page
          </p>
          <p
            style={{
              margin: "3px 0 0",
              overflow: "hidden",
              color: colors.muted,
              fontSize: 10,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}>
            {currentPage?.url || "Open the extension on an article page."}
          </p>
        </div>

        <button
          style={{
            minHeight: 38,
            border: `1px solid ${colors.primary}`,
            borderRadius: 8,
            background:
              currentPageRunning || running || !selectedSite || !currentPage
                ? colors.surface
                : colors.primarySoft,
            color:
              currentPageRunning || running || !selectedSite || !currentPage
                ? colors.subtle
                : colors.primary,
            fontSize: 11,
            fontWeight: 700,
            cursor:
              currentPageRunning || running || !selectedSite || !currentPage
                ? "not-allowed"
                : "pointer"
          }}
          disabled={
            currentPageRunning || running || !selectedSite || !currentPage
          }
          onClick={() => void prepareCurrentPage()}>
          {currentPageRunning
            ? "Filling current page..."
            : "Fill & Add to Links"}
        </button>

        {currentPageResult ? (
          <p
            role="status"
            style={{
              margin: 0,
              color: currentPageResult.success ? colors.success : colors.danger,
              fontSize: 10,
              lineHeight: 1.4
            }}>
            {currentPageResult.message}
          </p>
        ) : null}
      </div>

      <div style={cardStyle}>
        <div
          style={{
            padding: "11px 13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${colors.border}`
          }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: colors.ink,
              fontSize: 12,
              fontWeight: 650
            }}>
            <input
              type="checkbox"
              checked={allSelected}
              disabled={running || links.length === 0}
              onChange={(event) =>
                setSelectedIds(
                  event.target.checked
                    ? new Set(links.map((link) => link.id))
                    : new Set()
                )
              }
            />
            Step 2 · Select links
            <span
              style={{
                minWidth: 18,
                padding: "2px 5px",
                borderRadius: 999,
                background: colors.surface,
                color: colors.muted,
                textAlign: "center",
                fontSize: 10
              }}>
              {total}
            </span>
          </label>
          <button
            aria-label="Refresh queue"
            title="Refresh queue"
            style={{
              width: 30,
              height: 30,
              display: "grid",
              placeItems: "center",
              padding: 0,
              border: `1px solid ${colors.border}`,
              borderRadius: 7,
              background: "#fff",
              color: colors.muted,
              cursor: loading || running ? "not-allowed" : "pointer",
              opacity: loading || running ? 0.5 : 1
            }}
            disabled={loading || running}
            onClick={() => void load()}>
            <Icon>
              <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
              <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
            </Icon>
          </button>
        </div>

        <div style={{ maxHeight: 230, overflowY: "auto" }}>
          {loading ? (
            <div
              style={{
                padding: "34px 16px",
                textAlign: "center",
                color: colors.muted
              }}>
              <p style={{ margin: 0, fontSize: 12 }}>Loading queue…</p>
            </div>
          ) : null}
          {!loading && links.length === 0 ? (
            <div style={{ padding: "30px 18px 32px", textAlign: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  margin: "0 auto 10px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 10,
                  background: colors.primarySoft,
                  color: colors.primary
                }}>
                <Icon size={19}>
                  <path d="M9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </Icon>
              </div>
              <p
                style={{
                  margin: 0,
                  color: colors.ink,
                  fontSize: 12,
                  fontWeight: 650
                }}>
                No links ready
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  color: colors.muted,
                  fontSize: 11
                }}>
                Add article links in Link Manager first.
              </p>
            </div>
          ) : null}
          {!loading
            ? links.map((link) => (
                <label
                  key={link.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "18px minmax(0, 1fr) auto",
                    alignItems: "center",
                    gap: 9,
                    padding: "10px 13px",
                    borderBottom: `1px solid ${colors.border}`,
                    cursor: running ? "default" : "pointer"
                  }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(link.id)}
                    disabled={running}
                    onChange={(event) => {
                      setSelectedIds((current) => {
                        const next = new Set(current)
                        if (event.target.checked) next.add(link.id)
                        else next.delete(link.id)
                        return next
                      })
                    }}
                  />
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: colors.ink,
                        fontSize: 12,
                        fontWeight: 550
                      }}>
                      {link.title || link.domain}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: colors.muted,
                        fontSize: 10
                      }}>
                      {link.url}
                    </span>
                  </span>
                  <span
                    style={{
                      padding: "3px 6px",
                      borderRadius: 999,
                      background:
                        link.submitStatus === "failed"
                          ? colors.dangerSoft
                          : colors.surface,
                      color:
                        link.submitStatus === "failed"
                          ? colors.danger
                          : colors.muted,
                      fontSize: 9,
                      fontWeight: 650,
                      textTransform: "capitalize"
                    }}>
                    {link.submitStatus}
                    {link.submitCount > 0 ? ` · ${link.submitCount}` : ""}
                  </span>
                </label>
              ))
            : null}
        </div>

        <div
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: colors.surface,
            borderTop: `1px solid ${colors.border}`
          }}>
          <button
            aria-label="Previous page"
            title="Previous page"
            style={{
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              background: "#fff",
              color: colors.muted,
              cursor: page <= 1 || running ? "not-allowed" : "pointer",
              opacity: page <= 1 || running ? 0.45 : 1,
              padding: 0
            }}
            disabled={page <= 1 || running}
            onClick={() => setPage((value) => value - 1)}>
            <Icon size={15}>
              <path d="m15 18-6-6 6-6" />
            </Icon>
          </button>
          <span style={{ color: colors.muted, fontSize: 11, fontWeight: 500 }}>
            {page} / {totalPages}
          </span>
          <button
            aria-label="Next page"
            title="Next page"
            style={{
              width: 28,
              height: 28,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              background: "#fff",
              color: colors.muted,
              cursor: page >= totalPages || running ? "not-allowed" : "pointer",
              opacity: page >= totalPages || running ? 0.45 : 1,
              padding: 0
            }}
            disabled={page >= totalPages || running}
            onClick={() => setPage((value) => value + 1)}>
            <Icon size={15}>
              <path d="m9 18 6-6-6-6" />
            </Icon>
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            border: `1px solid ${isTokenError ? "#d9d6fe" : "#fecdca"}`,
            borderRadius: 9,
            background: isTokenError ? colors.primarySoft : colors.dangerSoft,
            color: isTokenError ? "#4038a8" : colors.danger
          }}>
          <Icon size={17}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </Icon>
          <span style={{ minWidth: 0, flex: 1, fontSize: 11, lineHeight: 1.4 }}>
            {error}
          </span>
          {isTokenError ? (
            <button
              style={{
                flexShrink: 0,
                padding: "6px 9px",
                border: 0,
                borderRadius: 6,
                background: colors.primary,
                color: "#fff",
                fontSize: 10,
                fontWeight: 650,
                cursor: "pointer"
              }}
              onClick={onOpenSettings}>
              Open settings
            </button>
          ) : null}
        </div>
      ) : null}

      {progress.length > 0 ? (
        <div style={{ ...cardStyle, padding: 12, display: "grid", gap: 6 }}>
          <p
            style={{
              margin: "0 0 3px",
              color: colors.ink,
              fontSize: 12,
              fontWeight: 650
            }}>
            Recent activity
          </p>
          {progress.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: item.success ? colors.success : colors.danger,
                fontSize: 10,
                minWidth: 0
              }}>
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                <Icon size={13}>
                  {item.success ? (
                    <path d="m5 12 4 4L19 6" />
                  ) : (
                    <path d="m7 7 10 10M17 7 7 17" />
                  )}
                </Icon>
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                {item.completed}/{item.total}{" "}
                {item.success ? "Prepared · submit manually" : "Failed"} ·{" "}
                {item.url}
                {item.error ? ` · ${item.error}` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <button
        style={{
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          border: 0,
          borderRadius: 9,
          background:
            running || !selectedSite || selectedLinks.length === 0
              ? "#d0d5dd"
              : colors.primary,
          color: "#fff",
          boxShadow:
            running || !selectedSite || selectedLinks.length === 0
              ? "none"
              : "0 5px 12px rgba(91, 77, 245, 0.22)",
          fontSize: 12,
          fontWeight: 700,
          cursor:
            running || !selectedSite || selectedLinks.length === 0
              ? "not-allowed"
              : "pointer"
        }}
        disabled={running || !selectedSite || selectedLinks.length === 0}
        onClick={() => void start()}>
        <Icon size={16}>
          {running ? (
            <path d="M12 3a9 9 0 1 0 9 9" />
          ) : (
            <path d="m9 18 6-6-6-6" />
          )}
        </Icon>
        {running
          ? `Preparing ${progress.length} of ${selectedLinks.length}`
          : selectedLinks.length > 0
            ? `Open & Fill (${selectedLinks.length})`
            : "Select links to continue"}
      </button>
    </div>
  )
}
