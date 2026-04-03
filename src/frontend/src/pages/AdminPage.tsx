import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Crown,
  Gift,
  History,
  LayoutDashboard,
  Loader2,
  Megaphone,
  RotateCcw,
  Send,
  Shield,
  ShoppingCart,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AvatarCircle } from "../components/AvatarCircle";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { VipBadge } from "../components/VipBadge";
import { createActorWithConfig } from "../config";
import { type RadiusTier, useApp } from "../context/AppContext";

interface AdminPageProps {
  onNavigate: (page: "friends" | "search" | "settings" | "admin") => void;
}

type TabId = "dashboard" | "users" | "purchases" | "broadcast";

const TIER_LABELS: Record<RadiusTier, string> = {
  free: "Free (500m)",
  basic: "Basic (1km)",
  standard: "Standard (5km)",
  premium: "Premium (10km)",
  banned: "Banned",
};

const TIER_BADGE_COLORS: Record<
  RadiusTier | "banned",
  { bg: string; color: string; border: string }
> = {
  free: {
    bg: "rgba(150,150,150,0.15)",
    color: "rgba(200,200,200,0.8)",
    border: "rgba(150,150,150,0.25)",
  },
  basic: {
    bg: "rgba(80,180,255,0.15)",
    color: "oklch(0.78 0.15 210)",
    border: "oklch(0.78 0.15 210 / 0.3)",
  },
  standard: {
    bg: "rgba(120,255,170,0.12)",
    color: "oklch(0.78 0.18 155)",
    border: "oklch(0.78 0.18 155 / 0.3)",
  },
  premium: {
    bg: "oklch(0.45 0.25 30 / 0.2)",
    color: "oklch(0.78 0.2 50)",
    border: "oklch(0.78 0.2 50 / 0.3)",
  },
  banned: {
    bg: "rgba(255,60,60,0.15)",
    color: "oklch(0.7 0.22 30)",
    border: "oklch(0.7 0.22 30 / 0.35)",
  },
};

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "users", label: "Users", icon: <Users size={16} /> },
  { id: "purchases", label: "Purchases", icon: <ShoppingCart size={16} /> },
  { id: "broadcast", label: "Broadcast", icon: <Megaphone size={16} /> },
];

