type GenerateCommentRequest = {
  type: "GENERATE_COMMENT"
  payload: {
    title: string
    url: string
    contentSnippet: string
    language?: string
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

chrome.runtime.onMessage.addListener((message: BackgroundMessage, _sender, sendResponse) => {
  if (message?.type !== "GENERATE_COMMENT") {
    return
  }

  ;(async () => {
    try {
      const { title, url, contentSnippet, language } = message.payload

      const { aiApiKey, aiModel } = await chrome.storage.sync.get(["aiApiKey", "aiModel"])

      if (!aiApiKey) {
        sendResponse({ success: false, error: "Missing API Key in settings" })
        return
      }

      if (!aiModel) {
        sendResponse({ success: false, error: "Missing AI Model in settings" })
        return
      }

      const promptLanguage = language ?? "English"

      const body = {
        model: aiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly and professional blog reader. Please write a concise, valuable, and sincere comment based on the given content. Keep it under 80 Chinese characters or 120 English characters."
          },
          {
            role: "user",
            content: `Please reply in ${promptLanguage} to the following blog post:\nTitle: ${title}\nURL: ${url}\nContent: ${contentSnippet}`
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
          "HTTP-Referer": "https://comment-fast.example",
          "X-Title": "Comment Fast"
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorText = await response.text()
        sendResponse({ success: false, error: `OpenRouter error: ${errorText}` })
        return
      }

      const data = (await response.json()) as OpenRouterResponse
      const comment = data?.choices?.[0]?.message?.content?.trim()

      if (!comment) {
        sendResponse({ success: false, error: "No comment received from OpenRouter" })
        return
      }

      sendResponse({ success: true, comment })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      sendResponse({ success: false, error: message })
    }
  })()

  return true
})

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error))
