import { tabButtonStyle, activeTabButtonStyle } from "./styles"

export type TabType = "home" | "backlinks" | "settings"

type SidebarProps = {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <div style={{
      width: "80px",
      backgroundColor: "#f8fafc",
      borderRight: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      paddingTop: 20,
      flexShrink: 0
    }}>
      <button
        style={activeTab === "home" ? activeTabButtonStyle : tabButtonStyle}
        onClick={() => onTabChange("home")}>
        <span>Home</span>
      </button>
      <button
        style={activeTab === "backlinks" ? activeTabButtonStyle : tabButtonStyle}
        onClick={() => onTabChange("backlinks")}>
        <span>Backlinks</span>
      </button>
      <button
        style={activeTab === "settings" ? activeTabButtonStyle : tabButtonStyle}
        onClick={() => onTabChange("settings")}>
        <span>Settings</span>
      </button>
    </div>
  )
}

