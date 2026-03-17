import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
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
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "../components/BottomNav";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
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
  } = useApp();
  const isLight = theme === "light-clean";

  if (!currentUser) return null;

  const tierOrder: Record<RadiusTier, number> = {
    free: 0,
    basic: 1,
    standard: 2,
    premium: 3,
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

  const handleTierClick = (tier: RadiusTier, locked: boolean) => {
    if (locked) {
      toast(
        "Purchase this tier to unlock a larger radius. Contact admin or use the in-app upgrade.",
        { icon: "\ud83d\udd12" },
      );
      return;
    }
    purchaseRadius(tier);
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
            Settings
          </h1>
        </div>

        {/* Profile card */}
        <div
          className="glass-card"
          style={{ padding: "16px", marginBottom: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 20,
                color: "white",
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}
            >
              {currentUser.displayName[0]}
            </div>
            <div>
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
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                @{currentUser.username} \u00b7 {currentUser.id}
              </p>
            </div>
          </div>
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
                  onClick={() => handleTierClick(tier, locked)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: isActive
                      ? "linear-gradient(135deg, oklch(0.5 0.25 280 / 0.3), oklch(0.65 0.2 200 / 0.3))"
                      : isLockedAndNotActive
                        ? "rgba(255,255,255,0.02)"
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
                        {price} \u00b7 Requires upgrade
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
              data-ocid="settings.instagram.link"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(220,39,67,0.35)",
                }}
              >
                <Instagram size={22} color="white" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: isLight ? "#888" : "rgba(255,255,255,0.45)",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                Instagram
              </span>
            </a>

            {/* WhatsApp */}
            <a
              href="https://wa.me/917309227544"
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="settings.whatsapp.link"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
                }}
              >
                <MessageCircle size={22} color="white" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: isLight ? "#888" : "rgba(255,255,255,0.45)",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                WhatsApp
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:mkumargkp111@gmail.com"
              data-ocid="settings.email.link"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, oklch(0.5 0.25 260), oklch(0.65 0.2 280))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(100,80,255,0.35)",
                }}
              >
                <Mail size={22} color="white" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: isLight ? "#888" : "rgba(255,255,255,0.45)",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                Email
              </span>
            </a>
          </div>
        </div>

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
      </div>
      <BottomNav active="settings" onNavigate={onNavigate} />
    </div>
  );
}
