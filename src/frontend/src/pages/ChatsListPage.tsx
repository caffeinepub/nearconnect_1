import { MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarCircle } from "../components/AvatarCircle";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import type { ProfileUser } from "../components/UserProfileSheet";
import { UserProfileSheet } from "../components/UserProfileSheet";
import { VipBadge } from "../components/VipBadge";
import { createActorWithConfig } from "../config";
import { useApp } from "../context/AppContext";

interface ChatsListPageProps {
  onNavigate: (
    page: "friends" | "chats" | "search" | "settings" | "admin",
  ) => void;
  onOpenChat: (friendId: string) => void;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ChatsListPage({ onNavigate, onOpenChat }: ChatsListPageProps) {
  const {
    friends,
    getConversation,
    theme,
    currentUser,
    deleteConversation,
    deletedConversationIds,
    incomingFriendRequests,
  } = useApp();
  const isLight = theme === "light-clean";
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileUser | null>(
    null,
  );

  // All friends+bot that have at least one message
  const chatsWithMessages = friends
    .map((f) => {
      const msgs = getConversation(f.id);
      return { friend: f, msgs };
    })
    .filter(
      ({ friend, msgs }) =>
        msgs.length > 0 && !deletedConversationIds.has(friend.id),
    )
    .sort((a, b) => {
      const aLast = a.msgs[a.msgs.length - 1]?.timestamp ?? 0;
      const bLast = b.msgs[b.msgs.length - 1]?.timestamp ?? 0;
      return bLast - aLast;
    });

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

  const handleDeleteConversation = (friendId: string) => {
    deleteConversation(friendId);
    setConfirmDelete(null);
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
        <div style={{ paddingTop: 56, paddingBottom: 16 }}>
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
            Chats
          </h1>
          <p
            style={{
              color: isLight ? "#666" : "rgba(255,255,255,0.45)",
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {chatsWithMessages.length} conversation
            {chatsWithMessages.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Chat list */}
        {chatsWithMessages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            <MessageCircle
              size={48}
              style={{ marginBottom: 16, opacity: 0.25 }}
            />
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
              No chats yet
            </p>
            <p style={{ fontSize: 13, opacity: 0.7 }}>
              Go to Friends to start a conversation
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {chatsWithMessages.map(({ friend, msgs }, i) => {
              const lastMsg = msgs[msgs.length - 1];
              const unread = unreadCounts[friend.id] ?? 0;
              const preview =
                lastMsg.text.length > 45
                  ? `${lastMsg.text.slice(0, 45)}...`
                  : lastMsg.text;

              return (
                <div key={friend.id} style={{ position: "relative" }}>
                  <button
                    type="button"
                    data-ocid={`chats.item.${i + 1}`}
                    onClick={() => onOpenChat(friend.id)}
                    className="glass-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "13px 16px",
                      cursor: "pointer",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      transition: "transform 0.15s",
                      paddingRight: 44,
                    }}
                  >
                    {/* Avatar -- tappable to view profile */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!friend.isBot) {
                          setSelectedProfile({
                            id: friend.id,
                            username: friend.username,
                            displayName: friend.displayName,
                            avatar: friend.avatar,
                            vipStatus: friend.vipStatus,
                            online: friend.online,
                            lastSeen: friend.lastSeen,
                            radiusTier: "free",
                          });
                        }
                      }}
                      style={{
                        cursor: friend.isBot ? "default" : "pointer",
                        flexShrink: 0,
                        background: "none",
                        border: "none",
                        padding: 0,
                      }}
                    >
                      <AvatarCircle
                        avatar={friend.avatar}
                        displayName={friend.displayName}
                        size={50}
                        isBot={friend.isBot}
                        colorIndex={i}
                        online={friend.online}
                      />
                    </button>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 3,
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
                              fontWeight: unread > 0 ? 700 : 600,
                              fontSize: 15,
                              color: isLight ? "#111" : "white",
                            }}
                          >
                            {friend.displayName}
                          </span>
                          <VipBadge status={friend.vipStatus} />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color:
                              unread > 0
                                ? "oklch(0.8 0.15 200)"
                                : "rgba(255,255,255,0.35)",
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        >
                          {formatTime(lastMsg.timestamp)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color:
                              unread > 0
                                ? isLight
                                  ? "#333"
                                  : "rgba(255,255,255,0.7)"
                                : isLight
                                  ? "#888"
                                  : "rgba(255,255,255,0.38)",
                            fontWeight: unread > 0 ? 500 : 400,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {lastMsg.senderId === currentUser?.id ? "You: " : ""}
                          {preview}
                        </p>
                        {unread > 0 && (
                          <span
                            style={{
                              marginLeft: 8,
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
                              flexShrink: 0,
                              animation: "badgePulse 1.5s ease-in-out infinite",
                              boxShadow: "0 0 8px oklch(0.6 0.28 25 / 0.6)",
                            }}
                          >
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(friend.id)}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "rgba(255,255,255,0.25)",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>

                  {/* Delete confirm dialog */}
                  {confirmDelete === friend.id && (
                    <div
                      style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 200,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 24,
                      }}
                      onClick={() => setConfirmDelete(null)}
                      onKeyDown={(e) =>
                        e.key === "Escape" && setConfirmDelete(null)
                      }
                      role="presentation"
                    >
                      <div
                        style={{
                          background: "oklch(0.12 0.02 260)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 16,
                          padding: "24px",
                          maxWidth: 320,
                          width: "100%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="presentation"
                      >
                        <p
                          style={{
                            color: "white",
                            fontWeight: 600,
                            marginBottom: 8,
                            fontSize: 16,
                          }}
                        >
                          Delete conversation?
                        </p>
                        <p
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 13,
                            marginBottom: 20,
                          }}
                        >
                          This will clear all messages with {friend.displayName}
                          .
                        </p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            style={{
                              flex: 1,
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: 10,
                              color: "white",
                              padding: "10px",
                              cursor: "pointer",
                              fontSize: 14,
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteConversation(friend.id)}
                            style={{
                              flex: 1,
                              background: "oklch(0.45 0.22 25)",
                              border: "none",
                              borderRadius: 10,
                              color: "white",
                              padding: "10px",
                              cursor: "pointer",
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingBottom: 80 }}>
        <DevFooter />
      </div>
      <BottomNav
        active="chats"
        onNavigate={onNavigate}
        friendRequestCount={incomingFriendRequests.length}
      />

      {selectedProfile && (
        <UserProfileSheet
          user={selectedProfile}
          isOwnProfile={false}
          onClose={() => setSelectedProfile(null)}
          onChat={() => {
            onOpenChat(selectedProfile.id);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
}
