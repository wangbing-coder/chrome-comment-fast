import { parse as parseTld } from "tldts"

export type PageLink = {
  url: string
  text: string
  source: "anchor" | "text"
}

export type PageDomain = {
  domain: string
  hosts: string[]
  linkCount: number
  anchors: string[]
  sampleUrl: string
  sources: Array<PageLink["source"]>
  isCurrent: boolean
}

const MAX_ANCHORS_PER_DOMAIN = 5
// A scheme prefix like "mailto:" — but not a "host:port".
const NON_HTTP_SCHEME_RE = /^[a-z][a-z0-9+.-]*:(?!\d)/i
const TEXT_URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`()[\]{}]+/gi
const DOMAIN_RE =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const hostnameOf = (input: string): string | null => {
  if (NON_HTTP_SCHEME_RE.test(input) && !/^https?:/i.test(input)) return null
  try {
    const url = new URL(
      /^https?:\/\//i.test(input) ? input : `https://${input}`
    )
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.hostname.replace(/\.$/, "").toLowerCase()
  } catch {
    return null
  }
}

/** Registrable domain (eTLD+1, ICANN section only), or null. */
export const toRegistrableDomain = (input: string): string | null => {
  const hostname = hostnameOf(input)
  if (!hostname) return null

  const parsed = parseTld(hostname, { allowPrivateDomains: false })
  if (parsed.isIp || !parsed.isIcann || !parsed.domain) return null
  return DOMAIN_RE.test(parsed.domain) ? parsed.domain : null
}

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim()

export const collectPageLinks = (doc: Document): PageLink[] => {
  const links: PageLink[] = []

  doc
    .querySelectorAll<
      HTMLAnchorElement | HTMLAreaElement
    >("a[href], area[href]")
    .forEach((element) => {
      const href = element.href
      if (!/^https?:\/\//i.test(href)) return
      const text =
        cleanText(element.textContent || "") ||
        cleanText(element.getAttribute("title") || "") ||
        cleanText(element.getAttribute("aria-label") || "") ||
        cleanText(element.querySelector("img")?.getAttribute("alt") || "")
      links.push({ url: href, text, source: "anchor" })
    })

  const bodyText = doc.body?.innerText || ""
  for (const match of bodyText.matchAll(TEXT_URL_RE)) {
    const raw = match[0].replace(/[.,;:!?]+$/g, "")
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    links.push({ url, text: "", source: "text" })
  }

  return links
}

export const groupLinksByDomain = (
  links: PageLink[],
  currentUrl: string
): PageDomain[] => {
  const currentDomain = toRegistrableDomain(currentUrl)
  const groups = new Map<string, PageDomain>()

  for (const link of links) {
    const domain = toRegistrableDomain(link.url)
    if (!domain) continue

    let group = groups.get(domain)
    if (!group) {
      group = {
        domain,
        hosts: [],
        linkCount: 0,
        anchors: [],
        sampleUrl: link.url,
        sources: [],
        isCurrent: domain === currentDomain
      }
      groups.set(domain, group)
    }

    group.linkCount += 1
    const host = hostnameOf(link.url)
    if (host && !group.hosts.includes(host)) group.hosts.push(host)
    if (!group.sources.includes(link.source)) group.sources.push(link.source)
    const anchor = link.text.slice(0, 120)
    if (
      anchor &&
      group.anchors.length < MAX_ANCHORS_PER_DOMAIN &&
      !group.anchors.includes(anchor)
    ) {
      group.anchors.push(anchor)
    }
  }

  return Array.from(groups.values())
}
