import { useCallback, useEffect, useState } from "react"
import { DEBUG } from "../config"
import { containerStyle } from "./styles"
import { Sidebar, type TabType } from "./Sidebar"
import { Header } from "./Header"
import { HomeTab, type DomainInfo } from "./HomeTab"
import { BacklinksTab } from "./BacklinksTab"
import { SettingsTab } from "./SettingsTab"
import { extractContentSnippet, extractArticleStructure } from "./utils"

type GenerationStatus = "idle" | "loading" | "success" | "error"

type SidePanelProps = {
  onClose?: () => void
}

const SidePanel = ({ onClose }: SidePanelProps = {}) => {
  // Global error handler for debugging (only in debug mode)
  useEffect(() => {
    if (!DEBUG) return
    const errorHandler = (event: ErrorEvent) => {
      console.error("🔴 Global error caught:", event.error, event.message, event.filename, event.lineno)
    }
    window.addEventListener('error', errorHandler)
    return () => window.removeEventListener('error', errorHandler)
  }, [])
  
  const [activeTab, setActiveTab] = useState<TabType>("home")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("anthropic/claude-3-haiku-20240307")
  const [commentLength, setCommentLength] = useState("medium")
  const [comment, setComment] = useState("")
  const [status, setStatus] = useState<GenerationStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [domains, setDomains] = useState<DomainInfo[]>([])
  const [copyStatus, setCopyStatus] = useState<{[key: string]: string}>({})
  const [showCopyToast, setShowCopyToast] = useState<string>("")
  const [currentDomain, setCurrentDomain] = useState<string>("")
  
  // Backlinks states
  const [capsolverApiKey, setCapsolverApiKey] = useState("")
  const [backlinksDomain, setBacklinksDomain] = useState("")
  const [backlinksLoading, setBacklinksLoading] = useState(false)
  const [backlinksData, setBacklinksData] = useState<any>(null)
  const [backlinksError, setBacklinksError] = useState<string | null>(null)
  const [checkLoading, setCheckLoading] = useState(false)
  const [checkResults, setCheckResults] = useState<{[key: string]: {exists: boolean, canSubmit: boolean}} | null>(null)
  const [savingUrls, setSavingUrls] = useState<Set<string>>(new Set())
  const [savedUrls, setSavedUrls] = useState<Set<string>>(new Set())

  useEffect(() => {
    void (async () => {
      const { aiApiKey, aiModel, commentLength: savedLength, userDomains, capsolverApiKey: savedCapsolverKey } = await chrome.storage.sync.get([
        "aiApiKey",
        "aiModel",
        "commentLength",
        "userDomains",
        "capsolverApiKey"
      ])
      if (aiApiKey) setApiKey(aiApiKey)
      if (aiModel) setModel(aiModel)
      if (savedLength) setCommentLength(savedLength)
      if (userDomains) setDomains(userDomains)
      if (savedCapsolverKey) setCapsolverApiKey(savedCapsolverKey)
    })()
  }, [])

  const handleSaveSettings = useCallback(async () => {
    if (!apiKey.trim()) {
      setSaveMessage("Please enter API Key")
      return
    }
    if (!model.trim()) {
      setSaveMessage("Please enter Model")
      return
    }

    await chrome.storage.sync.set({
      aiApiKey: apiKey.trim(),
      aiModel: model.trim(),
      commentLength: commentLength,
      capsolverApiKey: capsolverApiKey.trim()
    })
    setSaveMessage("Settings saved successfully")
    setTimeout(() => setSaveMessage(null), 3000)
  }, [apiKey, model, commentLength, capsolverApiKey])

  const handleGenerate = useCallback(async () => {
    const { aiApiKey, aiModel, commentLength } = await chrome.storage.sync.get([
      "aiApiKey",
      "aiModel",
      "commentLength"
    ])

    if (!aiApiKey?.trim() || !aiModel?.trim()) {
      setError("Please configure API Key and Model in Settings")
      return
    }

    setStatus("loading")
    setError(null)
    setCurrentDomain("")

    try {
      const currentUrl = window.location.href
      
      if (currentUrl.startsWith("chrome://") || 
          currentUrl.startsWith("chrome-extension://") || 
          currentUrl.startsWith("edge://") ||
          currentUrl.startsWith("about:") ||
          currentUrl.startsWith("moz-extension://")) {
        throw new Error("Cannot generate comments on this page type. Please navigate to a regular webpage.")
      }

      try {
        const url = new URL(currentUrl)
        setCurrentDomain(url.hostname)
      } catch (urlError) {
        if (DEBUG) console.warn("Could not parse domain from URL:", urlError)
        setCurrentDomain("Unknown")
      }

      const title = document.title || ""
      const contentSnippet = extractContentSnippet()
      const structure = extractArticleStructure()

      const pageContext = {
        success: true,
        payload: {
          title,
          url: currentUrl,
          contentSnippet,
          structure
        }
      }

      if (!pageContext?.success) {
        throw new Error("Failed to get page context")
      }

      let response
      try {
        response = await chrome.runtime.sendMessage({
          type: "GENERATE_COMMENT",
          payload: pageContext.payload
        })
      } catch (runtimeError) {
        console.error("❌ Background script connection failed:", runtimeError)
        throw new Error(`Could not establish connection. Please refresh the page and try again.`)
      }

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to generate comment")
      }

      setComment(response.comment)
      setStatus("success")
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("❌ Generation failed:", message)
      setError(message)
      setStatus("error")
      setCurrentDomain("")
    }
  }, [])

  const handleCopyComment = useCallback(() => {
    if (comment) {
      navigator.clipboard.writeText(comment)
      setCopyStatus(prev => ({ ...prev, comment: "Copied!" }))
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, comment: "" }))
      }, 2000)
    }
  }, [comment])

  const handleCopyToClipboard = useCallback((text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setShowCopyToast("copied")
    setTimeout(() => {
      setShowCopyToast("")
    }, 1500)
  }, [])

  // Backlinks functionality
  const handleFetchBacklinks = useCallback(async () => {
    if (DEBUG) console.log("🔵 handleFetchBacklinks called, backlinksDomain:", backlinksDomain)
    let domainToFetch = backlinksDomain.trim()
    
    if (!domainToFetch) {
      if (DEBUG) console.log("🔵 No domain entered, trying to get current page domain...")
      try {
        const response = await chrome.runtime.sendMessage({ type: "GET_CURRENT_TAB" })
        if (DEBUG) console.log("🔵 Current tab response:", response)
        
        if (response?.success && response.domain) {
          domainToFetch = response.domain
          if (DEBUG) console.log("✅ Extracted domain:", domainToFetch)
          setBacklinksDomain(domainToFetch)
        } else {
          console.error("❌ Failed to get current tab:", response?.error)
          setBacklinksError(response?.error || "Failed to get current page domain")
          return
        }
      } catch (err) {
        console.error("❌ Error getting current domain:", err)
        setBacklinksError(`Error: ${err instanceof Error ? err.message : String(err)}`)
        return
      }
    }
    
    if (DEBUG) console.log("🔵 Domain to fetch:", domainToFetch)

    const { capsolverApiKey: savedCapsolverKey } = await chrome.storage.sync.get(["capsolverApiKey"])

    if (!savedCapsolverKey?.trim()) {
      setBacklinksError("Please configure CapSolver API Key in Settings")
      return
    }

    setBacklinksLoading(true)
    setBacklinksError(null)
    setBacklinksData(null)
    setCheckResults(null)

    try {
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_BACKLINKS",
        payload: {
          domain: domainToFetch,
          capsolverApiKey: savedCapsolverKey
        }
      })

      if (!response?.success) {
        throw new Error(response?.error ?? "Failed to fetch backlinks")
      }

      setBacklinksData(response.data)
      setBacklinksLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setBacklinksError(message)
      setBacklinksLoading(false)
    }
  }, [backlinksDomain])

  const handleCheckBacklinks = useCallback(async () => {
    if (!backlinksData) return

    const backlinks = backlinksData[1]?.backlinks || backlinksData[1]?.topBacklinks?.backlinks
    if (!backlinks || backlinks.length === 0) {
      setBacklinksError("No backlinks to check")
      return
    }

    setCheckLoading(true)
    setBacklinksError(null)

    try {
      const urls = backlinks.map((bl: any) => bl.urlFrom)
      
      const response = await fetch("https://link-manager.leobing2023.workers.dev/api/external/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ urls })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to check backlinks: ${errorText}`)
      }

      const data = await response.json()
      
      const resultsMap: {[key: string]: {exists: boolean, canSubmit: boolean}} = {}
      data.results.forEach((result: any) => {
        resultsMap[result.url] = {
          exists: result.exists,
          canSubmit: result.canSubmit
        }
      })

      setCheckResults(resultsMap)
      setCheckLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setBacklinksError(message)
      setCheckLoading(false)
    }
  }, [backlinksData])

  const handleSaveBacklink = useCallback(async (backlink: any) => {
    const url = backlink.urlFrom
    
    setSavingUrls(prev => new Set(prev).add(url))
    setBacklinksError(null)

    try {
      const link = {
        url: url,
        title: backlink.title || "",
        description: "",
        dr: backlink.domainRating || 0,
        tags: ["backlink"],
        notes: `Found via Ahrefs backlink checker`
      }

      const response = await fetch("https://link-manager.leobing2023.workers.dev/api/external/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ links: [link] })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save: ${errorText}`)
      }

      const data = await response.json()
      
      setSavedUrls(prev => new Set(prev).add(url))
      setSavingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setBacklinksError(message)
      setSavingUrls(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }
  }, [])

  return (
    <div style={containerStyle}>
      {showCopyToast && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "rgba(59, 130, 246, 0.9)",
          color: "white",
          padding: "10px 16px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(2px)",
          border: "1px solid rgba(255, 255, 255, 0.2)"
        }}>
          {showCopyToast}
        </div>
      )}
      
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header onClose={onClose} />

        {activeTab === "home" ? (
          <HomeTab
            comment={comment}
            status={status}
            error={error}
            currentDomain={currentDomain}
            copyStatus={copyStatus}
            domains={domains}
            onGenerate={handleGenerate}
            onCopyComment={handleCopyComment}
            onCopyToClipboard={handleCopyToClipboard}
            onDomainsChange={setDomains}
          />
        ) : activeTab === "backlinks" ? (
          <BacklinksTab
            backlinksDomain={backlinksDomain}
            backlinksLoading={backlinksLoading}
            backlinksError={backlinksError}
            backlinksData={backlinksData}
            checkLoading={checkLoading}
            checkResults={checkResults}
            savingUrls={savingUrls}
            savedUrls={savedUrls}
            onDomainChange={setBacklinksDomain}
            onFetchBacklinks={handleFetchBacklinks}
            onCheckBacklinks={handleCheckBacklinks}
            onSaveBacklink={handleSaveBacklink}
          />
        ) : (
          <SettingsTab
            apiKey={apiKey}
            model={model}
            commentLength={commentLength}
            capsolverApiKey={capsolverApiKey}
            saveMessage={saveMessage}
            onApiKeyChange={setApiKey}
            onModelChange={setModel}
            onCommentLengthChange={setCommentLength}
            onCapsolverApiKeyChange={setCapsolverApiKey}
            onSave={handleSaveSettings}
          />
        )}
      </div>
    </div>
  )
}

export default SidePanel
