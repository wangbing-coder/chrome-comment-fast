type HeaderProps = {
  onClose?: () => void
}

export const Header = ({ onClose }: HeaderProps) => {
  const version = chrome.runtime.getManifest().version

  return (
    <div
      style={{
        minHeight: 58,
        padding: "0 24px",
        borderBottom: "1px solid #e4e7ec",
        backgroundColor: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#5b4df5",
            boxShadow: "0 0 0 4px #f0efff"
          }}
        />
        <h1
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: "#182230",
            fontFamily: "system-ui, -apple-system, sans-serif",
            letterSpacing: "-.01em"
          }}>
          Comment Fast
        </h1>
        <span
          style={{
            padding: "2px 5px",
            borderRadius: 999,
            background: "#f2f4f7",
            color: "#667085",
            fontSize: 9,
            fontWeight: 650
          }}>
          v{version}
        </span>
      </div>
      {onClose && (
        <button
          style={{
            border: "none",
            backgroundColor: "transparent",
            color: "#667085",
            cursor: "pointer",
            fontSize: 22,
            lineHeight: 1,
            width: 30,
            height: 30,
            padding: 0,
            borderRadius: 7,
            transition: "background-color 0.2s"
          }}
          onClick={onClose}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#f3f4f6")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }>
          ×
        </button>
      )}
    </div>
  )
}
