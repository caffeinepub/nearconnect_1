import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Clock,
  MapPin,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import {
  formatDistance,
  getDistanceMeters,
  useApp,
} from "../context/AppContext";

interface SearchPageProps {
  onNavigate: (
    page: "friends" | "chats" | "search" | "settings" | "admin",
  ) => void;
}

const SUGGESTIONS = [
  {
    icon: <Users size={18} />,
    label: "Find nearby people",
    color: "oklch(0.65 0.22 195)",
  },
  {
    icon: <TrendingUp size={18} />,
    label: "Connect with new friends",
    color: "oklch(0.65 0.22 280)",
  },
  {
    icon: <Zap size={18} />,
    label: "Search by username or ID",
    color: "oklch(0.7 0.2 50)",
  },
  {
    icon: <Sparkles size={18} />,
    label: "Discover people in your radius",
    color: "oklch(0.7 0.2 340)",
  },
];

export function SearchPage({ onNavigate }: SearchPageProps) {
  const {
    allUsers,
    friendRequests,
    sendFriendRequest,
    theme,
    userLocation,
    currentUser,
  } = useApp();
  const [query, setQuery] = useState("");
  const isLight = theme === "light-clean";

  void currentUser;

  const hasQuery = query.trim().length > 0;

  const results = hasQuery
    ? allUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          u.id.toLowerCase().includes(query.toLowerCase()) ||
          u.displayName.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  const getRequestStatus = (toId: string) => {
    if (!currentUser) return null;
    const req = friendRequests.find(
      (r) => r.fromId === currentUser.id && r.toId === toId,
    );
    return req?.status || null;
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LiquidFluxBg />
      <div
        className="page-enter"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 430,
          margin: "0 auto",
          padding: "0 16px",
          flex: 1,
          width: "100%",
          paddingBottom: 16,
        }}
      >
        <div style={{ paddingTop: 56, paddingBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: isLight ? "#111" : "white",
              margin: 0,
              marginBottom: 20,
              letterSpacing: -0.5,
            }}
          >
            Find People
          </h1>

          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.35)",
                zIndex: 1,
              }}
            />
            <Input
              data-ocid="search.search_input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or ID..."
              style={{
                paddingLeft: 42,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: isLight ? "#111" : "white",
                borderRadius: 14,
                height: 48,
              }}
            />
          </div>
        </div>

        {/* Empty state: show suggestions */}
        {!hasQuery && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 12,
                fontWeight: 600,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Suggestions
            </p>
            {SUGGESTIONS.map((s) => (
              <div
                key={s.label}
                className="glass-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  cursor: "default",
                  opacity: 0.85,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${s.color} / 0.15`,
                    border: `1px solid ${s.color} / 0.25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.color,
                    flexShrink: 0,
                    backgroundColor: `color-mix(in oklch, ${s.color} 15%, transparent)`,
                    borderColor: `color-mix(in oklch, ${s.color} 30%, transparent)`,
                  }}
                >
                  {s.icon}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 500,
                    color: isLight ? "#333" : "rgba(255,255,255,0.75)",
                  }}
                >
                  {s.label}
                </p>
              </div>
            ))}
            <div
              style={{
                textAlign: "center",
                padding: "24px 20px 8px",
                color: "rgba(255,255,255,0.25)",
                fontSize: 13,
              }}
            >
              <Search size={28} style={{ marginBottom: 8, opacity: 0.25 }} />
              <p style={{ margin: 0 }}>Type a name or username to search</p>
            </div>
          </div>
        )}

        {/* Search results */}
        {hasQuery && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {results.length === 0 ? (
              <div
                data-ocid="search.empty_state"
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <Search size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>No users found for &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              results.map((user, i) => {
                const status = getRequestStatus(user.id);
                const dist =
                  userLocation && user.lat && user.lng
                    ? getDistanceMeters(
                        userLocation.lat,
                        userLocation.lng,
                        user.lat,
                        user.lng,
                      )
                    : null;
                return (
                  <div
                    key={user.id}
                    data-ocid={`search.item.${i + 1}`}
                    className="glass-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: user.isBot
                          ? "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.15 180))"
                          : `linear-gradient(135deg, oklch(0.5 0.25 ${200 + i * 35}), oklch(0.65 0.2 ${250 + i * 35}))`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {user.displayName[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 14,
                          color: isLight ? "#111" : "white",
                        }}
                      >
                        {user.displayName}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color: "rgba(255,255,255,0.4)",
                          }}
                        >
                          @{user.username}
                        </p>
                        {dist !== null && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "oklch(0.75 0.18 160)",
                              background: "oklch(0.75 0.18 160 / 0.12)",
                              border: "1px solid oklch(0.75 0.18 160 / 0.25)",
                              borderRadius: 6,
                              padding: "1px 6px",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            <MapPin size={8} />
                            {formatDistance(dist)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!user.isBot && (
                      <Button
                        data-ocid={`search.item.${i + 1}.button`}
                        onClick={() => !status && sendFriendRequest(user.id)}
                        disabled={!!status}
                        size="sm"
                        style={{
                          borderRadius: 10,
                          background:
                            status === "pending"
                              ? "rgba(255,255,255,0.07)"
                              : "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                          border:
                            status === "pending"
                              ? "1px solid rgba(255,255,255,0.15)"
                              : "none",
                          color: "white",
                          fontSize: 12,
                          padding: "6px 14px",
                          minWidth: 80,
                        }}
                      >
                        {status === "pending" ? (
                          <>
                            <Clock size={12} style={{ marginRight: 4 }} />
                            Pending
                          </>
                        ) : status === "accepted" ? (
                          <>
                            <Check size={12} style={{ marginRight: 4 }} />
                            Friends
                          </>
                        ) : (
                          <>
                            <UserPlus size={12} style={{ marginRight: 4 }} />
                            Add
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {/* Footer always at bottom, above BottomNav */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 80 }}>
        <DevFooter />
      </div>
      <BottomNav active="search" onNavigate={onNavigate} />
    </div>
  );
}
