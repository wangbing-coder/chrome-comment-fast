import { DEBUG } from "./config"

type ArticleStructure = {
  mainTitle?: string
  keyPoints?: string
  introduction?: string
  hasCode?: string
}

type GenerateCommentRequest = {
  type: "GENERATE_COMMENT"
  payload: {
    title: string
    url: string
    contentSnippet: string
    structure: ArticleStructure
  }
}

type FetchBacklinksRequest = {
  type: "FETCH_BACKLINKS"
  payload: {
    domain: string
    capsolverApiKey: string
  }
}

type GetCurrentTabRequest = {
  type: "GET_CURRENT_TAB"
}

type BackgroundMessage = GenerateCommentRequest | FetchBacklinksRequest | GetCurrentTabRequest

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const buildSmartPrompt = (
  title: string,
  contentSnippet: string,
  structure: ArticleStructure,
  commentLength: string
): string => {
  const lengthGuide =
    commentLength === "short"
      ? "Keep it very brief (20-30 words or equivalent characters)"
      : commentLength === "medium"
        ? "Keep it moderate length (30-50 words or equivalent characters)"
        : "Keep it comprehensive but concise (50-100 words or equivalent characters)"

  let prompt = `You are writing a thoughtful comment on a blog post.\n\n`

  prompt += `IMPORTANT: Analyze the language used in the article content below, and write your comment in THE EXACT SAME LANGUAGE.\n`
  prompt += `For example: If the article is in French, write in French. If in Spanish, write in Spanish. If in German, write in German.\n\n`

  prompt += `Article Title: "${title}"\n\n`

  if (structure.keyPoints) {
    prompt += `Key Topics Discussed: ${structure.keyPoints}\n\n`
  }

  if (structure.introduction) {
    prompt += `Article Introduction:\n${structure.introduction.slice(0, 300)}\n\n`
  }

  if (structure.hasCode === "yes") {
    prompt += `Note: This is a technical article with code examples.\n\n`
  }

  prompt += `Article Content Excerpt:\n${contentSnippet.slice(0, 500)}\n\n`

  prompt += `Write a comment that:\n`
  prompt += `1. Is written in the SAME LANGUAGE as the article content\n`
  prompt += `2. Shows you actually read the article by referencing specific points\n`
  prompt += `3. Adds value through insight, question, or related experience\n`
  prompt += `4. Sounds natural and genuine, not generic or AI-generated\n`
  prompt += `5. Is polite and constructive\n`
  prompt += `6. ${lengthGuide}\n\n`
  prompt += `Do NOT:\n`
  prompt += `- Start with generic phrases like "Great post!" or "Nice article!"\n`
  prompt += `- Write in English if the article is in another language\n`
  prompt += `- Sound like spam or promotional content\n\n`
  prompt += `Jump straight into substantive content.`

  return prompt
}

// Backlinks helper functions
// Clean domain: remove protocol and trailing slashes
const cleanDomain = (domain: string): string => {
  let cleaned = domain.trim()
  // Remove protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '')
  // Remove www. prefix
  // cleaned = cleaned.replace(/^www\./i, '')
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/g, '')
  return cleaned
}

const getToken = async (domain: string, capsolverApiKey: string): Promise<string> => {
  const siteKey = "0x4AAAAAAAAzi9ITzSN9xKMi"
  const siteUrl = `https://ahrefs.com/backlink-checker/?input=${domain}&mode=subdomains`
  
  if (DEBUG) console.log("🔵 Creating CapSolver task for domain:", domain)
  
  const payload = {
    clientKey: capsolverApiKey,
    task: {
      type: 'AntiTurnstileTaskProxyLess',
      websiteKey: siteKey,
      websiteURL: siteUrl,
      metadata: {
        action: ""
      }
    }
  }

  const res = await fetch("https://api.capsolver.com/createTask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  const resp = await res.json()
  if (DEBUG) console.log("CapSolver createTask response:", resp)
  
  const taskId = resp.taskId

  if (!taskId) {
    throw new Error(`Failed to create CapSolver task: ${JSON.stringify(resp)}`)
  }
  
  if (DEBUG) console.log("✅ Task created, taskId:", taskId)

  // Poll for result
  let attempts = 0
  const maxAttempts = 60 // 60 seconds max
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    attempts++
    
    const pollPayload = { clientKey: capsolverApiKey, taskId }
    const pollRes = await fetch("https://api.capsolver.com/getTaskResult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pollPayload)
    })
    const pollResp = await pollRes.json()
    
    if (pollResp.status === "ready") {
      if (DEBUG) console.log("✅ CapSolver token ready")
      return pollResp.solution.token
    }
    if (pollResp.status === "failed" || pollResp.errorId) {
      console.error("❌ CapSolver failed:", pollResp)
      throw new Error(`CapSolver failed: ${JSON.stringify(pollResp)}`)
    }
    
    // Log progress every 5 seconds
    if (attempts % 5 === 0) {
      if (DEBUG) console.log(`⏳ Waiting for CapSolver... (${attempts}s elapsed, status: ${pollResp.status})`)
    }
  }
  
  throw new Error("CapSolver timeout after 60 seconds")
}

