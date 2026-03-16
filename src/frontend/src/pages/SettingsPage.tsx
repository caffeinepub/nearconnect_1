import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Eye,
  LogOut,
  MapPin,
  Moon,
  Palette,
  Sun,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { BottomNav } from "../components/BottomNav";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { RADIUS_LABELS, type RadiusTier, useApp } from "../context/AppContext";

interface SettingsPageProps {
  onNavigate: (page: "friends" | "search" | "settings" | "admin") => void;
  onLogout: () => void;
}

export function SettingsPage({ onNavigate, onLogout }: SettingsPageProps) {
  const { currentUser, theme, setTheme, updateSettings, purchaseRadius } =
    useApp();
  const isLight = theme === "light-clean";

  if (!currentUser) return null;

  const tiers: { tier: RadiusTier; label: string; price: string }[] = [
    { tier: "free", label: "500m", price: "Free" },
    { tier: "basic", label: "1km", price: "$0.99" },
    { tier: "standard", label: "5km", price: "$2.99" },
    { tier: "premium", label: "10km", price: "$4.99" },
  ];

  const themes = [
    { key: "liquid-flux" as const, icon: Zap, label: "Liquid Flux" },
    { key: "dark-minimal" as const, icon: Moon, label: "Dark" },
    { key: "light-clean" as const, icon: Sun, label: "Light" },
    { key: "neon-pulse" as const, icon: Palette, label: "Neon" },
  ];

  return (
    <div
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
                @{currentUser.username} · {currentUser.id}
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
            {tiers.map(({ tier, label, price }) => (
              <button
                type="button"
                key={tier}
                data-ocid={`settings.radius.${tier}.button`}
                onClick={() => purchaseRadius(tier)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background:
                    currentUser.radiusTier === tier
                      ? "linear-gradient(135deg, oklch(0.5 0.25 280 / 0.3), oklch(0.65 0.2 200 / 0.3))"
                      : "rgba(255,255,255,0.04)",
                  border:
                    currentUser.radiusTier === tier
                      ? "1px solid oklch(0.65 0.2 200 / 0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  color: isLight ? "#111" : "white",
                }}
              >
                <MapPin
                  size={14}
                  style={{
                    marginRight: 10,
                    color:
                      currentUser.radiusTier === tier
                        ? "oklch(0.8 0.15 200)"
                        : isLight
                          ? "#888"
                          : "rgba(255,255,255,0.4)",
                  }}
                />
                <span style={{ flex: 1, fontSize: 14, textAlign: "left" }}>
                  {label} radius
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      currentUser.radiusTier === tier
                        ? "oklch(0.8 0.15 200)"
                        : isLight
                          ? "#888"
                          : "rgba(255,255,255,0.4)",
                  }}
                >
                  {price}
                </span>
              </button>
            ))}
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
      <BottomNav active="settings" onNavigate={onNavigate} />
    </div>
  );
}
