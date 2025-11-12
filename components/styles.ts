export const containerStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  fontSize: 14,
  color: "#1f2933",
  fontFamily: "system-ui, -apple-system, sans-serif",
  overflow: "hidden"
}

export const sidebarStyle: React.CSSProperties = {
  width: "80px",
  backgroundColor: "#f8fafc",
  borderRight: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: 20,
  flexShrink: 0
}

export const headerStyle: React.CSSProperties = {
  padding: "16px 24px",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center"
}

export const tabButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 8px",
  border: "none",
  backgroundColor: "transparent",
  fontSize: 11,
  fontWeight: 500,
  cursor: "pointer",
  color: "#64748b",
  transition: "all 0.2s",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 8,
  borderLeft: "3px solid transparent"
}

export const activeTabButtonStyle: React.CSSProperties = {
  ...tabButtonStyle,
  color: "#4f46e5",
  backgroundColor: "#eef2ff",
  borderLeftColor: "#4f46e5"
}

export const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: 24,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
  backgroundColor: "#ffffff"
}

export const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 13,
  fontWeight: 500
}

export const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 13,
  outline: "none"
}

export const buttonStyle: React.CSSProperties = {
  backgroundColor: "#4f46e5",
  color: "white",
  padding: "12px 0",
  borderRadius: 6,
  border: "none",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer"
}

export const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#a5b4fc",
  cursor: "not-allowed"
}

export const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: "#f1f5f9",
  color: "#334155",
  padding: "10px 0",
  borderRadius: 6,
  border: "1px solid #cbd5e1",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer"
}

export const cardStyle: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
  borderRadius: 8,
  padding: 14,
  whiteSpace: "pre-line",
  fontSize: 13,
  color: "#475569",
  lineHeight: 1.6
}

export const errorStyle: React.CSSProperties = {
  border: "1px solid #fecdd3",
  backgroundColor: "#ffe4e6",
  color: "#be123c",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 12,
  whiteSpace: "pre-line",
  lineHeight: 1.5
}

export const successStyle: React.CSSProperties = {
  border: "1px solid #bbf7d0",
  backgroundColor: "#dcfce7",
  color: "#15803d",
  borderRadius: 6,
  padding: "10px 12px",
  fontSize: 12
}

