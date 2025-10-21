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

type BackgroundMessage = GenerateCommentRequest

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

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
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

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error))
