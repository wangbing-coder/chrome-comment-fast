import type { ReactNode } from "react"

export type TabType = "home" | "backlinks" | "auto-commit" | "save" | "settings"

type SidebarProps = {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const Icon = ({ children }: { children: ReactNode }) => (
  <svg
    aria-hidden="true"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round">
    {children}
  </svg>
)

const tabs: Array<{ id: TabType; label: string; icon: ReactNode }> = [
  {
    id: "home",
    label: "Home",
    icon: (
      <Icon>
        <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2Z" />
      </Icon>
    )
  },
  {
    id: "backlinks",
    label: "Backlinks",
    icon: (
      <Icon>
        <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
      </Icon>
    )
  },
  {
    id: "auto-commit",
    label: "Prepare",
    icon: (
      <Icon>
        <path d="m5 12 4 4L19 6" />
        <path d="M21 12a9 9 0 1 1-5.3-8.2" />
      </Icon>
    )
  },
  {
    id: "save",
    label: "Saved",
    icon: (
      <Icon>
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
      </Icon>
    )
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
      </Icon>
    )
  }
]

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => (
  <aside
    style={{
      width: 76,
      padding: "14px 8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 5,
      flexShrink: 0,
      borderRight: "1px solid #e4e7ec",
      background: "#f8fafc"
    }}>
    <div
      style={{
        width: 32,
        height: 32,
        marginBottom: 8,
        display: "grid",
        placeItems: "center",
        borderRadius: 10,
        background: "linear-gradient(145deg, #6d5dfc, #4938e8)",
        boxShadow: "0 5px 12px rgba(91, 77, 245, .22)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "-.03em"
      }}>
      CF
    </div>
    {tabs.map((tab) => {
      const active = activeTab === tab.id
      return (
        <button
          key={tab.id}
          aria-current={active ? "page" : undefined}
          style={{
            width: "100%",
            minHeight: 54,
            padding: "7px 3px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            border: 0,
            borderRadius: 9,
            background: active ? "#eeecff" : "transparent",
            color: active ? "#5145e5" : "#667085",
            fontSize: 10,
            fontWeight: active ? 700 : 550,
            cursor: "pointer"
          }}
          onClick={() => onTabChange(tab.id)}>
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      )
    })}
  </aside>
)
