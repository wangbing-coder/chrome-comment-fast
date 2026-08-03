import type { AutoCommitLink, AutoCommitSite } from "./autoCommit"
import {
  DEFAULT_LINK_MANAGER_API_BASE,
  LINK_MANAGER_REQUEST_TIMEOUT_MS
} from "./config"

type SitesResponse = { items: AutoCommitSite[]; total: number }
type LinksResponse = {
  items: AutoCommitLink[]
  total: number
  page: number
  pageSize: number
}

export type AddAutoCommitLinkResult = {
  status: "created" | "updated" | "skipped"
  id: string
  url: string
  domain: string
  message?: string
}

export const parseLinkManagerResponse = <T>(
  text: string,
  contentType = ""
): T | null => {
  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    if (contentType.includes("text/html") || /^\s*</.test(text)) {
      throw new Error(
        "Link Manager returned a web page instead of JSON. The backend API route may not be deployed."
      )
    }
    throw new Error("Link Manager returned an invalid API response")
  }
}

export const fetchWithNetworkRetry = async (
  fetcher: () => Promise<Response>,
  sleep: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds))
) => {
  try {
    return await fetcher()
  } catch (error) {
    if (!(error instanceof TypeError)) throw error
    await sleep(500)
    return fetcher()
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const { linkManagerApiBase, autoCommitApiToken } =
    await chrome.storage.sync.get(["linkManagerApiBase", "autoCommitApiToken"])
  const apiBase = (
    linkManagerApiBase?.trim() || DEFAULT_LINK_MANAGER_API_BASE
  ).replace(/\/+$/g, "")
  const token = autoCommitApiToken?.trim()

  if (!token) {
    throw new Error("Configure the Auto Commit API token in Settings")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    LINK_MANAGER_REQUEST_TIMEOUT_MS
  )

  try {
    const response = await fetchWithNetworkRetry(() =>
      fetch(`${apiBase}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...init?.headers
        },
        signal: controller.signal
      })
    )
    const text = await response.text()
    const data = parseLinkManagerResponse<any>(
      text,
      response.headers.get("content-type") || ""
    )

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${response.status}`)
    }

    return data as T
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Link Manager request timed out")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

export const getAutoCommitSites = async () => {
  const data = await request<SitesResponse>("/api/external/auto-commit/sites")
  if (!Array.isArray(data?.items))
    throw new Error("Invalid identities response")
  return data
}

export const getAutoCommitLinks = async (page = 1, pageSize = 20) => {
  const data = await request<LinksResponse>(
    `/api/external/auto-commit/links?page=${page}&pageSize=${pageSize}`
  )
  if (!Array.isArray(data?.items)) throw new Error("Invalid links response")
  return data
}

export const addAutoCommitLink = (url: string, title?: string) =>
  request<AddAutoCommitLinkResult>("/api/external/auto-commit/links", {
    method: "POST",
    body: JSON.stringify({ url, title })
  })
