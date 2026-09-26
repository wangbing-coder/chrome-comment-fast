import { parse as parseTld } from "tldts"

// Well-known sites whose registration date is never interesting. Matched on the registrable domain.
const BLOCKED_DOMAINS = new Set([
  // Social / community
  "facebook.com", "fb.com", "fb.me", "instagram.com", "threads.net",
  "twitter.com", "x.com", "t.co", "linkedin.com", "lnkd.in", "tiktok.com",
  "pinterest.com", "pin.it", "reddit.com", "redd.it", "tumblr.com",
  "snapchat.com", "discord.com", "discord.gg", "telegram.org", "t.me",
  "whatsapp.com", "wa.me", "vk.com", "ok.ru", "weibo.com", "quora.com",
  "medium.com", "substack.com", "bsky.app", "mastodon.social", "line.me",
  "kakao.com", "naver.com", "douban.com", "zhihu.com", "bilibili.com",
  "xiaohongshu.com",
  // Video / audio
  "youtube.com", "youtu.be", "vimeo.com", "twitch.tv", "dailymotion.com",
  "spotify.com", "soundcloud.com", "apple.co", "ivoox.com", "deezer.com",
  "anchor.fm", "netflix.com",
  // Search / portals / big tech
  "google.com", "goo.gl", "g.co", "googleapis.com", "gstatic.com",
  "googleusercontent.com", "googletagmanager.com", "google-analytics.com",
  "doubleclick.net", "bing.com", "microsoft.com", "live.com", "office.com",
  "outlook.com", "msn.com", "yahoo.com", "yandex.ru", "yandex.com",
  "baidu.com", "duckduckgo.com", "apple.com", "icloud.com", "amazon.com",
  "amzn.to", "amazonaws.com", "ebay.com", "aliexpress.com",
  "alibaba.com", "taobao.com", "jd.com", "qq.com", "wechat.com",
  "tencent.com", "samsung.com", "adobe.com", "paypal.com", "stripe.com",
  "shopify.com", "etsy.com", "walmart.com", "booking.com", "tripadvisor.com",
  "airbnb.com", "uber.com", "zoom.us", "slack.com", "notion.so",
  "dropbox.com", "openai.com", "chatgpt.com", "anthropic.com",
  // Reference / news
  "wikipedia.org", "wikimedia.org", "wikidata.org", "archive.org",
  "imdb.com", "nytimes.com", "bbc.com", "bbc.co.uk", "cnn.com",
  "theguardian.com", "forbes.com", "reuters.com", "bloomberg.com",
  "washingtonpost.com", "wsj.com", "huffpost.com", "lifehacker.com",
  "techcrunch.com", "theverge.com", "wired.com", "businessinsider.com",
  // Dev / hosting / CMS
  "github.com", "github.io", "gitlab.com", "bitbucket.org",
  "stackoverflow.com", "stackexchange.com", "npmjs.com", "jsdelivr.net",
  "unpkg.com", "cloudflare.com", "vercel.app", "vercel.com", "netlify.app",
  "herokuapp.com", "wordpress.org", "wordpress.com", "wp.com", "w.org",
  "gravatar.com", "jetpack.com", "akismet.com", "blogger.com",
  "blogspot.com", "wix.com", "wixsite.com", "squarespace.com",
  "godaddy.com", "namecheap.com", "bluehost.com", "hostinger.com",
  "interserver.net", "digitalocean.com", "fontawesome.com",
  "creativecommons.org", "w3.org", "mozilla.org", "gnu.org",
  // Shorteners
  "bit.ly", "tinyurl.com", "ow.ly", "buff.ly", "is.gd", "rebrand.ly"
])

// Brands that also sit on many country suffixes (google.de, amazon.co.jp, ...).
const BLOCKED_BRANDS = new Set([
  "google", "youtube", "facebook", "amazon", "wikipedia", "yahoo", "bing",
  "ebay", "apple", "microsoft", "instagram", "linkedin", "twitter",
  "pinterest", "tiktok", "reddit", "yandex", "booking", "tripadvisor",
  "aliexpress", "blogspot", "wordpress", "bbc"
])

// Gray-market / link-selling words, matched anywhere in the name part.
const SPAM_KEYWORD_RE = new RegExp(
  [
    // SEO / link selling
    "backlink", "linkbuild", "guest-?post", "pbn", "(?<!mu)seo(?!ul)",
    "rank(?:ing)?boost", "traffic(?:bot|boost)", "followers",
    // Gambling
    "casino", "kazino", "kasino", "1xbet", "mostbet", "melbet", "pin-?up",
    "betting", "bookmaker", "sportsbet", "slot", "gacor", "togel",
    "judi(?!c)", "bandar", "poker", "baccarat", "roulette", "jackpot",
    // Adult
    "porn", "xxx", "escort", "hentai", "onlyfan",
    // Pharma / finance scams
    "viagra", "cialis", "pharma", "payday", "forex", "binaryoption",
    // Piracy / warez
    "crack", "keygen", "warez", "torrent", "apk", "nulled",
    // Essay mills / fakes
    "essay", "replica"
  ].join("|")
)

// Cheap or abuse-heavy suffixes, plus adult/gambling ones.
const SPAM_SUFFIXES = new Set([
  "top", "xyz", "icu", "buzz", "cyou", "cfd", "sbs", "rest", "bond",
  "click", "link", "work", "fun", "online", "site", "website", "space",
  "store", "shop", "pw", "tk", "ml", "ga", "cf", "gq", "su", "pm", "to",
  "loan", "win", "bid", "racing", "date", "review", "stream", "download",
  "men", "party", "trade", "science", "accountant", "cricket", "faith",
  "webcam", "zip", "mov", "lol", "monster", "quest", "beauty", "hair",
  "skin", "makeup", "autos", "boats", "homes", "motorcycles", "yachts",
  "mom", "pics", "cam", "casino", "bet", "poker", "porn", "sex", "xxx",
  "adult", "sexy", "tokyo", "gdn", "kim", "country", "ooo", "best"
])

const MAX_DIGITS = 1
const MAX_HYPHENS = 1

export type BlockReason = "big-site" | "spam"

export const getBlockReason = (domain: string): BlockReason | null => {
  if (BLOCKED_DOMAINS.has(domain)) return "big-site"

  const { domainWithoutSuffix: name, publicSuffix } = parseTld(domain, {
    allowPrivateDomains: false
  })
  if (name && BLOCKED_BRANDS.has(name)) return "big-site"
  if (!name) return null

  if (
    (publicSuffix && SPAM_SUFFIXES.has(publicSuffix)) ||
    name.includes("xn--") ||
    (name.match(/\d/g)?.length ?? 0) > MAX_DIGITS ||
    (name.match(/-/g)?.length ?? 0) > MAX_HYPHENS ||
    SPAM_KEYWORD_RE.test(name)
  ) {
    return "spam"
  }

  return null
}
