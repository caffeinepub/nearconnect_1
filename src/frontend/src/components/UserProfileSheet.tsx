import {
  Calendar,
  MapPin,
  MessageCircle,
  ShieldOff,
  UserPlus,
  Wifi,
  X,
} from "lucide-react";
import { RADIUS_LABELS } from "../context/AppContext";
import type { RadiusTier } from "../context/AppContext";
import { AvatarCircle } from "./AvatarCircle";
import { VipBadge } from "./VipBadge";

export interface ProfileUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  vipStatus?: string;
  bio?: string;
  userStatus?: string;
  radiusTier?: string;
  online?: boolean;
  lastSeen?: string;
  createdAt?: number;
  distance?: number;
}

interface UserProfileSheetProps {
  user: ProfileUser;
  isOwnProfile?: boolean;
  onClose: () => void;
  onChat?: () => void;
  onAddFriend?: () => void;
  onBlock?: () => void;
  onEditProfile?: () => void;
  isFriendPending?: boolean;
  isMutualFriend?: boolean;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

function formatDate(ts?: number): string {
  if (!ts) return "Unknown";
  return new Date(ts).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  online: { label: "Online", color: "oklch(0.72 0.22 140)" },
  busy: { label: "Busy", color: "oklch(0.72 0.22 70)" },
  away: { label: "Away", color: "oklch(0.72 0.18 50)" },
};

export function UserProfileSheet({
  user,
  isOwnProfile = false,
  onClose,
  onChat,
  onAddFriend,
  onBlock,
  onEditProfile,
  isFriendPending = false,
  isMutualFriend = false,
}: UserProfileSheetProps) {
  const statusConfig = STATUS_CONFIG[user.userStatus || "online"];
  const tierLabel = RADIUS_LABELS[(user.radiusTier as RadiusTier) || "free"];

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        data-ocid="profile.sheet"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 500,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          zIndex: 501,
          background: "rgba(14,14,28,0.97)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.1)",
          borderBottom: "none",
          boxShadow: "0 -20px 60px rgba(0,0,0,0.6)",
          padding: "0 0 40px",
          animation: "slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.18)",
            }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          data-ocid="profile.close_button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          <X size={16} />
        </button>

