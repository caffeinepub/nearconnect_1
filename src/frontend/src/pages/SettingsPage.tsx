import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Check,
  Crown,
  LogOut,
  MapPin,
  Palette,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BottomNav } from "../components/BottomNav";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import {
  RADIUS_LABELS,
  type RadiusTier,
  type Theme,
  useApp,
} from "../context/AppContext";

interface SettingsPageProps {
  onNavigate: (page: "friends" | "search" | "settings") => void;
  onLogout: () => void;
}

const THEMES: { id: Theme; label: string; desc: string; preview: string }[] = [
  {
    id: "liquid-flux",
    label: "Liquid Flux",
    desc: "Animated gradient mesh",
    preview: "linear-gradient(135deg, #0a0a1a, oklch(0.5 0.25 280))",
  },
  {
    id: "dark-minimal",
    label: "Dark Minimal",
    desc: "Pure dark, sharp",
    preview: "linear-gradient(135deg, #0f0f0f, #1a1a1a)",
  },
  {
    id: "light-clean",
    label: "Light Clean",
    desc: "Bright & minimal",
    preview: "linear-gradient(135deg, #f5f5f8, #ffffff)",
  },
  {
    id: "neon-pulse",
    label: "Neon Pulse",
    desc: "Electric borders",
    preview: "linear-gradient(135deg, #050505, oklch(0.15 0.05 140))",
  },
];

const RADIUS_TIERS: { id: RadiusTier; price: string; desc: string }[] = [
  { id: "free", price: "Free", desc: "500m" },
  { id: "basic", price: "$1.99", desc: "1km" },
  { id: "standard", price: "$4.99", desc: "5km" },
  { id: "premium", price: "$9.99", desc: "10km" },
];

