import { Search, Settings, Shield, Users } from "lucide-react";
import { useApp } from "../context/AppContext";

type NavPage = "friends" | "search" | "settings" | "admin";

interface BottomNavProps {
  active: NavPage;
  onNavigate: (page: NavPage) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { theme, currentUser } = useApp();
  const isLight = theme === "light-clean";
  const isAdmin = currentUser?.isAdmin;

  const tabs = [
    { key: "friends" as NavPage, icon: Users, label: "Friends" },
    { key: "search" as NavPage, icon: Search, label: "Search" },
    { key: "settings" as NavPage, icon: Settings, label: "Settings" },
    ...(isAdmin
      ? [{ key: "admin" as NavPage, icon: Shield, label: "Admin" }]
      : []),
  ];

  return (
    <nav
      className="glass-card"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        padding: "12px 0 20px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100,
        borderRadius: "20px 20px 0 0",
        borderBottom: "none",
      }}
    >
      {tabs.map(({ key, icon: Icon, label }) => (
        <button
          type="button"
          key={key}
          data-ocid={`nav.${key}.link`}
          onClick={() => onNavigate(key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 20px",
            transition: "all 0.2s",
          }}
        >
          <Icon
            size={22}
            style={{
              color:
                active === key
                  ? key === "admin"
                    ? "oklch(0.75 0.2 50)"
                    : "oklch(0.8 0.15 200)"
                  : isLight
                    ? "#888"
                    : "rgba(255,255,255,0.4)",
              transition: "color 0.2s",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: active === key ? 600 : 400,
              color:
                active === key
                  ? key === "admin"
                    ? "oklch(0.75 0.2 50)"
                    : "oklch(0.8 0.15 200)"
                  : isLight
                    ? "#888"
                    : "rgba(255,255,255,0.4)",
              transition: "color 0.2s",
            }}
          >
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
}
