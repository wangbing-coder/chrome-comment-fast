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
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers
      },
      signal: controller.signal
    })
    const text = await response.text()
    const data = text ? JSON.parse(text) : null

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
