import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCw,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarCircle } from "../components/AvatarCircle";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import type { ProfileUser } from "../components/UserProfileSheet";
import { UserProfileSheet } from "../components/UserProfileSheet";
import { VipBadge } from "../components/VipBadge";
import {
  type FriendUser,
  formatDistance,
  getDistanceMeters,
  useApp,
} from "../context/AppContext";

type FriendsTab = "friends" | "requests";

interface FriendsPageProps {
  onNavigate: (
    page: "friends" | "chats" | "search" | "settings" | "admin",
  ) => void;
  onOpenChat: (friendId: string) => void;
}

export function FriendsPage({ onNavigate, onOpenChat }: FriendsPageProps) {
  const {
    friends,
    radiusLabel,
    theme,
    userLocation,
    refreshFriends,
    incomingFriendRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    allRealUsers,
    mutualFriendIds,
    followingUsernames,
    sendFriendRequest,
    currentUser,
  } = useApp();

  const TIER_METERS: Record<string, number> = {
    free: 500,
    basic: 1000,
    standard: 5000,
    premium: 10000,
  };
  const maxMeters = TIER_METERS[currentUser?.radiusTier || "free"] ?? 500;

  const isWithinRadius = (f: FriendUser): boolean => {
    if (f.isBot) return true;
    if (!userLocation || f.lat == null || f.lng == null) return true;
    const dist = getDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      f.lat,
      f.lng,
    );
    return dist <= maxMeters;
  };

  const isLight = theme === "light-clean";
  const followingSet = new Set(followingUsernames);
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");

  // Only show users within the selected radius tier
  const mutualAndBot = friends.filter(
    (f) => f.isBot || (mutualFriendIds.has(f.id) && isWithinRadius(f)),
  );
  const nearbyPeople = friends.filter(
    (f) => !f.isBot && !mutualFriendIds.has(f.id) && isWithinRadius(f),
  );
  const [locationRequested, setLocationRequested] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(new Set());
  const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
  const [selectedProfile, setSelectedProfile] = useState<ProfileUser | null>(
    null,
  );

  // Find full user objects for incoming requests
  const incomingUsers = incomingFriendRequests
    .map((id) => {
      const u =
        allRealUsers.find((u) => u.id === id) ||
        friends.find((f) => f.id === id);
      return u as
        | { id: string; displayName: string; username: string }
        | undefined;
    })
    .filter(Boolean) as Array<{
    id: string;
    displayName: string;
    username: string;
  }>;

  // Auto-switch to requests tab when there are new requests
  useEffect(() => {
    if (incomingFriendRequests.length > 0) {
      // Don't auto-switch, just show badge
    }
  }, [incomingFriendRequests.length]);

  const handleRequestLocation = () => {
    setLocationRequested(true);
    navigator.geolocation.getCurrentPosition(
      () => {},
      () => {},
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFriends();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAccept = async (userId: string) => {
    setAcceptingIds((prev) => new Set(prev).add(userId));
    try {
      await acceptFriendRequest(userId);
    } finally {
      setAcceptingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleReject = async (userId: string) => {
    setRejectingIds((prev) => new Set(prev).add(userId));
    try {
      await rejectFriendRequest(userId);
    } finally {
      setRejectingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1.01)";
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = "scale(1)";
  };

  const openProfile = (friend: FriendUser, distance?: number | null) => {
    const fullUser = allRealUsers.find((u) => u.id === friend.id);
    setSelectedProfile({
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      avatar: friend.avatar,
      vipStatus: friend.vipStatus,
      bio: (fullUser as any)?.bio,
      userStatus: (fullUser as any)?.userStatus,
      radiusTier: fullUser ? (fullUser as any).radiusTier : "free",
      online: friend.online,
      lastSeen: friend.lastSeen,
      createdAt: fullUser?.createdAt,
      distance: distance ?? undefined,
    });
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
                Friends
              </h1>
              <p
                style={{
                  color: isLight ? "#666" : "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  marginTop: 2,
                }}
              >
                {mutualAndBot.filter((f) => f.online).length} online now
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

        {/* Tab switcher: Friends | Requests */}
        <div
          style={{
            display: "flex",
            gap: 0,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 14,
            padding: 4,
            marginBottom: 18,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
              background:
                activeTab === "friends"
                  ? "rgba(128,200,255,0.18)"
                  : "transparent",
              color:
                activeTab === "friends"
                  ? "oklch(0.82 0.15 200)"
                  : "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <UserCheck size={14} />
            Friends
            <span
              style={{
                background:
                  activeTab === "friends"
                    ? "rgba(128,200,255,0.25)"
                    : "rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "1px 7px",
                fontSize: 11,
              }}
            >
              {mutualAndBot.filter((f) => !f.isBot).length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              transition: "all 0.2s",
              background:
                activeTab === "requests"
                  ? "oklch(0.45 0.22 280 / 0.25)"
                  : "transparent",
              color:
                activeTab === "requests"
                  ? "oklch(0.78 0.18 280)"
                  : "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              position: "relative",
            }}
          >
            <UserPlus size={14} />
            Requests
            {incomingUsers.length > 0 && (
              <span
                style={{
                  background:
                    activeTab === "requests"
                      ? "oklch(0.55 0.25 280 / 0.5)"
                      : "oklch(0.55 0.25 280)",
                  borderRadius: 20,
                  padding: "1px 7px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "white",
                  animation:
                    activeTab !== "requests"
                      ? "badgePulse 1.5s ease-in-out infinite"
                      : undefined,
                  boxShadow:
                    activeTab !== "requests"
                      ? "0 0 8px oklch(0.55 0.25 280 / 0.7)"
                      : undefined,
                }}
              >
                {incomingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* FRIENDS TAB */}
        {activeTab === "friends" && (
          <>
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

            {/* Friends list - Online / Offline grouped */}
            {mutualAndBot.length === 0 ? (
              <div
                data-ocid="friends.empty_state"
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <MessageCircle
                  size={40}
                  style={{ marginBottom: 12, opacity: 0.3 }}
                />
                <p>
                  No friends yet.
                  <br />
                  Add nearby people below!
                </p>
              </div>
            ) : (
              <>
                {/* Online friends */}
                {mutualAndBot.filter((f) => f.online).length > 0 && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "oklch(0.7 0.22 140)",
                          boxShadow: "0 0 6px oklch(0.7 0.22 140 / 0.8)",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "oklch(0.75 0.2 140)",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        Online — {mutualAndBot.filter((f) => f.online).length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 20,
                      }}
                    >
                      {mutualAndBot
                        .filter((f) => f.online)
                        .map((friend, i) => {
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
                              data-ocid={`friends.item.online.${i + 1}`}
                              onClick={() => onOpenChat(friend.id)}
                              className="glass-card"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                padding: "14px 16px",
                                cursor: "pointer",
                                border: "1px solid oklch(0.7 0.22 140 / 0.2)",
                                width: "100%",
                                textAlign: "left",
                                transition: "transform 0.15s, box-shadow 0.15s",
                                position: "relative",
                              }}
                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={handleMouseLeave}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProfile(friend, dist);
                                }}
                                style={{
                                  position: "relative",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                }}
                              >
                                <AvatarCircle
                                  avatar={friend.avatar}
                                  displayName={friend.displayName}
                                  size={48}
                                  isBot={friend.isBot}
                                  colorIndex={i}
                                  online={friend.online}
                                />
                              </button>
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
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
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
                                    <VipBadge status={friend.vipStatus} />
                                  </div>
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
                                          background:
                                            "oklch(0.75 0.18 160 / 0.12)",
                                          border:
                                            "1px solid oklch(0.75 0.18 160 / 0.25)",
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
                                        borderColor:
                                          "oklch(0.7 0.22 140 / 0.4)",
                                        color: "oklch(0.75 0.2 140)",
                                      }}
                                    >
                                      Online
                                    </Badge>
                                  </div>
                                </div>
                                <p
                                  style={{
                                    margin: 0,
                                    marginTop: 3,
                                    fontSize: 13,
                                    color: isLight
                                      ? "#666"
                                      : "rgba(255,255,255,0.4)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  Tap to chat
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}

                {/* Offline friends */}
                {mutualAndBot.filter((f) => !f.online).length > 0 && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.25)",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.4)",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        Offline — {mutualAndBot.filter((f) => !f.online).length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      {mutualAndBot
                        .filter((f) => !f.online)
                        .map((friend, i) => {
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
                              data-ocid={`friends.item.offline.${i + 1}`}
                              onClick={() => onOpenChat(friend.id)}
                              className="glass-card"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                padding: "14px 16px",
                                cursor: "pointer",
                                border: "1px solid rgba(255,255,255,0.06)",
                                width: "100%",
                                textAlign: "left",
                                transition: "transform 0.15s, box-shadow 0.15s",
                                position: "relative",
                                opacity: 0.75,
                              }}
                              onMouseEnter={handleMouseEnter}
                              onMouseLeave={handleMouseLeave}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProfile(friend, dist);
                                }}
                                style={{
                                  position: "relative",
                                  flexShrink: 0,
                                  cursor: "pointer",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                }}
                              >
                                <AvatarCircle
                                  avatar={friend.avatar}
                                  displayName={friend.displayName}
                                  size={48}
                                  isBot={friend.isBot}
                                  colorIndex={i}
                                  online={false}
                                />
                              </button>
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
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        fontSize: 15,
                                        color: isLight
                                          ? "#444"
                                          : "rgba(255,255,255,0.65)",
                                      }}
                                    >
                                      {friend.displayName}
                                    </span>
                                    <VipBadge status={friend.vipStatus} />
                                  </div>
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
                                          background:
                                            "oklch(0.75 0.18 160 / 0.12)",
                                          border:
                                            "1px solid oklch(0.75 0.18 160 / 0.25)",
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
                                        borderColor: "rgba(255,255,255,0.12)",
                                        color: "rgba(255,255,255,0.3)",
                                      }}
                                    >
                                      {friend.lastSeen || "Offline"}
                                    </Badge>
                                  </div>
                                </div>
                                <p
                                  style={{
                                    margin: 0,
                                    marginTop: 3,
                                    fontSize: 13,
                                    color: isLight
                                      ? "#999"
                                      : "rgba(255,255,255,0.3)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  Tap to chat
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Nearby People section */}
            {nearbyPeople.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <UserPlus
                    size={15}
                    style={{ color: "oklch(0.78 0.18 200)" }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: isLight ? "#333" : "rgba(255,255,255,0.65)",
                      letterSpacing: 0.3,
                    }}
                  >
                    Nearby People
                  </span>
                  <span
                    style={{
                      background: "oklch(0.55 0.2 200 / 0.2)",
                      border: "1px solid oklch(0.65 0.18 200 / 0.35)",
                      borderRadius: 20,
                      padding: "1px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "oklch(0.75 0.18 200)",
                    }}
                  >
                    {nearbyPeople.length}
                  </span>
                  {nearbyPeople.filter((p) => p.online).length > 0 && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        color: "oklch(0.75 0.2 140)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "oklch(0.7 0.22 140)",
                          boxShadow: "0 0 4px oklch(0.7 0.22 140 / 0.8)",
                          display: "inline-block",
                        }}
                      />
                      {nearbyPeople.filter((p) => p.online).length} online
                    </span>
                  )}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {nearbyPeople.map((person, i) => {
                    const isPending = followingSet.has(person.username);
                    return (
                      <div
                        key={person.id}
                        data-ocid={`friends.nearby.${i + 1}`}
                        className="glass-card"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const dist2 =
                              userLocation &&
                              person.lat !== undefined &&
                              person.lng !== undefined
                                ? getDistanceMeters(
                                    userLocation.lat,
                                    userLocation.lng,
                                    person.lat,
                                    person.lng,
                                  )
                                : undefined;
                            openProfile(person, dist2);
                          }}
                          style={{
                            cursor: "pointer",
                            flexShrink: 0,
                            background: "none",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          <AvatarCircle
                            avatar={person.avatar}
                            displayName={person.displayName}
                            size={42}
                            colorIndex={i}
                            online={person.online}
                          />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 600,
                                fontSize: 14,
                                color: isLight ? "#111" : "white",
                              }}
                            >
                              {person.displayName}
                            </p>
                            <VipBadge status={person.vipStatus} />
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              color: "rgba(255,255,255,0.4)",
                            }}
                          >
                            @{person.username}
                          </p>
                          {userLocation &&
                            person.lat !== undefined &&
                            person.lng !== undefined && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "rgba(99,179,237,0.75)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                  marginTop: 2,
                                }}
                              >
                                <MapPin size={10} />
                                {formatDistance(
                                  getDistanceMeters(
                                    userLocation.lat,
                                    userLocation.lng,
                                    person.lat,
                                    person.lng,
                                  ),
                                )}
                              </p>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => onOpenChat(person.id)}
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 10,
                              padding: "7px 12px",
                              color: "rgba(255,255,255,0.8)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <MessageCircle size={13} />
                            Chat
                          </button>
                          {isPending ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                borderRadius: 10,
                                padding: "7px 12px",
                                color: "rgba(255,255,255,0.45)",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              <Clock size={12} />
                              Pending
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-ocid={`friends.nearby.${i + 1}.add`}
                              onClick={() => sendFriendRequest(person.id)}
                              style={{
                                background:
                                  "linear-gradient(135deg, oklch(0.5 0.2 200), oklch(0.65 0.15 240))",
                                border: "none",
                                borderRadius: 10,
                                padding: "7px 14px",
                                color: "white",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                boxShadow:
                                  "0 2px 10px oklch(0.65 0.15 200 / 0.35)",
                              }}
                            >
                              Add Friend
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div>
            {incomingUsers.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <UserCheck
                  size={48}
                  style={{ marginBottom: 16, opacity: 0.25 }}
                />
                <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
                  No pending requests
                </p>
                <p style={{ fontSize: 13, opacity: 0.7 }}>
                  When someone adds you, they'll appear here
                </p>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {incomingUsers.map((user, i) => (
                  <div
                    key={user.id}
                    data-ocid={`requests.item.${i + 1}`}
                    className="glass-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      border: "1px solid oklch(0.65 0.22 280 / 0.25)",
                      background: "oklch(0.55 0.2 280 / 0.06)",
                    }}
                  >
                    <AvatarCircle
                      avatar={
                        (allRealUsers.find((u) => u.id === user.id) as any)
                          ?.avatar
                      }
                      displayName={user.displayName}
                      size={48}
                      colorIndex={i}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 15,
                          color: isLight ? "#111" : "white",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {user.displayName}
                          <VipBadge
                            status={
                              (
                                allRealUsers.find(
                                  (u) => u.id === user.id,
                                ) as any
                              )?.vipStatus
                            }
                          />
                        </span>
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 2,
                        }}
                      >
                        @{user.username}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          color: "oklch(0.72 0.15 280)",
                          marginTop: 3,
                        }}
                      >
                        Wants to be your friend
                      </p>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <button
                        type="button"
                        data-ocid={`requests.item.${i + 1}.accept`}
                        onClick={() => handleAccept(user.id)}
                        disabled={acceptingIds.has(user.id)}
                        style={{
                          background: acceptingIds.has(user.id)
                            ? "rgba(255,255,255,0.1)"
                            : "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 240))",
                          border: "none",
                          borderRadius: 10,
                          padding: "8px 18px",
                          color: "white",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: acceptingIds.has(user.id)
                            ? "not-allowed"
                            : "pointer",
                          whiteSpace: "nowrap",
                          boxShadow: acceptingIds.has(user.id)
                            ? "none"
                            : "0 2px 10px oklch(0.65 0.2 280 / 0.4)",
                          transition: "all 0.2s",
                        }}
                      >
                        {acceptingIds.has(user.id) ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        type="button"
                        data-ocid={`requests.item.${i + 1}.reject`}
                        onClick={() => handleReject(user.id)}
                        disabled={
                          rejectingIds.has(user.id) || acceptingIds.has(user.id)
                        }
                        style={{
                          background: "rgba(255,80,80,0.15)",
                          border: "1px solid rgba(255,80,80,0.3)",
                          borderRadius: 10,
                          padding: "8px 18px",
                          color: "oklch(0.75 0.2 25)",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: rejectingIds.has(user.id)
                            ? "not-allowed"
                            : "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.2s",
                          opacity: rejectingIds.has(user.id) ? 0.6 : 1,
                        }}
                      >
                        {rejectingIds.has(user.id) ? "Rejecting..." : "Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingBottom: 80 }}>
        <DevFooter />
      </div>

      {selectedProfile && (
        <UserProfileSheet
          user={selectedProfile}
          isOwnProfile={false}
          onClose={() => setSelectedProfile(null)}
          onChat={() => {
            onOpenChat(selectedProfile.id);
            setSelectedProfile(null);
          }}
          onAddFriend={
            !mutualFriendIds.has(selectedProfile.id) &&
            !followingSet.has(selectedProfile.id)
              ? () => {
                  sendFriendRequest(selectedProfile.id);
                  setSelectedProfile(null);
                }
              : undefined
          }
          isFriendPending={followingSet.has(selectedProfile.id)}
          isMutualFriend={mutualFriendIds.has(selectedProfile.id)}
        />
      )}
      <BottomNav
        active="friends"
        onNavigate={onNavigate}
        friendRequestCount={incomingFriendRequests.length}
      />
    </div>
  );
}