const getSignature = async (token: string, domain: string): Promise<{ signature: string; validUntil: number }> => {
  const url = "https://ahrefs.com/v4/stGetFreeBacklinksOverview"
  const payload = {
    captcha: token,
    mode: "subdomains",
    url: domain
  }

  if (DEBUG) console.log("🔵 Requesting signature from Ahrefs with payload:", payload)

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ Ahrefs signature request failed:", response.status, errorText)
    throw new Error(`Failed to get signature: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (DEBUG) console.log("✅ Signature response received:", JSON.stringify(data).substring(0, 200))
  
  if (Array.isArray(data) && data.length > 1) {
    const signature = data[1].signedInput.signature
    const validUntil = data[1].signedInput.input.validUntil
    if (DEBUG) console.log("✅ Extracted signature and validUntil")
    return { signature, validUntil }
  }
  
  console.error("❌ Invalid signature response format:", data)
  throw new Error(`Invalid signature response format: ${JSON.stringify(data)}`)
}

const getBacklinks = async (signature: string, validUntil: number, domain: string): Promise<any> => {
  const url = "https://ahrefs.com/v4/stGetFreeBacklinksList"
  const payload = {
    reportType: "TopBacklinks",
    signedInput: {
      signature,
      input: {
        validUntil,
        mode: "subdomains",
        url: `${domain}/`
      }
    }
  }

  if (DEBUG) console.log("🔵 Requesting backlinks from Ahrefs")

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("❌ Ahrefs backlinks request failed:", response.status, errorText)
    throw new Error(`Failed to get backlinks: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (DEBUG) console.log("✅ Backlinks response received:", JSON.stringify(data).substring(0, 300))
  
  // Log the structure to help debug
  if (data && data[1] && data[1].backlinks) {
    if (DEBUG) console.log(`📊 Found ${data[1].backlinks?.length || 0} backlinks`)
  } else if (data && data[1] && data[1].topBacklinks) {
    if (DEBUG) console.log(`📊 Found ${data[1].topBacklinks.backlinks?.length || 0} backlinks (nested)`)
  } else {
    if (DEBUG) console.warn("⚠️ Unexpected data structure. Keys:", Object.keys(data))
  }
  
  return data
}

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  if (message?.type === "GET_CURRENT_TAB") {
    ;(async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
        if (tab?.url) {
          const url = new URL(tab.url)
          sendResponse({ success: true, domain: url.hostname, url: tab.url })
        } else {
          sendResponse({ success: false, error: "No active tab found" })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        sendResponse({ success: false, error: message })
      }
    })()
    return true
  }
  
  if (message?.type === "FETCH_BACKLINKS") {
    ;(async () => {
      try {
        let { domain, capsolverApiKey } = message.payload

        if (!capsolverApiKey) {
          sendResponse({ success: false, error: "Missing CapSolver API Key" })
          return
        }

        if (!domain) {
          sendResponse({ success: false, error: "Missing domain" })
          return
        }

        // Clean the domain
        domain = cleanDomain(domain)
        if (DEBUG) console.log("🔵 Fetching backlinks for cleaned domain:", domain)

        // Step 1: Get token
        if (DEBUG) console.log("Step 1: Getting CapSolver token...")
        const token = await getToken(domain, capsolverApiKey)
        if (DEBUG) console.log("✅ Token received:", token.substring(0, 20) + "...")

        // Step 2: Get signature
        if (DEBUG) console.log("Step 2: Getting signature...")
        const { signature, validUntil } = await getSignature(token, domain)
        if (DEBUG) console.log("✅ Signature received, validUntil value:", validUntil, "type:", typeof validUntil)
        try {
          if (DEBUG) console.log("Valid until:", new Date(validUntil * 1000).toISOString())
        } catch (e) {
          if (DEBUG) console.log("Valid until (raw):", validUntil)
        }

        // Step 3: Get backlinks
        if (DEBUG) console.log("Step 3: Getting backlinks...")
        const data = await getBacklinks(signature, validUntil, domain)
        if (DEBUG) console.log("✅ Backlinks data structure:", Object.keys(data))

        sendResponse({ success: true, data })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error("❌ Backlinks fetch error:", message)
        sendResponse({ success: false, error: message })
      }
    })()
    return true
  }

  if (message?.type !== "GENERATE_COMMENT") {
    return
  }

  ;(async () => {
    try {
      const { title, url, contentSnippet, structure } = message.payload

      const { aiApiKey, aiModel, commentLength } = await chrome.storage.sync.get([
        "aiApiKey",
        "aiModel",
        "commentLength"
      ])

      if (!aiApiKey) {
        sendResponse({ success: false, error: "Missing API Key in settings" })
        return
      }

      if (!aiModel) {
        sendResponse({ success: false, error: "Missing AI Model in settings" })
        return
      }

      const lengthSetting = commentLength || "medium"

      const userPrompt = buildSmartPrompt(title, contentSnippet, structure, lengthSetting)

      const body = {
        model: aiModel,
        messages: [
          {
            role: "system",
            content:
              "You are an experienced blog reader who writes insightful, substantive comments. Your comments reference specific content from the article and add genuine value through your perspective or questions."
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        max_tokens: lengthSetting === "short" ? 150 : lengthSetting === "medium" ? 250 : 350,
        temperature: 0.7
      }

      let response
      try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiApiKey}`,
            "HTTP-Referer": "https://comment-fast.example",
            "X-Title": "Comment Fast"
          },
          body: JSON.stringify(body)
        })
      } catch (fetchError) {
        console.error("❌ Network error:", fetchError)
        sendResponse({ success: false, error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Could not establish connection'}` })
        return
      }

      if (!response.ok) {
        let errorText
        try {
          errorText = await response.text()
        } catch {
          errorText = `HTTP ${response.status}`
        }
        console.error("❌ OpenRouter API error:", response.status, errorText)
        sendResponse({ success: false, error: `OpenRouter error: ${errorText}` })
        return
      }

      const data = (await response.json()) as OpenRouterResponse

      const comment = data?.choices?.[0]?.message?.content?.trim()

      if (!comment) {
        console.error("❌ No comment received from OpenRouter")
        sendResponse({ success: false, error: "No comment received from OpenRouter" })
        return
      }

      sendResponse({ success: true, comment })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error("❌ Unexpected error:", message)
      sendResponse({ success: false, error: message })
    }
  })()

  return true
})

// Handle extension icon click - toggle floating panel
chrome.action.onClicked.addListener(async (tab) => {
  if (DEBUG) console.log("🔵 Extension icon clicked, tab:", tab.url)
  
  if (!tab.id) {
    if (DEBUG) console.warn("⚠️ No tab ID available")
    return
  }

  try {
    // Check if page supports content scripts
    if (tab.url?.startsWith("chrome://") || 
        tab.url?.startsWith("chrome-extension://") || 
        tab.url?.startsWith("edge://") ||
        tab.url?.startsWith("about:") ||
        tab.url?.startsWith("moz-extension://")) {
      if (DEBUG) console.warn("⚠️ Cannot inject floating panel on this page type:", tab.url)
      return
    }

    if (DEBUG) console.log("✅ Page supports content scripts, sending message to toggle panel")
    
    // Send message to content script to toggle panel
    await chrome.tabs.sendMessage(tab.id, {
      type: "TOGGLE_FLOATING_PANEL"
    })
    
    if (DEBUG) console.log("✅ Toggle panel message sent successfully")
  } catch (error) {
    console.error("❌ Failed to toggle floating panel:", error)
    if (DEBUG) console.log("💡 Try refreshing the page and clicking the icon again")
  }
})