export function SettingsPage({ onNavigate, onLogout }: SettingsPageProps) {
  const {
    currentUser,
    theme,
    setTheme,
    updateSettings,
    purchaseRadius,
    radiusLabel,
  } = useApp();
  const [radiusOpen, setRadiusOpen] = useState(false);
  const [purchasing, setPurchasing] = useState<RadiusTier | null>(null);
  const isLight = theme === "light-clean";
  const textColor = isLight ? "#111" : "white";
  const subColor = isLight ? "#666" : "rgba(255,255,255,0.45)";

  const handlePurchase = async (tier: RadiusTier) => {
    if (tier === "free") return;
    setPurchasing(tier);
    await new Promise((r) => setTimeout(r, 1200));
    purchaseRadius(tier);
    setPurchasing(null);
    setRadiusOpen(false);
    toast.success(`Upgraded to ${RADIUS_LABELS[tier]} radius! 🎉`);
  };

  const Section = ({
    icon: Icon,
    title,
    children,
  }: { icon: React.ElementType; title: string; children: React.ReactNode }) => (
    <div
      className="glass-card"
      style={{ padding: "18px 20px", marginBottom: 12 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Icon size={16} style={{ color: "oklch(0.8 0.15 200)" }} />
        <h2
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "oklch(0.8 0.15 200)",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  );

  const Row = ({
    label,
    children,
  }: { label: string; children: React.ReactNode }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBlock: 10,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ fontSize: 14, color: textColor }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div
      style={{ position: "relative", minHeight: "100dvh", paddingBottom: 100 }}
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
              color: textColor,
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Settings
          </h1>
        </div>

        {/* Account */}
        <Section icon={Shield} title="Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ paddingBlock: 8 }}>
              <p style={{ margin: 0, fontSize: 12, color: subColor }}>
                Display Name
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {currentUser?.displayName || "—"}
              </p>
            </div>
            <div
              style={{
                paddingBlock: 8,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: subColor }}>
                Username
              </p>
              <p style={{ margin: 0, fontSize: 15, color: textColor }}>
                @{currentUser?.username || "—"}
              </p>
            </div>
            <div
              style={{
                paddingBlock: 8,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, color: subColor }}>
                User ID
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: subColor,
                  fontFamily: "monospace",
                }}
              >
                {currentUser?.id || "—"}
              </p>
            </div>
          </div>
        </Section>

        {/* Location Radius */}
        <Section icon={MapPin} title="Location Radius">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: 14, color: textColor }}>
                Current radius
              </p>
              <Badge
                style={{
                  marginTop: 4,
                  background: "rgba(128,200,255,0.15)",
                  color: "oklch(0.8 0.15 200)",
                  border: "none",
                }}
              >
                {radiusLabel}
              </Badge>
            </div>
            <Button
              data-ocid="settings.radius.open_modal_button"
              onClick={() => setRadiusOpen(true)}
              size="sm"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                color: "white",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 4px 16px oklch(0.65 0.2 200 / 0.3)",
              }}
            >
              <Crown size={13} style={{ marginRight: 5 }} />
              Upgrade
            </Button>
          </div>
        </Section>

        {/* Themes */}
        <Section icon={Palette} title="Theme">
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {THEMES.map((t) => (
              <button
                type="button"
                key={t.id}
                data-ocid={`settings.theme.${t.id}.toggle`}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border:
                    theme === t.id
                      ? "2px solid oklch(0.8 0.15 200)"
                      : "2px solid transparent",
                  background: t.preview,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    color: t.id === "light-clean" ? "#333" : "white",
                  }}
                >
                  {t.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color:
                      t.id === "light-clean" ? "#777" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {t.desc}
                </p>
                {theme === t.id && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "oklch(0.8 0.15 200)",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={10} style={{ color: "#000" }} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Row label="Push notifications">
            <Switch
              data-ocid="settings.notifications.switch"
              checked={currentUser?.notifications ?? true}
              onCheckedChange={(v) => updateSettings({ notifications: v })}
            />
          </Row>
        </Section>

        {/* Privacy */}
        <Section icon={Shield} title="Privacy">
          <Row label="Show online status">
            <Switch
              data-ocid="settings.privacy.online.switch"
              checked={currentUser?.showOnlineStatus ?? true}
              onCheckedChange={(v) => updateSettings({ showOnlineStatus: v })}
            />
          </Row>
          <Row label="Show in radius search">
            <Switch
              data-ocid="settings.privacy.radius.switch"
              checked={currentUser?.showInRadius ?? true}
              onCheckedChange={(v) => updateSettings({ showInRadius: v })}
            />
          </Row>
        </Section>

        {/* Logout */}
        <Button
          data-ocid="settings.logout.button"
          onClick={onLogout}
          variant="destructive"
          style={{
            width: "100%",
            height: 48,
            borderRadius: 14,
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          <LogOut size={16} style={{ marginRight: 8 }} />
          Sign Out
        </Button>
      </div>

      {/* Radius Purchase Modal */}
      <Dialog open={radiusOpen} onOpenChange={setRadiusOpen}>
        <DialogContent
          data-ocid="settings.radius.dialog"
          style={{
            background: "oklch(0.12 0.03 280)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            color: "white",
            maxWidth: 380,
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{
                color: "white",
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 20,
              }}
            >
              Expand Your Radius
            </DialogTitle>
          </DialogHeader>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginTop: 8,
            }}
          >
            {RADIUS_TIERS.map((tier) => {
              const isCurrent = currentUser?.radiusTier === tier.id;
              const isPurchasing = purchasing === tier.id;
              return (
                <div
                  key={tier.id}
                  className="glass-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    border: isCurrent
                      ? "1px solid oklch(0.8 0.15 200)"
                      : undefined,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: 15,
                        color: "white",
                      }}
                    >
                      {tier.desc} radius
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {tier.price}
                    </p>
                  </div>
                  {isCurrent ? (
                    <Badge
                      style={{
                        background: "rgba(128,200,255,0.15)",
                        color: "oklch(0.8 0.15 200)",
                        border: "none",
                      }}
                    >
                      Current
                    </Badge>
                  ) : (
                    <Button
                      data-ocid={`settings.radius.${tier.id}.button`}
                      onClick={() => handlePurchase(tier.id)}
                      disabled={!!purchasing}
                      size="sm"
                      style={{
                        background:
                          "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        opacity: purchasing && !isPurchasing ? 0.5 : 1,
                      }}
                    >
                      {isPurchasing ? "Processing..." : "Purchase"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            data-ocid="settings.radius.cancel_button"
            onClick={() => setRadiusOpen(false)}
            variant="ghost"
            style={{
              marginTop: 4,
              color: "rgba(255,255,255,0.4)",
              width: "100%",
            }}
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      <BottomNav active="settings" onNavigate={onNavigate} />
    </div>
  );
}
