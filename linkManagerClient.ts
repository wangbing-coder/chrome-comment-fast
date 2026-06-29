import {
  DEFAULT_LINK_MANAGER_API_BASE,
  LINK_MANAGER_REQUEST_TIMEOUT_MS
} from "./config"

type CheckResult = {
  url: string
  domain: string
  exists: boolean
  canSubmit: boolean
}

type LinkInput = {
  url: string
  title?: string
  description?: string
  dr?: number
  tags?: string[]
  notes?: string
}

type SaveResult = {
  url: string
  domain: string
  id?: string
  status: "created" | "skipped" | "error"
  message?: string
}

type SaveDomainResult = {
  target: string
  domain: string
  id?: string
  status: "created" | "skipped" | "error"
  message?: string
}

type SaveKeywordResult = {
  target: string
  keyword: string
  id?: string
  status: "created" | "skipped" | "error"
  message?: string
}

export type CheckLinksResponse = {
  total: number
  exists: number
  notExists: number
  results: CheckResult[]
  summary: {
    existingDomains: string[]
    newDomains: string[]
  }
}

export type SaveLinksResponse = {
  success: boolean
  saved: number
  skipped: number
  results: SaveResult[]
}

export type SaveDomainsResponse = {
  success: boolean
  saved: number
  skipped: number
  enrichment: {
    success: boolean
    checked: number
    updated: number
    failed: number
  } | null
  results: SaveDomainResult[]
}

export type SaveKeywordsResponse = {
  success: boolean
  saved: number
  skipped: number
  results: SaveKeywordResult[]
}

const normalizeApiBase = (apiBase?: string): string => {
  const value = apiBase?.trim() || DEFAULT_LINK_MANAGER_API_BASE
  return value.replace(/\/+$/g, "")
}

const getLinkManagerApiBase = async (): Promise<string> => {
  const { linkManagerApiBase } = await chrome.storage.sync.get([
    "linkManagerApiBase"
  ])

  return normalizeApiBase(linkManagerApiBase)
}

const parseJson = (text: string): any => {
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const fetchJson = async <T>(path: string, payload: unknown): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    LINK_MANAGER_REQUEST_TIMEOUT_MS
  )

  try {
    const apiBase = await getLinkManagerApiBase()
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    const text = await response.text()
    const data = parseJson(text)

    if (!response.ok) {
      const message =
        data?.error || data?.message || text || `HTTP ${response.status}`
      throw new Error(message)
    }

    if (!data) {
      throw new Error("Link Manager returned an invalid JSON response")
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

export const checkLinks = async (
  urls: string[]
): Promise<CheckLinksResponse> => {
  const data = await fetchJson<CheckLinksResponse>("/api/external/check", {
    urls
  })

  if (!Array.isArray(data?.results)) {
    throw new Error("Unexpected Link Manager check response")
  }

  return data
}

export const saveLinks = async (
  links: LinkInput[]
): Promise<SaveLinksResponse> => {
  const data = await fetchJson<SaveLinksResponse>("/api/external/save", {
    links
  })

  if (!Array.isArray(data?.results)) {
    throw new Error("Unexpected Link Manager save response")
  }

  return data
}

export const saveDomain = async (
  target: string,
  title?: string
): Promise<SaveDomainsResponse> => {
  const data = await fetchJson<SaveDomainsResponse>("/api/domains/save", {
    target,
    title,
    domainGroup: "default",
    tags: ["chrome"]
  })

  if (!Array.isArray(data?.results)) {
    throw new Error("Unexpected Link Manager domain save response")
  }

  return data
}

export const saveKeyword = async (
  keyword: string,
  notes?: string
): Promise<SaveKeywordsResponse> => {
  const data = await fetchJson<SaveKeywordsResponse>("/api/keywords/save", {
    keyword,
    notes,
    keywordGroup: "default",
    source: "google-search",
    tags: ["chrome", "google-search"]
  })

  if (!Array.isArray(data?.results)) {
    throw new Error("Unexpected Link Manager keyword save response")
  }

  return data
}

export const resetLinkManagerApiBase = async () => {
  await chrome.storage.sync.remove("linkManagerApiBase")
}
