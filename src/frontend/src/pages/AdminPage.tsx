import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Trash2, UserCheck } from "lucide-react";
import { useState } from "react";
import { BottomNav } from "../components/BottomNav";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { useApp } from "../context/AppContext";

interface AdminPageProps {
  onNavigate: (page: "friends" | "search" | "settings" | "admin") => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { allRealUsers, deleteUser, currentUser, theme } = useApp();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const isLight = theme === "light-clean";

  const displayUsers = allRealUsers.filter((u) => !u.isBot);

  const handleDelete = (userId: string) => {
    if (confirmDelete === userId) {
      deleteUser(userId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(userId);
    }
  };

  return (
    <div
      data-ocid="admin.page"
      style={{ position: "relative", minHeight: "100dvh", paddingBottom: 80 }}
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
        }}
      >
        {/* Header */}
        <div style={{ paddingTop: 56, paddingBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={18} style={{ color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: isLight ? "#111" : "white",
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                Admin Portal
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                {displayUsers.length} registered accounts
              </p>
            </div>
          </div>
        </div>

        {/* Users list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayUsers.length === 0 ? (
            <div
              data-ocid="admin.empty_state"
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <UserCheck size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No registered users yet.</p>
            </div>
          ) : (
            displayUsers.map((user, i) => {
              const isMe = user.id === currentUser?.id;
              const isAdmin = user.id === "admin_001";
              const isPendingDelete = confirmDelete === user.id;
              return (
                <div
                  key={user.id}
                  data-ocid={`admin.user.item.${i + 1}`}
                  className="glass-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    border: isPendingDelete
                      ? "1px solid oklch(0.6 0.25 30 / 0.5)"
                      : undefined,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: isAdmin
                        ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                        : `linear-gradient(135deg, oklch(0.5 0.25 ${200 + i * 37}), oklch(0.65 0.2 ${250 + i * 37}))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 17,
                      color: "white",
                      flexShrink: 0,
                    }}
                  >
                    {user.displayName[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: isLight ? "#111" : "white",
                        }}
                      >
                        {user.displayName}
                      </span>
                      {isAdmin && (
                        <span
                          style={{
                            fontSize: 10,
                            background: "oklch(0.45 0.25 30 / 0.3)",
                            color: "oklch(0.75 0.2 50)",
                            border: "1px solid oklch(0.6 0.2 50 / 0.3)",
                            borderRadius: 6,
                            padding: "1px 6px",
                          }}
                        >
                          ADMIN
                        </span>
                      )}
                      {isMe && (
                        <span
                          style={{
                            fontSize: 10,
                            background: "rgba(128,200,255,0.15)",
                            color: "oklch(0.8 0.15 200)",
                            border: "1px solid oklch(0.8 0.15 200 / 0.3)",
                            borderRadius: 6,
                            padding: "1px 6px",
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      @{user.username} · {user.id}
                    </p>
                    {user.createdAt && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 10,
                          color: isLight ? "#aaa" : "rgba(255,255,255,0.25)",
                        }}
                      >
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  {!isAdmin ? (
                    <Button
                      data-ocid={`admin.user.delete_button.${i + 1}`}
                      onClick={() => handleDelete(user.id)}
                      size="sm"
                      style={{
                        borderRadius: 10,
                        background: isPendingDelete
                          ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                          : "rgba(255,80,80,0.1)",
                        border: isPendingDelete
                          ? "none"
                          : "1px solid rgba(255,80,80,0.25)",
                        color: isPendingDelete ? "white" : "oklch(0.7 0.2 30)",
                        fontSize: 12,
                        padding: "6px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      {isPendingDelete ? (
                        <>
                          <AlertTriangle size={12} />
                          Confirm
                        </>
                      ) : (
                        <>
                          <Trash2 size={12} />
                          Delete
                        </>
                      )}
                    </Button>
                  ) : (
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.2)",
                        padding: "6px 8px",
                      }}
                    >
                      Protected
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {confirmDelete && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(255,80,80,0.08)",
              border: "1px solid rgba(255,80,80,0.2)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "oklch(0.7 0.2 30)",
            }}
          >
            <AlertTriangle size={14} />
            Tap Confirm again to permanently delete this account.
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.3)",
                fontSize: 12,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <BottomNav active="admin" onNavigate={onNavigate} />
    </div>
  );
}
