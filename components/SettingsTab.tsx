import { contentStyle, labelStyle, inputStyle, buttonStyle, errorStyle, successStyle } from "./styles"

type SettingsTabProps = {
  apiKey: string
  model: string
  commentLength: string
  capsolverApiKey: string
  saveMessage: string | null
  onApiKeyChange: (value: string) => void
  onModelChange: (value: string) => void
  onCommentLengthChange: (value: string) => void
  onCapsolverApiKeyChange: (value: string) => void
  onSave: () => void
}

export const SettingsTab = ({
  apiKey,
  model,
  commentLength,
  capsolverApiKey,
  saveMessage,
  onApiKeyChange,
  onModelChange,
  onCommentLengthChange,
  onCapsolverApiKeyChange,
  onSave
}: SettingsTabProps) => {
  return (
    <div style={contentStyle}>
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={labelStyle}>
          <span>API Key</span>
          <input
            style={inputStyle}
            type="password"
            placeholder="sk-or-v1-xxxxxxxx"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
          />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            OpenRouter API key from{" "}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
              openrouter.ai/keys
            </a>
          </span>
        </label>

        <label style={labelStyle}>
          <span>Model</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="anthropic/claude-3-haiku-20240307"
            value={model}
            onChange={(event) => onModelChange(event.target.value)}
          />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            Model identifier (e.g., anthropic/claude-3-haiku-20240307)
          </span>
        </label>

        <label style={labelStyle}>
          <span>Comment Length</span>
          <select
            style={inputStyle}
            value={commentLength}
            onChange={(event) => onCommentLengthChange(event.target.value)}>
            <option value="short">Short (20-30 words)</option>
            <option value="medium">Medium (30-50 words)</option>
            <option value="long">Long (50-100 words)</option>
          </select>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            Controls the length of generated comments
          </span>
        </label>

        <label style={labelStyle}>
          <span>CapSolver API Key</span>
          <input
            style={inputStyle}
            type="password"
            placeholder="CAP-XXXXXXXXXXXXXX"
            value={capsolverApiKey}
            onChange={(event) => onCapsolverApiKeyChange(event.target.value)}
          />
          <span style={{ fontSize: 11, color: "#64748b" }}>
            CapSolver API key from{" "}
            <a href="https://www.capsolver.com" target="_blank" rel="noreferrer">
              capsolver.com
            </a>
            {" "}for backlinks feature
          </span>
        </label>

        <button style={buttonStyle} onClick={onSave}>
          Save Settings
        </button>

        {saveMessage ? <p style={saveMessage.includes("success") ? successStyle : errorStyle}>{saveMessage}</p> : null}
      </section>

      <footer style={{ marginTop: "auto", paddingTop: 16 }}>
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 12,
            backgroundColor: "#f8fafc",
            fontSize: 12,
            color: "#475569",
            lineHeight: 1.5
          }}>
          <strong>Popular Models:</strong>
          <ul style={{ margin: "6px 0 0 0", paddingLeft: 18 }}>
            <li>google/gemini-2.0-flash-001</li>
            <li>openai/gpt-4o-mini</li>
          </ul>
        </div>
      </footer>
    </div>
  )
}