        {/* Gradient accent bar */}
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, oklch(0.55 0.28 280), oklch(0.65 0.22 195), oklch(0.65 0.2 340))",
            marginBottom: 24,
            opacity: 0.7,
          }}
        />

        {/* Avatar + name section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 24px",
            marginBottom: 24,
          }}
        >
          {/* Large avatar */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <AvatarCircle
              avatar={user.avatar}
              displayName={user.displayName}
              size={80}
              online={user.online}
            />
            {user.online && (
              <span
                style={{
                  position: "absolute",
                  bottom: 3,
                  right: 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "oklch(0.72 0.22 140)",
                  border: "3px solid rgba(14,14,28,0.97)",
                  animation: "onlinePulse 2s ease-in-out infinite",
                }}
              />
            )}
          </div>

          {/* Name + VIP */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 700,
                fontSize: 22,
                color: "white",
              }}
            >
              {user.displayName}
            </h2>
            <VipBadge status={user.vipStatus} />
          </div>

          {/* Username */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 10,
            }}
          >
            @{user.username}
          </p>

          {/* Bio */}
          {user.bio && (
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                textAlign: "center",
                lineHeight: 1.5,
                maxWidth: 280,
              }}
            >
              {user.bio}
            </p>
          )}

          {/* Status row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Online/offline */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: user.online
                  ? "oklch(0.72 0.22 140 / 0.12)"
                  : "rgba(255,255,255,0.06)",
                border: `1px solid ${user.online ? "oklch(0.72 0.22 140 / 0.3)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 20,
                padding: "4px 10px",
                fontSize: 12,
                color: user.online
                  ? "oklch(0.78 0.2 140)"
                  : "rgba(255,255,255,0.4)",
                fontWeight: 500,
              }}
            >
              <Wifi size={11} />
              {user.online ? "Online" : user.lastSeen || "Offline"}
            </span>

            {/* User status (busy/away/online label) */}
            {user.userStatus && user.userStatus !== "online" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: `${statusConfig.color} / 0.12`,
                  border: `1px solid ${statusConfig.color}`,
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: statusConfig.color,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: statusConfig.color,
                    flexShrink: 0,
                  }}
                />
                {statusConfig.label}
              </span>
            )}

            {/* Distance */}
            {user.distance !== undefined && user.distance !== null && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "oklch(0.65 0.18 200 / 0.12)",
                  border: "1px solid oklch(0.65 0.18 200 / 0.3)",
                  borderRadius: 20,
                  padding: "4px 10px",
                  fontSize: 12,
                  color: "oklch(0.78 0.15 200)",
                  fontWeight: 500,
                }}
              >
                <MapPin size={11} />
                {formatDistance(user.distance)}
              </span>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div
          style={{
            margin: "0 16px 20px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", flex: 1 }}
            >
              Radius Tier
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "oklch(0.78 0.15 200)",
                background: "oklch(0.65 0.18 200 / 0.12)",
                border: "1px solid oklch(0.65 0.18 200 / 0.3)",
                borderRadius: 8,
                padding: "2px 10px",
              }}
            >
              {tierLabel}
            </span>
          </div>

          {user.createdAt && (
            <div
              style={{
                display: "flex",
                padding: "12px 16px",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Calendar
                size={13}
                style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.38)",
                  flex: 1,
                }}
              >
                Member since
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                {formatDate(user.createdAt)}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div
          style={{
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {isOwnProfile ? (
            <button
              type="button"
              data-ocid="profile.edit_button"
              onClick={onEditProfile}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                border: "none",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: 0.2,
                boxShadow: "0 4px 20px oklch(0.55 0.25 280 / 0.35)",
              }}
            >
              ✏️ Edit Profile
            </button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10 }}>
                {onChat && (
                  <button
                    type="button"
                    data-ocid="profile.primary_button"
                    onClick={() => {
                      onChat();
                      onClose();
                    }}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                      border: "none",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                      boxShadow: "0 4px 16px oklch(0.55 0.25 280 / 0.35)",
                    }}
                  >
                    <MessageCircle size={16} />
                    Message
                  </button>
                )}
                {onAddFriend && (
                  <button
                    type="button"
                    data-ocid="profile.secondary_button"
                    onClick={() => {
                      onAddFriend();
                      onClose();
                    }}
                    disabled={isFriendPending || isMutualFriend}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 14,
                      background: isMutualFriend
                        ? "oklch(0.45 0.2 140 / 0.2)"
                        : isFriendPending
                          ? "rgba(255,255,255,0.07)"
                          : "rgba(128,200,255,0.12)",
                      border: isMutualFriend
                        ? "1px solid oklch(0.7 0.2 140 / 0.4)"
                        : isFriendPending
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "1px solid oklch(0.65 0.18 200 / 0.35)",
                      color: isMutualFriend
                        ? "oklch(0.75 0.2 140)"
                        : isFriendPending
                          ? "rgba(255,255,255,0.4)"
                          : "oklch(0.8 0.15 200)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor:
                        isFriendPending || isMutualFriend
                          ? "default"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 7,
                    }}
                  >
                    <UserPlus size={16} />
                    {isMutualFriend
                      ? "Friends"
                      : isFriendPending
                        ? "Pending"
                        : "Add Friend"}
                  </button>
                )}
              </div>
              {onBlock && (
                <button
                  type="button"
                  data-ocid="profile.delete_button"
                  onClick={() => {
                    onBlock();
                    onClose();
                  }}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 14,
                    background: "oklch(0.35 0.18 15 / 0.15)",
                    border: "1px solid oklch(0.5 0.2 15 / 0.25)",
                    color: "oklch(0.7 0.18 15)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                  }}
                >
                  <ShieldOff size={15} />
                  Block User
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateX(-50%) translateY(100%); }
          to { transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
