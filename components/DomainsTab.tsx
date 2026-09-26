import { useCallback, useEffect, useState } from "react"

import { DOMAIN_AGES_BATCH_SIZE } from "../config"
import { getBlockReason } from "../domainBlocklist"
import type { DomainAgeResult } from "../linkManagerClient"
import {
  collectPageLinks,
  groupLinksByDomain,
  type PageDomain
} from "../pageDomains"
import { contentStyle, errorStyle, secondaryButtonStyle } from "./styles"

const VISIBLE_LIMIT = 20

type Row = PageDomain & { age?: DomainAgeResult }

const DAY_MS = 24 * 60 * 60 * 1000

const formatAge = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)
  if (days < 0) return "future"
  if (days < 60) return `${days}d`
  if (days < 730) return `${Math.floor(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

const sortRows = (rows: Row[]) =>
  [...rows].sort((a, b) => {
    const left = a.age?.registeredAt
    const right = b.age?.registeredAt
    if (left && right) return right.localeCompare(left)
    if (left) return -1
    if (right) return 1
    return a.domain.localeCompare(b.domain)
  })

const badgeStyle = (color: string, background: string) => ({
  fontSize: 11,
  fontWeight: 600,
  color,
  backgroundColor: background,
  padding: "2px 8px",
  borderRadius: 4,
  whiteSpace: "nowrap" as const
})

export const DomainsTab = () => {
  const [rows, setRows] = useState<Row[]>([])
  const [linkCount, setLinkCount] = useState(0)
  const [skipped, setSkipped] = useState({ bigSite: 0, spam: 0 })
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  const handleScan = useCallback(async () => {
    setLoading(true)
    setError(null)
    setShowAll(false)

    const links = collectPageLinks(document)
    const allDomains = groupLinksByDomain(links, window.location.href)
    const domains: PageDomain[] = []
    const skippedCounts = { bigSite: 0, spam: 0 }
    for (const item of allDomains) {
      const reason = getBlockReason(item.domain)
      if (reason === "big-site") skippedCounts.bigSite += 1
      else if (reason === "spam") skippedCounts.spam += 1
      else domains.push(item)
    }
    setSkipped(skippedCounts)
    setLinkCount(links.length)
    setRows(domains)
    setProgress({ done: 0, total: domains.length })

    const ages = new Map<string, DomainAgeResult>()
    const failures: string[] = []

    try {
      for (let i = 0; i < domains.length; i += DOMAIN_AGES_BATCH_SIZE) {
        const batch = domains
          .slice(i, i + DOMAIN_AGES_BATCH_SIZE)
          .map((item) => item.domain)
        const response = await chrome.runtime.sendMessage({
          type: "LOOKUP_DOMAIN_AGES",
          payload: { domains: batch }
        })

        if (response?.success) {
          for (const result of response.results as DomainAgeResult[]) {
            ages.set(result.domain, result)
          }
        } else {
          failures.push(response?.error || "Lookup failed")
        }

        setProgress({
          done: Math.min(i + batch.length, domains.length),
          total: domains.length
        })
        setRows(
          sortRows(
            domains.map((item) => ({ ...item, age: ages.get(item.domain) }))
          )
        )
      }

      if (failures.length) setError(Array.from(new Set(failures)).join("; "))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void handleScan()
  }, [handleScan])

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
          Page Domains
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
          List every registrable domain linked on this page (anchors and plain
          text URLs) and sort by registration date, newest first.
        </p>

        {error && <p style={errorStyle}>{error}</p>}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          {rows.length} domain{rows.length === 1 ? "" : "s"} from {linkCount}{" "}
          link{linkCount === 1 ? "" : "s"}
          {skipped.bigSite > 0 ? ` · ${skipped.bigSite} big sites skipped` : ""}
          {skipped.spam > 0 ? ` · ${skipped.spam} spam skipped` : ""}
          {loading
            ? ` · checking ${progress.done}/${progress.total}…`
            : rows.length > VISIBLE_LIMIT && !showAll
              ? ` · showing newest ${VISIBLE_LIMIT}`
              : ""}
        </div>

        {(showAll ? rows : rows.slice(0, VISIBLE_LIMIT)).map((row) => {
          const registeredAt = row.age?.registeredAt
          const isYoung =
            registeredAt &&
            Date.now() - new Date(registeredAt).getTime() < 365 * DAY_MS

          return (
            <div
              key={row.domain}
              style={{
                border: `1px solid ${isYoung ? "#bbf7d0" : "#e2e8f0"}`,
                backgroundColor: isYoung ? "#f0fdf4" : "#ffffff",
                borderRadius: 6,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap"
                }}>
                <a
                  href={row.sampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#4f46e5",
                    textDecoration: "none",
                    wordBreak: "break-all",
                    flex: 1
                  }}>
                  {row.domain}
                </a>
                {row.isCurrent && (
                  <span style={badgeStyle("#475569", "#f1f5f9")}>current</span>
                )}
                {!row.sources.includes("anchor") && (
                  <span style={badgeStyle("#92400e", "#fef3c7")}>text</span>
                )}
                {registeredAt ? (
                  <span
                    style={badgeStyle(
                      isYoung ? "#15803d" : "#1e40af",
                      isYoung ? "#dcfce7" : "#dbeafe"
                    )}
                    title={row.age?.registrar || undefined}>
                    {registeredAt.slice(0, 10)} · {formatAge(registeredAt)}
                  </span>
                ) : row.age ? (
                  <span
                    style={badgeStyle("#be123c", "#ffe4e6")}
                    title={row.age.error}>
                    unknown
                  </span>
                ) : (
                  <span style={badgeStyle("#64748b", "#f8fafc")}>…</span>
                )}
              </div>

              {row.anchors.length > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#334155",
                    wordBreak: "break-word"
                  }}>
                  {row.anchors.map((anchor) => `“${anchor}”`).join(" · ")}
                </div>
              )}
            </div>
          )
        })}

        {rows.length > VISIBLE_LIMIT && (
          <button
            style={secondaryButtonStyle}
            onClick={() => setShowAll((value) => !value)}>
            {showAll
              ? `Show newest ${VISIBLE_LIMIT}`
              : `Show all ${rows.length}`}
          </button>
        )}
      </section>
    </div>
  )
}
