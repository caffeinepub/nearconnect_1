import { Badge } from "@/components/ui/badge";
import { MapPin, MessageCircle, Navigation, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { createActorWithConfig } from "../config";
import {
  type FriendUser,
  formatDistance,
  getDistanceMeters,
  useApp,
} from "../context/AppContext";

interface FriendsPageProps {
  onNavigate: (page: "friends" | "search" | "settings" | "admin") => void;
  onOpenChat: (friendId: string) => void;
}

function getLastMessage(
  friend: FriendUser,
  getConv: (id: string) => { text: string }[],
): string {
  const msgs = getConv(friend.id);
  if (!msgs.length)
    return friend.isBot ? "Ask me anything!" : "No messages yet";
  const last = msgs[msgs.length - 1];
  return last.text.length > 40 ? `${last.text.slice(0, 40)}...` : last.text;
}

export function FriendsPage({ onNavigate, onOpenChat }: FriendsPageProps) {
  const {
    friends,
    radiusLabel,
    getConversation,
    theme,
    userLocation,
    refreshFriends,
    currentUser,
  } = useApp();
  const isLight = theme === "light-clean";
  const [locationRequested, setLocationRequested] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentUser?.id || !friends.length) return;
    let cancelled = false;
    const fetchCounts = async () => {
      try {
        const actor = await createActorWithConfig();
        const results = await Promise.all(
          friends
            .filter((f) => !f.isBot)
            .map(async (f) => {
              const count = await actor.getUnreadCount(currentUser.id, f.id);
              return [f.id, Number(count)] as [string, number];
            }),
        );
        if (!cancelled) {
          setUnreadCounts(Object.fromEntries(results));
        }
      } catch {
        // silent
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id, friends]);

  const handleRequestLocation = () => {
    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshFriends();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1.01)";
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
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
        {/* Header */}
        <div style={{ paddingTop: 56, paddingBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: isLight ? "#111" : "white",
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                Nearby Friends
              </h1>
              <p
                style={{
                  color: isLight ? "#666" : "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {friends.filter((f) => f.online).length} online now
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Refresh button */}
              <button
                type="button"
                data-ocid="friends.refresh.button"
                onClick={handleRefresh}
                title="Refresh friends"
                style={{
                  background: "rgba(128,200,255,0.12)",
                  border: "1px solid rgba(128,200,255,0.2)",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "oklch(0.8 0.15 200)",
                  transition: "background 0.15s",
                }}
              >
                <RefreshCw
                  size={15}
                  style={{
                    transition: "transform 0.6s ease",
                    transform: isRefreshing ? "rotate(360deg)" : "rotate(0deg)",
                  }}
                />
              </button>
              {/* Radius badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(128,200,255,0.15)",
                  borderRadius: 20,
                  padding: "6px 12px",
                }}
              >
                <MapPin size={13} style={{ color: "oklch(0.8 0.15 200)" }} />
                <span
                  style={{
                    color: "oklch(0.8 0.15 200)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {radiusLabel} radius
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location permission banner */}
        {!userLocation && !locationRequested && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "rgba(128,200,255,0.08)",
              border: "1px solid rgba(128,200,255,0.2)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Navigation
              size={16}
              style={{ color: "oklch(0.8 0.15 200)", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: isLight ? "#333" : "rgba(255,255,255,0.8)",
                  fontWeight: 500,
                }}
              >
                Enable live location
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                See how far away your friends are in real time
              </p>
            </div>
            <button
              type="button"
              data-ocid="friends.location.button"
              onClick={handleRequestLocation}
              style={{
                background: "oklch(0.5 0.2 200 / 0.3)",
                border: "1px solid oklch(0.8 0.15 200 / 0.4)",
                borderRadius: 10,
                padding: "6px 12px",
                color: "oklch(0.8 0.15 200)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Allow
            </button>
          </div>
        )}

        {/* Friends list */}
        {friends.length === 0 ? (
          <div
            data-ocid="friends.empty_state"
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <MessageCircle
              size={40}
              style={{ marginBottom: 12, opacity: 0.3 }}
            />
            <p>
              No friends nearby yet.
              <br />
              Search to find and add friends!
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {friends.map((friend, i) => {
              const dist =
                userLocation && friend.lat && friend.lng
                  ? getDistanceMeters(
                      userLocation.lat,
                      userLocation.lng,
                      friend.lat,
                      friend.lng,
                    )
                  : null;
              return (
                <button
                  type="button"
                  key={friend.id}
                  data-ocid={`friends.item.${i + 1}`}
                  onClick={() => onOpenChat(friend.id)}
                  className="glass-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    cursor: "pointer",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: friend.isBot
                          ? "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.15 180))"
                          : `linear-gradient(135deg, oklch(0.5 0.25 ${200 + i * 40}), oklch(0.65 0.2 ${260 + i * 40}))`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 18,
                        color: "white",
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      {friend.displayName[0]}
                    </div>
                    {friend.online && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 1,
                          right: 1,
                          width: 11,
                          height: 11,
                          borderRadius: "50%",
                          background: "oklch(0.75 0.2 140)",
                          border: "2px solid rgba(10,10,26,0.9)",
                        }}
                      />
                    )}
                  </div>
                  {/* Unread badge */}
                  {(unreadCounts[friend.id] ?? 0) > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 12,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "oklch(0.6 0.28 25)",
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 5px",
                        animation: "badgePulse 1.5s ease-in-out infinite",
                        boxShadow: "0 0 10px oklch(0.6 0.28 25 / 0.7)",
                      }}
                    >
                      {(unreadCounts[friend.id] ?? 0) > 99
                        ? "99+"
                        : unreadCounts[friend.id]}
                    </div>
                  )}
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: isLight ? "#111" : "white",
                        }}
                      >
                        {friend.displayName}
                      </span>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
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
                        <Badge
                          variant="outline"
                          style={{
                            fontSize: 10,
                            padding: "1px 8px",
                            borderColor: "rgba(255,255,255,0.15)",
                            color: friend.online
                              ? "oklch(0.75 0.2 140)"
                              : "rgba(255,255,255,0.3)",
                          }}
                        >
                          {friend.online
                            ? "Online"
                            : friend.lastSeen || "Offline"}
                        </Badge>
                      </div>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        marginTop: 3,
                        fontSize: 13,
                        color: isLight ? "#666" : "rgba(255,255,255,0.4)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {getLastMessage(friend, getConversation)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {/* Footer always at bottom, above BottomNav */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 80 }}>
        <DevFooter />
      </div>
      <BottomNav active="friends" onNavigate={onNavigate} />
    </div>
  );
}
