import { Search, Settings, Users } from "lucide-react";
import { useApp } from "../context/AppContext";

interface BottomNavProps {
  active: "friends" | "search" | "settings";
  onNavigate: (page: "friends" | "search" | "settings") => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const { theme } = useApp();
  const isLight = theme === "light-clean";

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
      {(
        [
          { key: "friends", icon: Users, label: "Friends" },
          { key: "search", icon: Search, label: "Search" },
          { key: "settings", icon: Settings, label: "Settings" },
        ] as const
      ).map(({ key, icon: Icon, label }) => (
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
            padding: "4px 24px",
            transition: "all 0.2s",
          }}
        >
          <Icon
            size={22}
            style={{
              color:
                active === key
                  ? "oklch(0.8 0.15 200)"
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
                  ? "oklch(0.8 0.15 200)"
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
