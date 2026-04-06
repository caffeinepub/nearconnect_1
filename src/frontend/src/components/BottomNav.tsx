import { MessageCircle, Search, Settings, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createActorWithConfig } from "../config";
import { useApp } from "../context/AppContext";

type NavPage = "friends" | "chats" | "search" | "settings" | "admin";

interface BottomNavProps {
  active: NavPage;
  onNavigate: (page: NavPage) => void;
  friendRequestCount?: number;
}

export function BottomNav({
  active,
  onNavigate,
  friendRequestCount = 0,
}: BottomNavProps) {
  const { theme, currentUser } = useApp();
  const isLight = theme === "light-clean";
  const isAdmin = currentUser?.isAdmin;
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (!currentUser?.id) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const actor = await createActorWithConfig();
        const count = await actor.getTotalUnreadCount(currentUser.id);
        if (!cancelled) setTotalUnread(Number(count));
      } catch {
        // silent
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const tabs = [
    {
      key: "friends" as NavPage,
      icon: Users,
      label: "Friends",
      badge: friendRequestCount,
    },
    {
      key: "chats" as NavPage,
      icon: MessageCircle,
      label: "Chats",
      badge: totalUnread,
    },
    { key: "search" as NavPage, icon: Search, label: "Search", badge: 0 },
    { key: "settings" as NavPage, icon: Settings, label: "Profile", badge: 0 },
    ...(isAdmin
      ? [{ key: "admin" as NavPage, icon: Shield, label: "Admin", badge: 0 }]
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
      {tabs.map(({ key, icon: Icon, label, badge }) => (
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
            padding: "4px 16px",
            transition: "all 0.2s",
            position: "relative",
          }}
        >
          <div style={{ position: "relative" }}>
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
            {badge > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -6,
                  right: -8,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background:
                    key === "friends"
                      ? "oklch(0.55 0.25 280)"
                      : "oklch(0.6 0.28 25)",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 4px",
                  animation: "badgePulse 1.5s ease-in-out infinite",
                  boxShadow:
                    key === "friends"
                      ? "0 0 8px oklch(0.55 0.25 280 / 0.7)"
                      : "0 0 8px oklch(0.6 0.28 25 / 0.7)",
                }}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </div>
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
