import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Calendar,
  Eye,
  Instagram,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Palette,
  Sun,
  Trash2,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarCircle } from "../components/AvatarCircle";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { PurchaseQRSheet } from "../components/PurchaseQRSheet";
import type { ProfileUser } from "../components/UserProfileSheet";
import { UserProfileSheet } from "../components/UserProfileSheet";
import { VipBadge } from "../components/VipBadge";
import { RADIUS_LABELS, type RadiusTier, useApp } from "../context/AppContext";

interface SettingsPageProps {
  onNavigate: (
    page: "friends" | "chats" | "search" | "settings" | "admin",
  ) => void;
  onLogout: () => void;
}

export function SettingsPage({ onNavigate, onLogout }: SettingsPageProps) {
  const {
    currentUser,
    theme,
    setTheme,
    updateSettings,
    purchaseRadius,
    purchaseSettings,
    updateAvatar,
    deleteOwnAccount,
  } = useApp();
  const isLight = theme === "light-clean";
  const [avatarInput, setAvatarInput] = useState(currentUser?.avatar || "");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [purchaseSheetOpen, setPurchaseSheetOpen] = useState(false);
  const [purchaseSheetTier, setPurchaseSheetTier] = useState("");
  const [purchaseSheetPrice, setPurchaseSheetPrice] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showOwnProfile, setShowOwnProfile] = useState(false);

  // Bio state
  const [bioInput, setBioInput] = useState(currentUser?.bio || "");
  const [bioSaving, setBioSaving] = useState(false);

  // Recovery date state
  const [recoveryDateInput, setRecoveryDateInput] = useState(
    currentUser?.recoveryDate || "",
  );
  const [recoveryDateSaving, setRecoveryDateSaving] = useState(false);

  if (!currentUser) return null;

  const tierOrder: Record<RadiusTier, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3,
    banned: -1,
  };
  const maxGrantedTier = currentUser.maxGrantedTier || currentUser.radiusTier;
  const maxGrantedLevel = tierOrder[maxGrantedTier] ?? 0;
  const basicPriceDisplay = purchaseSettings
    ? `\u20b9${(Number(purchaseSettings.basicPrice) / 100).toFixed(2)}`
    : "\u20b999.00";
  const standardPriceDisplay = purchaseSettings
    ? `\u20b9${(Number(purchaseSettings.standardPrice) / 100).toFixed(2)}`
    : "\u20b9299.00";
  const premiumPriceDisplay = purchaseSettings
    ? `\u20b9${(Number(purchaseSettings.premiumPrice) / 100).toFixed(2)}`
    : "\u20b9499.00";
  const tiers: {
    tier: RadiusTier;
    label: string;
    price: string;
    locked: boolean;
  }[] = [
    { tier: "free", label: "500m", price: "Free", locked: false },
    {
      tier: "basic",
      label: "1km",
      price: basicPriceDisplay,
      locked: tierOrder.basic > maxGrantedLevel,
    },
    {
      tier: "standard",
      label: "5km",
      price: standardPriceDisplay,
      locked: tierOrder.standard > maxGrantedLevel,
    },
    {
      tier: "premium",
      label: "10km",
      price: premiumPriceDisplay,
      locked: tierOrder.premium > maxGrantedLevel,
    },
  ];

  const themes = [
    { key: "liquid-flux" as const, icon: Zap, label: "Liquid Flux" },
    { key: "dark-minimal" as const, icon: Moon, label: "Dark" },
    { key: "light-clean" as const, icon: Sun, label: "Light" },
    { key: "neon-pulse" as const, icon: Palette, label: "Neon" },
  ];

  const handleTierClick = (
    tier: RadiusTier,
    locked: boolean,
    tierLabel: string,
    tierPrice: string,
  ) => {
    if (locked) {
      setPurchaseSheetTier(tierLabel);
      setPurchaseSheetPrice(tierPrice);
      setPurchaseSheetOpen(true);
      return;
    }
    purchaseRadius(tier);
  };

  const handlePurchaseManualClose = () => {
    toast(
      "If your tier was not upgraded, please contact: WhatsApp: 7309227544 or Instagram: @er._ankush__singh",
      { duration: 8000 },
    );
  };

  const ownProfileUser: ProfileUser = {
    id: currentUser.id,
    username: currentUser.username,
    displayName: currentUser.displayName,
    avatar: currentUser.avatar,
    vipStatus: currentUser.vipStatus,
    bio: currentUser.bio,
    userStatus: currentUser.userStatus,
    radiusTier: currentUser.radiusTier,
    online: currentUser.online,
    lastSeen: currentUser.lastSeen,
    createdAt: currentUser.createdAt,
  };

  const statusOptions = [
    { key: "online", label: "Online", color: "oklch(0.72 0.22 140)" },
    { key: "busy", label: "Busy", color: "oklch(0.72 0.22 70)" },
    { key: "away", label: "Away", color: "oklch(0.72 0.18 50)" },
  ];

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
              letterSpacing: -0.5,
            }}
          >
            Profile
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
            }}
          >
            Manage your account and preferences
          </p>
        </div>

        {/* Profile card — tappable to view own profile */}
        <button
          type="button"
          data-ocid="settings.profile.card"
          onClick={() => setShowOwnProfile(true)}
          className="glass-card"
          style={{
            padding: "16px",
            marginBottom: 20,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            border: "1px solid rgba(128,200,255,0.15)",
            transition: "transform 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarCircle
              avatar={currentUser.avatar}
              displayName={currentUser.displayName}
              size={52}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 16,
                    color: isLight ? "#111" : "white",
                  }}
                >
                  {currentUser.displayName}
                </p>
                <VipBadge status={currentUser.vipStatus} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                @{currentUser.username} &middot; {currentUser.id}
              </p>
              {currentUser.bio && (
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: isLight ? "#555" : "rgba(255,255,255,0.55)",
                    fontStyle: "italic",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser.bio}
                </p>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "oklch(0.78 0.15 200)",
                fontSize: 12,
                fontWeight: 500,
                flexShrink: 0,
              }}
            >
              <User size={13} />
              View
            </div>
          </div>
        </button>

        {/* Avatar picker */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Avatar
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <AvatarCircle
              avatar={avatarInput}
              displayName={currentUser.displayName}
              size={52}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: isLight ? "#888" : "rgba(255,255,255,0.45)",
                }}
              >
                Type one emoji or one letter
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  data-ocid="settings.avatar.input"
                  type="text"
                  maxLength={2}
                  value={avatarInput}
                  onChange={(e) => setAvatarInput(e.target.value.slice(0, 2))}
                  placeholder="\ud83d\ude0a or A"
                  style={{
                    flex: 1,
                    background: isLight
                      ? "rgba(0,0,0,0.05)"
                      : "rgba(255,255,255,0.08)",
                    border: `1px solid ${
                      isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"
                    }`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 18,
                    color: isLight ? "#111" : "white",
                    outline: "none",
                    textAlign: "center",
                    width: 60,
                  }}
                />
                <Button
                  data-ocid="settings.avatar.save_button"
                  onClick={async () => {
                    setAvatarSaving(true);
                    await updateAvatar(avatarInput);
                    setAvatarSaving(false);
                    toast.success("Avatar updated!");
                  }}
                  disabled={avatarSaving}
                  style={{
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                    border: "none",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 16px",
                  }}
                >
                  {avatarSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Bio
          </p>
          <textarea
            data-ocid="settings.bio.textarea"
            maxLength={40}
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value.slice(0, 40))}
            placeholder="Write a short bio... (max 40 chars)"
            rows={2}
            style={{
              width: "100%",
              background: isLight
                ? "rgba(0,0,0,0.05)"
                : "rgba(255,255,255,0.06)",
              border: `1px solid ${
                isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"
              }`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 14,
              color: isLight ? "#111" : "white",
              outline: "none",
              resize: "none",
              fontFamily: "inherit",
              boxSizing: "border-box" as const,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: isLight ? "#aaa" : "rgba(255,255,255,0.3)",
              }}
            >
              {bioInput.length}/40
            </span>
            <Button
              data-ocid="settings.bio.save_button"
              onClick={() => {
                setBioSaving(true);
                updateSettings({ bio: bioInput });
                setBioSaving(false);
                toast.success("Bio saved!");
              }}
              disabled={bioSaving}
              style={{
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 18px",
                height: 34,
              }}
            >
              Save Bio
            </Button>
          </div>
        </div>

        {/* Status Selector */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Status
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {statusOptions.map(({ key, label, color }) => {
              const isSelected = (currentUser.userStatus || "online") === key;
              return (
                <button
                  type="button"
                  key={key}
                  data-ocid={`settings.status.${key}.button`}
                  onClick={() => {
                    updateSettings({ userStatus: key });
                    toast.success(`Status set to ${label}`);
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 12,
                    border: isSelected
                      ? `1.5px solid ${color}`
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isSelected
                      ? `${color.replace(")", " / 0.15)")}`
                      : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: isSelected ? `0 0 8px ${color}` : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? color : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recovery Date */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <Calendar
              size={14}
              style={{ color: isLight ? "#888" : "rgba(255,255,255,0.4)" }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Recovery Date
            </p>
          </div>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              lineHeight: 1.4,
            }}
          >
            Set a date to recover your password or skip login in case you forget
            your password.
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              data-ocid="settings.recovery_date.input"
              type="date"
              value={recoveryDateInput}
              onChange={(e) => setRecoveryDateInput(e.target.value)}
              style={{
                flex: 1,
                background: isLight
                  ? "rgba(0,0,0,0.05)"
                  : "rgba(255,255,255,0.06)",
                border: `1px solid ${
                  isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"
                }`,
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 14,
                color: isLight ? "#111" : "white",
                outline: "none",
                colorScheme: isLight ? "light" : "dark",
              }}
            />
            <Button
              data-ocid="settings.recovery_date.save_button"
              onClick={() => {
                setRecoveryDateSaving(true);
                updateSettings({ recoveryDate: recoveryDateInput });
                setRecoveryDateSaving(false);
                toast.success("Recovery date saved!");
              }}
              disabled={recoveryDateSaving || !recoveryDateInput}
              style={{
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                padding: "9px 16px",
                height: 40,
                flexShrink: 0,
              }}
            >
              Save
            </Button>
          </div>
          {currentUser.recoveryDate && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 12,
                color: "oklch(0.75 0.18 140)",
              }}
            >
              \u2713 Recovery date set: {currentUser.recoveryDate}
            </p>
          )}
        </div>

        {/* Preferences */}
        <div
          className="glass-card"
          style={{ padding: "4px 0", marginBottom: 16 }}
        >
          {[
            {
              icon: Eye,
              label: "Show Online Status",
              key: "showOnlineStatus" as const,
            },
            {
              icon: MapPin,
              label: "Appear in Radius Search",
              key: "showInRadius" as const,
            },
            {
              icon: Bell,
              label: "Notifications",
              key: "notifications" as const,
            },
          ].map(({ icon: Icon, label, key }) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Icon
                size={16}
                style={{
                  marginRight: 12,
                  color: isLight ? "#666" : "rgba(255,255,255,0.5)",
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: isLight ? "#111" : "rgba(255,255,255,0.85)",
                }}
              >
                {label}
              </span>
              <Switch
                data-ocid={`settings.${key}.switch`}
                checked={currentUser[key]}
                onCheckedChange={(v) => updateSettings({ [key]: v })}
              />
            </div>
          ))}
        </div>

        {/* Theme */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Theme
          </p>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {themes.map(({ key, icon: Icon, label }) => (
              <button
                type="button"
                key={key}
                data-ocid={`settings.theme.${key}.button`}
                onClick={() => setTheme(key)}
                style={{
                  padding: "12px",
                  borderRadius: 12,
                  background:
                    theme === key
                      ? "linear-gradient(135deg, oklch(0.5 0.25 280 / 0.3), oklch(0.65 0.2 200 / 0.3))"
                      : "rgba(255,255,255,0.04)",
                  border:
                    theme === key
                      ? "1px solid oklch(0.65 0.2 200 / 0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: isLight ? "#111" : "white",
                  fontSize: 13,
                  fontWeight: theme === key ? 600 : 400,
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Radius upgrade */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <TrendingUp
              size={14}
              style={{ color: isLight ? "#888" : "rgba(255,255,255,0.4)" }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Radius Tier
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tiers.map(({ tier, label, price, locked }) => {
              const isActive = currentUser.radiusTier === tier;
              const isLockedAndNotActive = locked && !isActive;
              return (
                <button
                  type="button"
                  key={tier}
                  data-ocid={`settings.radius.${tier}.button`}
                  onClick={() => handleTierClick(tier, locked, label, price)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: isActive
                      ? "linear-gradient(135deg, oklch(0.5 0.25 280 / 0.2), oklch(0.65 0.2 200 / 0.2))"
                      : "rgba(255,255,255,0.04)",
                    border: isActive
                      ? "1px solid oklch(0.65 0.2 200 / 0.5)"
                      : isLockedAndNotActive
                        ? "1px solid rgba(255,255,255,0.05)"
                        : "1px solid rgba(255,255,255,0.08)",
                    cursor: locked ? "not-allowed" : "pointer",
                    color: isLockedAndNotActive
                      ? isLight
                        ? "#bbb"
                        : "rgba(255,255,255,0.3)"
                      : isLight
                        ? "#111"
                        : "white",
                    opacity: isLockedAndNotActive ? 0.65 : 1,
                  }}
                >
                  <MapPin
                    size={14}
                    style={{
                      marginRight: 10,
                      color: isActive
                        ? "oklch(0.8 0.15 200)"
                        : isLockedAndNotActive
                          ? isLight
                            ? "#ccc"
                            : "rgba(255,255,255,0.2)"
                          : isLight
                            ? "#888"
                            : "rgba(255,255,255,0.4)",
                    }}
                  />
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ fontSize: 14, display: "block" }}>
                      {label} radius
                    </span>
                    {isLockedAndNotActive && (
                      <span
                        style={{
                          fontSize: 11,
                          color: isLight ? "#aaa" : "rgba(255,255,255,0.25)",
                          display: "block",
                          marginTop: 1,
                        }}
                      >
                        {price} &middot; Requires upgrade
                      </span>
                    )}
                  </div>
                  {isLockedAndNotActive ? (
                    <Lock
                      size={14}
                      style={{
                        color: isLight ? "#bbb" : "rgba(255,255,255,0.25)",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: isActive
                          ? "oklch(0.8 0.15 200)"
                          : isLight
                            ? "#888"
                            : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {price}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Friends count */}
        <div
          className="glass-card"
          style={{
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Users
            size={16}
            style={{ color: isLight ? "#666" : "rgba(255,255,255,0.5)" }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 14,
              color: isLight ? "#111" : "rgba(255,255,255,0.85)",
            }}
          >
            Current radius: {RADIUS_LABELS[currentUser.radiusTier]}
          </span>
        </div>

        {/* Contact Developer */}
        <div className="glass-card" style={{ padding: 16, marginBottom: 16 }}>
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              fontWeight: 600,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Contact Developer
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
            {/* Instagram */}
            <a
              href="https://www.instagram.com/er._ankush__singh?igsh=MXJoOW5lYzdrbnM2bg=="
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: isLight ? "#E1306C" : "oklch(0.75 0.2 350)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isLight
                    ? "rgba(225,48,108,0.08)"
                    : "oklch(0.55 0.22 350 / 0.15)",
                  border: `1px solid ${
                    isLight
                      ? "rgba(225,48,108,0.2)"
                      : "oklch(0.6 0.2 350 / 0.3)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Instagram size={20} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500 }}>Instagram</span>
            </a>
            {/* WhatsApp */}
            <a
              href="https://wa.me/917309227544"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: isLight ? "#25D366" : "oklch(0.75 0.2 145)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isLight
                    ? "rgba(37,211,102,0.08)"
                    : "oklch(0.55 0.2 145 / 0.15)",
                  border: `1px solid ${
                    isLight
                      ? "rgba(37,211,102,0.2)"
                      : "oklch(0.6 0.2 145 / 0.3)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={20} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500 }}>WhatsApp</span>
            </a>
            {/* Email */}
            <a
              href="mailto:mkumargkp111@gmail.com"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                color: isLight ? "#1a73e8" : "oklch(0.75 0.18 240)",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isLight
                    ? "rgba(26,115,232,0.08)"
                    : "oklch(0.55 0.18 240 / 0.15)",
                  border: `1px solid ${
                    isLight
                      ? "rgba(26,115,232,0.2)"
                      : "oklch(0.6 0.18 240 / 0.3)"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={20} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500 }}>Email</span>
            </a>
          </div>
        </div>

        {/* Privacy & Terms */}
        <div
          style={{
            textAlign: "center",
            marginTop: 12,
            marginBottom: 4,
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            lineHeight: 1.7,
          }}
        >
          <a
            href="https://notes.realme.com/s/r5rVmrj2WqBQ_2"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "underline",
            }}
          >
            Privacy Policy
          </a>
          {" · "}
          <a
            href="https://notes.realme.com/s/xhfW199sVkMS_2"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "rgba(255,255,255,0.5)",
              textDecoration: "underline",
            }}
          >
            Terms & Conditions
          </a>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            margin: "24px 0 8px",
            fontSize: 13,
            fontWeight: 700,
            color: isLight ? "#c00" : "oklch(0.6 0.2 20)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          Danger Zone
        </div>

        {!deleteConfirm ? (
          <Button
            data-ocid="settings.delete.button"
            onClick={() => setDeleteConfirm(true)}
            style={{
              width: "100%",
              borderRadius: 14,
              background: "rgba(200,0,0,0.1)",
              border: "1px solid rgba(200,0,0,0.25)",
              color: "oklch(0.7 0.2 20)",
              height: 48,
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Trash2 size={15} />
            Delete Account
          </Button>
        ) : (
          <div
            style={{
              background: "rgba(200,0,0,0.08)",
              border: "1px solid rgba(200,0,0,0.22)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontSize: 13,
                color: "oklch(0.7 0.18 20)",
                marginBottom: 10,
                fontWeight: 600,
              }}
            >
              \u26a0\ufe0f This permanently deletes your account and all data.
            </p>
            <input
              type="password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid rgba(200,0,0,0.3)",
                background: "rgba(0,0,0,0.3)",
                color: "inherit",
                fontSize: 13,
                marginBottom: 10,
                boxSizing: "border-box" as const,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                onClick={() => {
                  setDeleteConfirm(false);
                  setDeletePassword("");
                }}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "inherit",
                  height: 38,
                  fontSize: 13,
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={deleteLoading || !deletePassword}
                onClick={async () => {
                  if (!currentUser || !deletePassword) return;
                  setDeleteLoading(true);
                  const ok = await deleteOwnAccount(
                    currentUser.id,
                    deletePassword,
                  );
                  setDeleteLoading(false);
                  if (!ok) {
                    toast.error("Incorrect password");
                  }
                }}
                style={{
                  flex: 1,
                  borderRadius: 10,
                  background: "rgba(200,0,0,0.7)",
                  border: "none",
                  color: "#fff",
                  height: 38,
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: deleteLoading || !deletePassword ? 0.5 : 1,
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        )}

        {/* Logout */}
        <Button
          data-ocid="settings.logout.button"
          onClick={onLogout}
          style={{
            width: "100%",
            borderRadius: 14,
            background: "rgba(255,80,80,0.12)",
            border: "1px solid rgba(255,80,80,0.25)",
            color: "oklch(0.7 0.2 30)",
            height: 48,
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>
      {/* Footer always at bottom, above BottomNav */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 80 }}>
        <DevFooter />
        <PurchaseQRSheet
          open={purchaseSheetOpen}
          onClose={() => setPurchaseSheetOpen(false)}
          onManualClose={handlePurchaseManualClose}
          tierName={purchaseSheetTier}
          price={purchaseSheetPrice}
        />
      </div>
      <BottomNav active="settings" onNavigate={onNavigate} />

      {/* Own Profile Sheet */}
      {showOwnProfile && (
        <UserProfileSheet
          user={ownProfileUser}
          isOwnProfile
          onClose={() => setShowOwnProfile(false)}
          onEditProfile={() => setShowOwnProfile(false)}
        />
      )}
    </div>
  );
}