export function AdminPage({ onNavigate }: AdminPageProps) {
  const {
    allRealUsers,
    deleteUser,
    currentUser,
    theme,
    purchaseSettings,
    savePurchaseSettings,
    grantPurchaseToUser,
    setVipStatus,
    refreshFriends,
  } = useApp();

  const isLight = theme === "light-clean";
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const displayUsers = allRealUsers.filter((u) => !u.isBot);

  // ── Users tab state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [grantTiers, setGrantTiers] = useState<Record<string, RadiusTier>>({});
  const [grantingUsers, setGrantingUsers] = useState<Record<string, boolean>>(
    {},
  );
  const [grantSuccess, setGrantSuccess] = useState<Record<string, boolean>>({});
  const [vipStatuses, setVipStatuses] = useState<Record<string, string>>({});
  const [settingVip, setSettingVip] = useState<Record<string, boolean>>({});
  const [vipSuccess, setVipSuccess] = useState<Record<string, boolean>>({});
  const [banningUsers, setBanningUsers] = useState<Record<string, boolean>>({});

  // ── Purchases tab state ────────────────────────────────────────────────────
  const [purchaseEnabled, setPurchaseEnabled] = useState(
    purchaseSettings?.enabled ?? true,
  );
  const [basicPrice, setBasicPrice] = useState(
    purchaseSettings
      ? (Number(purchaseSettings.basicPrice) / 100).toFixed(2)
      : "99.00",
  );
  const [standardPrice, setStandardPrice] = useState(
    purchaseSettings
      ? (Number(purchaseSettings.standardPrice) / 100).toFixed(2)
      : "299.00",
  );
  const [premiumPrice, setPremiumPrice] = useState(
    purchaseSettings
      ? (Number(purchaseSettings.premiumPrice) / 100).toFixed(2)
      : "499.00",
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  // ── Broadcast tab state ────────────────────────────────────────────────────
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [latestBroadcast, setLatestBroadcast] = useState<{
    text: string;
    timestamp: bigint;
  } | null>(null);

  useEffect(() => {
    if (activeTab === "broadcast") {
      createActorWithConfig()
        .then((actor) => {
          actor
            .getLatestBroadcast()
            .then((result: { text: string; timestamp: bigint } | null) => {
              if (result) setLatestBroadcast(result);
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = (userId: string) => {
    if (confirmDelete === userId) {
      deleteUser(userId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(userId);
    }
  };

  const handleGrantPurchase = async (userId: string) => {
    const tier = grantTiers[userId] || "basic";
    setGrantingUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      await grantPurchaseToUser(userId, tier);
      setGrantSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(
        () => setGrantSuccess((prev) => ({ ...prev, [userId]: false })),
        2500,
      );
    } catch {
      /* silent */
    } finally {
      setGrantingUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleSetVipStatus = async (userId: string) => {
    const status = vipStatuses[userId] ?? "none";
    setSettingVip((prev) => ({ ...prev, [userId]: true }));
    try {
      await setVipStatus(userId, status);
      setVipSuccess((prev) => ({ ...prev, [userId]: true }));
      setTimeout(
        () => setVipSuccess((prev) => ({ ...prev, [userId]: false })),
        2500,
      );
    } catch {
      /* silent */
    } finally {
      setSettingVip((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleBanToggle = async (userId: string, isBanned: boolean) => {
    setBanningUsers((prev) => ({ ...prev, [userId]: true }));
    try {
      const actor = await createActorWithConfig();
      await actor.updateUserRadiusTier(userId, isBanned ? 0n : 999n);
      if (!isBanned) {
        await actor.setOnlineStatus(userId, false);
      }
      await refreshFriends();
    } catch {
      /* silent */
    } finally {
      setBanningUsers((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleSavePurchaseSettings = async () => {
    setSaveStatus("loading");
    try {
      await savePurchaseSettings({
        enabled: purchaseEnabled,
        basicPrice: BigInt(Math.round(Number.parseFloat(basicPrice) * 100)),
        standardPrice: BigInt(
          Math.round(Number.parseFloat(standardPrice) * 100),
        ),
        premiumPrice: BigInt(Math.round(Number.parseFloat(premiumPrice) * 100)),
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setBroadcastStatus("loading");
    try {
      const actor = await createActorWithConfig();
      await actor.broadcastMessage(broadcastText.trim());
      setLatestBroadcast({
        text: broadcastText.trim(),
        timestamp: BigInt(Date.now()),
      });
      setBroadcastText("");
      setBroadcastStatus("success");
      setTimeout(() => setBroadcastStatus("idle"), 2500);
    } catch {
      setBroadcastStatus("error");
      setTimeout(() => setBroadcastStatus("idle"), 3000);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const onlineCount = displayUsers.filter((u) => u.online).length;
  const vipCount = displayUsers.filter(
    (u) => u.vipStatus && u.vipStatus !== "none",
  ).length;
  const bannedCount = displayUsers.filter(
    (u) => u.radiusTier === "banned",
  ).length;
  const recentUsers = [...displayUsers]
    .filter((u) => u.createdAt)
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .slice(0, 5);

  const filteredUsers = displayUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  });

  // ── Shared styles ──────────────────────────────────────────────────────────
  const glassCard = {
    background: isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 16,
    padding: "14px 16px",
    backdropFilter: "blur(12px)",
  } as React.CSSProperties;

  const inputStyle = {
    background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)",
    border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    color: isLight ? "#111" : "white",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  const textColor = isLight ? "#111" : "white";
  const mutedColor = isLight ? "#888" : "rgba(255,255,255,0.4)";
  const subtleColor = isLight ? "#aaa" : "rgba(255,255,255,0.25)";
  const divider = `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"}`;

  return (
    <div
      data-ocid="admin.page"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "52px 16px 0",
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            data-ocid="admin.back_button"
            onClick={() => onNavigate("friends")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: mutedColor,
              fontSize: 13,
              padding: "4px 0",
              marginBottom: 12,
            }}
          >
            <ChevronLeft size={17} />
            Back
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                background:
                  "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 14px oklch(0.5 0.25 30 / 0.4)",
              }}
            >
              <Shield size={17} style={{ color: "white" }} />
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: textColor,
                  margin: 0,
                  letterSpacing: -0.5,
                }}
              >
                Admin Portal
              </h1>
              <p style={{ margin: 0, fontSize: 11, color: mutedColor }}>
                {displayUsers.length} accounts · {onlineCount} online
              </p>
            </div>
          </div>

          {/* ── Tab bar ──────────────────────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: isLight
                ? "rgba(0,0,0,0.05)"
                : "rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: 4,
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "7px 4px",
                    borderRadius: 10,
                    border: "none",
                    cursor: "pointer",
                    background: isActive
                      ? isLight
                        ? "rgba(255,255,255,0.9)"
                        : "rgba(255,255,255,0.12)"
                      : "transparent",
                    color: isActive ? (isLight ? "#111" : "white") : mutedColor,
                    fontSize: 10,
                    fontWeight: isActive ? 600 : 400,
                    transition: "all 0.2s ease",
                    boxShadow: isActive
                      ? isLight
                        ? "0 1px 6px rgba(0,0,0,0.1)"
                        : "0 1px 8px rgba(0,0,0,0.3)"
                      : "none",
                    letterSpacing: 0.2,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab content area ─────────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 16px 8px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* ════════════════════════════ DASHBOARD ════════════════════════ */}
          {activeTab === "dashboard" && (
            <div
              style={{
                opacity: 1,
                transform: "translateY(0)",
                transition: "opacity 0.25s, transform 0.25s",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Stat cards 2x2 grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Total Users",
                    value: displayUsers.length,
                    icon: <Users size={18} style={{ color: "white" }} />,
                    gradient:
                      "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
                    glow: "oklch(0.5 0.22 270 / 0.4)",
                  },
                  {
                    label: "Online Now",
                    value: onlineCount,
                    icon: <Wifi size={18} style={{ color: "white" }} />,
                    gradient:
                      "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.18 160))",
                    glow: "oklch(0.52 0.2 150 / 0.4)",
                  },
                  {
                    label: "VIP Members",
                    value: vipCount,
                    icon: <Crown size={18} style={{ color: "white" }} />,
                    gradient:
                      "linear-gradient(135deg, oklch(0.45 0.25 295), oklch(0.6 0.22 280))",
                    glow: "oklch(0.52 0.25 290 / 0.4)",
                  },
                  {
                    label: "Banned",
                    value: bannedCount,
                    icon: <Ban size={18} style={{ color: "white" }} />,
                    gradient:
                      "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
                    glow: "oklch(0.5 0.25 30 / 0.4)",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      ...glassCard,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: stat.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 12px ${stat.glow}`,
                      }}
                    >
                      {stat.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Bricolage Grotesque', sans-serif",
                          fontSize: 28,
                          fontWeight: 700,
                          color: textColor,
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: mutedColor,
                          marginTop: 3,
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Growth indicator */}
              <div
                style={{
                  ...glassCard,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, oklch(0.5 0.2 70), oklch(0.65 0.18 55))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={16} style={{ color: "white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: textColor }}
                  >
                    Activity Rate
                  </div>
                  <div style={{ fontSize: 11, color: mutedColor }}>
                    {displayUsers.length > 0
                      ? `${Math.round((onlineCount / displayUsers.length) * 100)}% currently online`
                      : "No users registered yet"}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "oklch(0.72 0.18 140)",
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                  }}
                >
                  {displayUsers.length > 0
                    ? `${Math.round((onlineCount / displayUsers.length) * 100)}%`
                    : "–"}
                </div>
              </div>

              {/* Recent registrations */}
              <div style={glassCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Clock size={14} style={{ color: "oklch(0.72 0.18 210)" }} />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: textColor }}
                  >
                    Recent Registrations
                  </span>
                </div>
                {recentUsers.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: mutedColor,
                      textAlign: "center",
                      padding: "10px 0",
                    }}
                  >
                    No users yet
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {recentUsers.map((user, i) => (
                      <div
                        key={user.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          paddingBottom: i < recentUsers.length - 1 ? 10 : 0,
                          borderBottom:
                            i < recentUsers.length - 1 ? divider : "none",
                        }}
                      >
                        <AvatarCircle
                          avatar={user.avatar}
                          displayName={user.displayName}
                          size={34}
                          colorIndex={i}
                          online={user.online}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: textColor,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {user.displayName}
                            <VipBadge status={user.vipStatus} />
                          </div>
                          <div style={{ fontSize: 11, color: mutedColor }}>
                            @{user.username}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: subtleColor,
                            flexShrink: 0,
                          }}
                        >
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "en-IN",
                                { month: "short", day: "numeric" },
                              )
                            : "–"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* VIP summary */}
              {vipCount > 0 && (
                <div style={glassCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Star size={14} style={{ color: "oklch(0.72 0.2 70)" }} />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      VIP Members
                    </span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {displayUsers
                      .filter((u) => u.vipStatus && u.vipStatus !== "none")
                      .map((u, i) => (
                        <div
                          key={u.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: isLight
                              ? "rgba(0,0,0,0.05)"
                              : "rgba(255,255,255,0.07)",
                            borderRadius: 20,
                            padding: "4px 10px 4px 5px",
                          }}
                        >
                          <AvatarCircle
                            avatar={u.avatar}
                            displayName={u.displayName}
                            size={22}
                            colorIndex={i}
                          />
                          <span style={{ fontSize: 11, color: textColor }}>
                            {u.displayName}
                          </span>
                          <VipBadge status={u.vipStatus} />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════ USERS ════════════════════════════ */}
          {activeTab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Search bar */}
              <div style={{ position: "relative" }}>
                <Users
                  size={14}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: mutedColor,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    ...inputStyle,
                    paddingLeft: 34,
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
              </div>

              {filteredUsers.length === 0 ? (
                <div
                  data-ocid="admin.empty_state"
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: mutedColor,
                  }}
                >
                  <UserCheck
                    size={36}
                    style={{ marginBottom: 10, opacity: 0.3 }}
                  />
                  <p style={{ fontSize: 13 }}>No users found</p>
                </div>
              ) : (
                filteredUsers.map((user, i) => {
                  const isMe = user.id === currentUser?.id;
                  const isAdminUser = user.isAdmin === true;
                  const isBanned = user.radiusTier === "banned";
                  const isPendingDelete = confirmDelete === user.id;
                  const currentTier = user.radiusTier || "free";
                  const tierKey = (isBanned ? "banned" : currentTier) as
                    | RadiusTier
                    | "banned";
                  const tierColors =
                    TIER_BADGE_COLORS[tierKey] || TIER_BADGE_COLORS.free;
                  const isGranting = grantingUsers[user.id];
                  const didGrantSuccess = grantSuccess[user.id];
                  const isBanning = banningUsers[user.id];

                  return (
                    <div
                      key={user.id}
                      data-ocid={`admin.user.item.${i + 1}`}
                      style={{
                        ...glassCard,
                        border: isPendingDelete
                          ? "1px solid oklch(0.6 0.25 30 / 0.5)"
                          : isBanned
                            ? "1px solid oklch(0.6 0.22 30 / 0.25)"
                            : glassCard.border,
                        background: isBanned
                          ? isLight
                            ? "rgba(255,60,60,0.05)"
                            : "rgba(255,60,60,0.06)"
                          : glassCard.background,
                      }}
                    >
                      {/* Top row: avatar + info + delete */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                        }}
                      >
                        <AvatarCircle
                          avatar={user.avatar}
                          displayName={user.displayName}
                          size={40}
                          colorIndex={i}
                          online={user.online}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              flexWrap: "wrap",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: textColor,
                              }}
                            >
                              {user.displayName}
                            </span>
                            {isAdminUser && (
                              <span
                                style={{
                                  fontSize: 9,
                                  background: "oklch(0.45 0.25 30 / 0.3)",
                                  color: "oklch(0.75 0.2 50)",
                                  border: "1px solid oklch(0.6 0.2 50 / 0.3)",
                                  borderRadius: 5,
                                  padding: "1px 5px",
                                }}
                              >
                                ADMIN
                              </span>
                            )}
                            {isMe && (
                              <span
                                style={{
                                  fontSize: 9,
                                  background: "rgba(128,200,255,0.15)",
                                  color: "oklch(0.8 0.15 200)",
                                  border: "1px solid oklch(0.8 0.15 200 / 0.3)",
                                  borderRadius: 5,
                                  padding: "1px 5px",
                                }}
                              >
                                YOU
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: 9,
                                background: tierColors.bg,
                                color: tierColors.color,
                                border: `1px solid ${tierColors.border}`,
                                borderRadius: 5,
                                padding: "1px 5px",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {isBanned ? "BANNED" : currentTier}
                            </span>
                            <VipBadge status={user.vipStatus} />
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 10,
                              color: mutedColor,
                            }}
                          >
                            @{user.username}
                          </p>
                          {user.createdAt && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: 10,
                                color: subtleColor,
                              }}
                            >
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {!isAdminUser ? (
                          <Button
                            data-ocid={`admin.user.delete_button.${i + 1}`}
                            onClick={() => handleDelete(user.id)}
                            size="sm"
                            style={{
                              borderRadius: 9,
                              background: isPendingDelete
                                ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                                : "rgba(255,80,80,0.1)",
                              border: isPendingDelete
                                ? "none"
                                : "1px solid rgba(255,80,80,0.25)",
                              color: isPendingDelete
                                ? "white"
                                : "oklch(0.7 0.2 30)",
                              fontSize: 11,
                              padding: "5px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              flexShrink: 0,
                            }}
                          >
                            {isPendingDelete ? (
                              <>
                                <AlertTriangle size={11} />
                                Confirm
                              </>
                            ) : (
                              <>
                                <Trash2 size={11} />
                                Del
                              </>
                            )}
                          </Button>
                        ) : (
                          <div
                            style={{
                              fontSize: 10,
                              color: subtleColor,
                              padding: "5px 6px",
                            }}
                          >
                            Protected
                          </div>
                        )}
                      </div>

                      {/* Grant tier row */}
                      {!isAdminUser && (
                        <div
                          style={{
                            marginTop: 10,
                            paddingTop: 10,
                            borderTop: divider,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <Gift
                            size={12}
                            style={{
                              color: "oklch(0.75 0.18 280)",
                              flexShrink: 0,
                            }}
                          />
                          <Select
                            value={grantTiers[user.id] || "basic"}
                            onValueChange={(val) =>
                              setGrantTiers((prev) => ({
                                ...prev,
                                [user.id]: val as RadiusTier,
                              }))
                            }
                          >
                            <SelectTrigger
                              data-ocid={`admin.user.select.${i + 1}`}
                              style={{
                                flex: 1,
                                height: 30,
                                fontSize: 11,
                                background: isLight
                                  ? "rgba(0,0,0,0.05)"
                                  : "rgba(255,255,255,0.07)",
                                border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                                borderRadius: 8,
                                color: isLight
                                  ? "#333"
                                  : "rgba(255,255,255,0.85)",
                              }}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                Object.entries(TIER_LABELS) as [
                                  RadiusTier,
                                  string,
                                ][]
                              ).map(([tier, label]) => (
                                <SelectItem key={tier} value={tier}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            data-ocid={`admin.user.primary_button.${i + 1}`}
                            onClick={() => handleGrantPurchase(user.id)}
                            disabled={isGranting}
                            size="sm"
                            style={{
                              borderRadius: 8,
                              background: didGrantSuccess
                                ? "linear-gradient(135deg, oklch(0.5 0.2 145), oklch(0.65 0.18 160))"
                                : "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
                              border: "none",
                              color: "white",
                              fontSize: 11,
                              padding: "5px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              flexShrink: 0,
                              transition: "background 0.3s",
                            }}
                          >
                            {isGranting ? (
                              <Loader2
                                size={11}
                                style={{
                                  animation: "spin 0.8s linear infinite",
                                }}
                              />
                            ) : didGrantSuccess ? (
                              <CheckCircle2 size={11} />
                            ) : null}
                            {isGranting
                              ? "..."
                              : didGrantSuccess
                                ? "Done!"
                                : "Grant"}
                          </Button>
                        </div>
                      )}

                      {/* VIP row */}
                      {!isAdminUser && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: divider,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "oklch(0.72 0.15 280)",
                              flexShrink: 0,
                              fontWeight: 600,
                            }}
                          >
                            VIP
                          </span>
                          <select
                            value={
                              vipStatuses[user.id] ?? user.vipStatus ?? "none"
                            }
                            onChange={(e) =>
                              setVipStatuses((prev) => ({
                                ...prev,
                                [user.id]: e.target.value,
                              }))
                            }
                            style={{
                              flex: 1,
                              height: 30,
                              fontSize: 11,
                              background: isLight
                                ? "rgba(0,0,0,0.05)"
                                : "rgba(255,255,255,0.07)",
                              border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                              borderRadius: 8,
                              color: isLight
                                ? "#333"
                                : "rgba(255,255,255,0.85)",
                              padding: "0 8px",
                              outline: "none",
                            }}
                          >
                            <option value="none">None</option>
                            <option value="vip">VIP ★</option>
                            <option value="vvip">V.VIP ✦</option>
                          </select>
                          <Button
                            data-ocid={`admin.user.vip_button.${i + 1}`}
                            onClick={() => handleSetVipStatus(user.id)}
                            disabled={settingVip[user.id]}
                            size="sm"
                            style={{
                              borderRadius: 8,
                              background: vipSuccess[user.id]
                                ? "linear-gradient(135deg, oklch(0.5 0.2 145), oklch(0.65 0.18 160))"
                                : "linear-gradient(135deg, oklch(0.45 0.25 295), oklch(0.6 0.22 280))",
                              border: "none",
                              color: "white",
                              fontSize: 11,
                              padding: "5px 12px",
                              flexShrink: 0,
                              transition: "background 0.3s",
                            }}
                          >
                            {settingVip[user.id]
                              ? "..."
                              : vipSuccess[user.id]
                                ? "Set!"
                                : "Set"}
                          </Button>
                        </div>
                      )}

                      {/* Ban row */}
                      {!isAdminUser && (
                        <div
                          style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTop: divider,
                            display: "flex",
                            gap: 7,
                          }}
                        >
                          <Button
                            onClick={() => handleBanToggle(user.id, isBanned)}
                            disabled={isBanning}
                            size="sm"
                            style={{
                              flex: 1,
                              borderRadius: 8,
                              background: isBanned
                                ? "rgba(80,200,120,0.12)"
                                : "rgba(255,80,80,0.1)",
                              border: isBanned
                                ? "1px solid rgba(80,200,120,0.25)"
                                : "1px solid rgba(255,80,80,0.25)",
                              color: isBanned
                                ? "oklch(0.72 0.18 145)"
                                : "oklch(0.7 0.2 30)",
                              fontSize: 11,
                              padding: "5px 10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            {isBanning ? (
                              <Loader2
                                size={11}
                                style={{
                                  animation: "spin 0.8s linear infinite",
                                }}
                              />
                            ) : isBanned ? (
                              <>
                                <RotateCcw size={11} />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban size={11} />
                                Ban User
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {confirmDelete && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(255,80,80,0.08)",
                    border: "1px solid rgba(255,80,80,0.2)",
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12,
                    color: "oklch(0.7 0.2 30)",
                  }}
                >
                  <AlertTriangle size={13} />
                  Tap Confirm again to permanently delete.
                  <button
                    type="button"
                    data-ocid="admin.cancel_button"
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      marginLeft: "auto",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: mutedColor,
                      fontSize: 11,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════ PURCHASES ════════════════════════════ */}
          {activeTab === "purchases" && (
            <div
              data-ocid="admin.purchases.section"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Enable toggle card */}
              <div style={glassCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background:
                        "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 10px oklch(0.5 0.22 270 / 0.4)",
                    }}
                  >
                    <ShoppingCart size={15} style={{ color: "white" }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: textColor,
                        margin: 0,
                      }}
                    >
                      In-App Purchases
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, color: mutedColor }}>
                      Control radius upgrade pricing
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: isLight
                      ? "rgba(0,0,0,0.04)"
                      : "rgba(255,255,255,0.05)",
                    borderRadius: 10,
                  }}
                >
                  <div>
                    <Label
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: textColor,
                        cursor: "pointer",
                      }}
                    >
                      Enable Purchases
                    </Label>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: mutedColor,
                        marginTop: 1,
                      }}
                    >
                      Allow users to upgrade their search radius
                    </p>
                  </div>
                  <Switch
                    data-ocid="admin.purchases.switch"
                    checked={purchaseEnabled}
                    onCheckedChange={setPurchaseEnabled}
                  />
                </div>
              </div>

              {/* Price cards */}
              {[
                {
                  label: "Basic",
                  sublabel: "1km radius",
                  value: basicPrice,
                  onChange: setBasicPrice,
                  gradient:
                    "linear-gradient(135deg, oklch(0.45 0.2 210), oklch(0.6 0.18 200))",
                  glow: "oklch(0.52 0.2 205 / 0.35)",
                },
                {
                  label: "Standard",
                  sublabel: "5km radius",
                  value: standardPrice,
                  onChange: setStandardPrice,
                  gradient:
                    "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.18 155))",
                  glow: "oklch(0.52 0.2 148 / 0.35)",
                },
                {
                  label: "Premium",
                  sublabel: "10km radius",
                  value: premiumPrice,
                  onChange: setPremiumPrice,
                  gradient:
                    "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
                  glow: "oklch(0.52 0.25 40 / 0.35)",
                },
              ].map(({ label, sublabel, value, onChange, gradient, glow }) => (
                <div
                  key={label}
                  style={{
                    ...glassCard,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 4px 12px ${glow}`,
                    }}
                  >
                    <span
                      style={{ color: "white", fontSize: 14, fontWeight: 700 }}
                    >
                      ₹
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: textColor,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {label}{" "}
                      <span style={{ fontWeight: 400, color: mutedColor }}>
                        ({sublabel})
                      </span>
                    </Label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 10,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: mutedColor,
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1,
                        }}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        data-ocid="admin.purchases.input"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                          ...inputStyle,
                          paddingLeft: 26,
                          fontSize: 13,
                          padding: "6px 10px 6px 26px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Save button */}
              <Button
                data-ocid="admin.purchases.save_button"
                onClick={handleSavePurchaseSettings}
                disabled={saveStatus === "loading"}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  background:
                    saveStatus === "success"
                      ? "linear-gradient(135deg, oklch(0.5 0.2 145), oklch(0.65 0.18 160))"
                      : saveStatus === "error"
                        ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                        : "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
                  border: "none",
                  color: "white",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  transition: "background 0.3s",
                  boxShadow: "0 4px 16px oklch(0.5 0.22 270 / 0.35)",
                }}
              >
                {saveStatus === "loading" && (
                  <Loader2
                    size={15}
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                )}
                {saveStatus === "success" && <CheckCircle2 size={15} />}
                {saveStatus === "error" && <AlertTriangle size={15} />}
                {saveStatus === "loading"
                  ? "Saving..."
                  : saveStatus === "success"
                    ? "Saved!"
                    : saveStatus === "error"
                      ? "Save Failed"
                      : "Save Settings"}
              </Button>

              {saveStatus === "success" && (
                <div
                  data-ocid="admin.purchases.success_state"
                  style={{
                    fontSize: 12,
                    color: "oklch(0.75 0.2 145)",
                    textAlign: "center",
                  }}
                >
                  Purchase settings saved successfully.
                </div>
              )}
              {saveStatus === "error" && (
                <div
                  data-ocid="admin.purchases.error_state"
                  style={{
                    fontSize: 12,
                    color: "oklch(0.7 0.2 30)",
                    textAlign: "center",
                  }}
                >
                  Failed to save. Please try again.
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════ BROADCAST ════════════════════════════ */}
          {activeTab === "broadcast" && (
            <div
              data-ocid="admin.broadcast.section"
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {/* Compose card */}
              <div style={glassCard}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background:
                        "linear-gradient(135deg, oklch(0.5 0.25 30), oklch(0.65 0.2 50))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 3px 10px oklch(0.55 0.25 40 / 0.4)",
                    }}
                  >
                    <Megaphone size={15} style={{ color: "white" }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: textColor,
                        margin: 0,
                      }}
                    >
                      Broadcast Message
                    </h2>
                    <p style={{ margin: 0, fontSize: 11, color: mutedColor }}>
                      Send popup announcement to all users
                    </p>
                  </div>
                </div>

                <textarea
                  data-ocid="admin.broadcast.textarea"
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Write your announcement here..."
                  rows={4}
                  style={{
                    width: "100%",
                    background: isLight
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(255,255,255,0.07)",
                    border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    color: textColor,
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    marginBottom: 10,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 11, color: mutedColor }}>
                    {broadcastText.length} chars
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: broadcastText.trim()
                        ? "oklch(0.72 0.18 140)"
                        : mutedColor,
                    }}
                  >
                    {broadcastText.trim()
                      ? `Ready to send to ${displayUsers.length} users`
                      : "Type a message first"}
                  </span>
                </div>

                <Button
                  data-ocid="admin.broadcast.submit_button"
                  onClick={handleBroadcast}
                  disabled={
                    broadcastStatus === "loading" || !broadcastText.trim()
                  }
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    background:
                      broadcastStatus === "success"
                        ? "linear-gradient(135deg, oklch(0.5 0.2 145), oklch(0.65 0.18 160))"
                        : broadcastStatus === "error"
                          ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                          : "linear-gradient(135deg, oklch(0.5 0.25 30), oklch(0.65 0.2 50))",
                    border: "none",
                    color: "white",
                    fontWeight: 600,
                    fontSize: 13,
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "background 0.3s",
                    boxShadow: "0 4px 14px oklch(0.55 0.25 40 / 0.35)",
                    opacity: !broadcastText.trim() ? 0.6 : 1,
                  }}
                >
                  {broadcastStatus === "loading" && (
                    <Loader2
                      size={14}
                      style={{ animation: "spin 0.8s linear infinite" }}
                    />
                  )}
                  {broadcastStatus === "success" && <CheckCircle2 size={14} />}
                  {broadcastStatus === "error" && <AlertTriangle size={14} />}
                  {broadcastStatus === "idle" && <Send size={14} />}
                  {broadcastStatus === "loading"
                    ? "Sending..."
                    : broadcastStatus === "success"
                      ? "Sent to all!"
                      : broadcastStatus === "error"
                        ? "Failed"
                        : "Send to All Users"}
                </Button>
              </div>

              {/* Last broadcast */}
              {latestBroadcast && (
                <div style={glassCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <History size={13} style={{ color: mutedColor }} />
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: textColor,
                      }}
                    >
                      Last Broadcast
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: subtleColor,
                        marginLeft: "auto",
                      }}
                    >
                      {new Date(
                        Number(latestBroadcast.timestamp),
                      ).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div
                    style={{
                      background: isLight
                        ? "rgba(0,0,0,0.04)"
                        : "rgba(255,255,255,0.05)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      color: textColor,
                      lineHeight: 1.5,
                      borderLeft: "3px solid oklch(0.6 0.2 50)",
                    }}
                  >
                    {latestBroadcast.text}
                  </div>
                </div>
              )}

              {/* Tips card */}
              <div
                style={{
                  ...glassCard,
                  background: isLight
                    ? "rgba(80,180,255,0.07)"
                    : "rgba(80,180,255,0.06)",
                  border: `1px solid ${isLight ? "rgba(80,180,255,0.15)" : "rgba(80,180,255,0.12)"}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: isLight
                      ? "oklch(0.4 0.15 210)"
                      : "oklch(0.75 0.15 210)",
                    lineHeight: 1.6,
                  }}
                >
                  💡 Broadcasts appear as animated popups for all users. Each
                  user sees it once until they dismiss it with "Got it".
                </p>
              </div>
            </div>
          )}

          <div style={{ height: 16 }} />
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0 }}>
          <DevFooter />
        </div>
      </div>
    </div>
  );
}
