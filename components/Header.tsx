type HeaderProps = {
  onClose?: () => void
}

export const Header = ({ onClose }: HeaderProps) => {
  return (
    <div style={{
      padding: "16px 24px",
      borderBottom: "1px solid #e2e8f0",
      backgroundColor: "#ffffff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1f2937", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          Comment Fast
        </h1>
      </div>
      {onClose && (
        <button
          style={{
            border: "none",
            backgroundColor: "transparent",
            color: "#64748b",
            cursor: "pointer",
            fontSize: 20,
            padding: "4px 8px",
            borderRadius: 4,
            transition: "background-color 0.2s"
          }}
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
          ×
        </button>
      )}
    </div>
  )
}

