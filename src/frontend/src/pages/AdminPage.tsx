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
  CheckCircle2,
  ChevronLeft,
  Gift,
  Loader2,
  Megaphone,
  Shield,
  ShoppingCart,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { createActorWithConfig } from "../config";
import { type RadiusTier, useApp } from "../context/AppContext";

interface AdminPageProps {
  onNavigate: (page: "friends" | "search" | "settings" | "admin") => void;
}

const TIER_LABELS: Record<RadiusTier, string> = {
  free: "Free (500m)",
  basic: "Basic (1km)",
  standard: "Standard (5km)",
  premium: "Premium (10km)",
};

const TIER_BADGE_COLORS: Record<
  RadiusTier,
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
};

export function AdminPage({ onNavigate }: AdminPageProps) {
  const {
    allRealUsers,
    deleteUser,
    currentUser,
    theme,
    purchaseSettings,
    savePurchaseSettings,
    grantPurchaseToUser,
  } = useApp();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const isLight = theme === "light-clean";

  // Per-user grant tier state
  const [grantTiers, setGrantTiers] = useState<Record<string, RadiusTier>>({});
  const [grantingUsers, setGrantingUsers] = useState<Record<string, boolean>>(
    {},
  );
  const [grantSuccess, setGrantSuccess] = useState<Record<string, boolean>>({});

  // Purchase settings local state
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
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastStatus, setBroadcastStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setBroadcastStatus("loading");
    try {
      const actor = await createActorWithConfig();
      await actor.broadcastMessage(broadcastText.trim());
      setBroadcastText("");
      setBroadcastStatus("success");
      setTimeout(() => setBroadcastStatus("idle"), 2500);
    } catch {
      setBroadcastStatus("error");
      setTimeout(() => setBroadcastStatus("idle"), 3000);
    }
  };

  const displayUsers = allRealUsers.filter((u) => !u.isBot);

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
      // silent
    } finally {
      setGrantingUsers((prev) => ({ ...prev, [userId]: false }));
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

  const inputStyle = {
    background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)",
    border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    color: isLight ? "#111" : "white",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      data-ocid="admin.page"
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
        }}
      >
        {/* Header */}
        <div style={{ paddingTop: 56, paddingBottom: 20 }}>
          {/* Back button */}
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
              color: isLight ? "#555" : "rgba(255,255,255,0.5)",
              fontSize: 13,
              padding: "4px 0",
              marginBottom: 14,
            }}
          >
            <ChevronLeft size={17} />
            Back
          </button>

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
              const isAdminUser = user.isAdmin === true;
              const isPendingDelete = confirmDelete === user.id;
              const currentTier = user.radiusTier || "free";
              const tierColors = TIER_BADGE_COLORS[currentTier];
              const isGranting = grantingUsers[user.id];
              const didGrantSuccess = grantSuccess[user.id];
              return (
                <div
                  key={user.id}
                  data-ocid={`admin.user.item.${i + 1}`}
                  className="glass-card"
                  style={{
                    padding: "14px 16px",
                    border: isPendingDelete
                      ? "1px solid oklch(0.6 0.25 30 / 0.5)"
                      : undefined,
                  }}
                >
                  {/* Top row: avatar + info + delete */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: isAdminUser
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
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
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
                        {isAdminUser && (
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
                        {/* Tier badge */}
                        <span
                          style={{
                            fontSize: 10,
                            background: tierColors.bg,
                            color: tierColors.color,
                            border: `1px solid ${tierColors.border}`,
                            borderRadius: 6,
                            padding: "1px 6px",
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {currentTier}
                        </span>
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
                    {!isAdminUser ? (
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
                          color: isPendingDelete
                            ? "white"
                            : "oklch(0.7 0.2 30)",
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

                  {/* Grant purchase row — only for non-admin users */}
                  {!isAdminUser && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.07)"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Gift
                        size={13}
                        style={{ color: "oklch(0.75 0.18 280)", flexShrink: 0 }}
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
                            height: 32,
                            fontSize: 12,
                            background: isLight
                              ? "rgba(0,0,0,0.05)"
                              : "rgba(255,255,255,0.07)",
                            border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 8,
                            color: isLight ? "#333" : "rgba(255,255,255,0.85)",
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
                          fontSize: 12,
                          padding: "6px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          flexShrink: 0,
                          transition: "background 0.3s",
                        }}
                      >
                        {isGranting ? (
                          <Loader2
                            size={12}
                            style={{ animation: "spin 0.8s linear infinite" }}
                          />
                        ) : didGrantSuccess ? (
                          <CheckCircle2 size={12} />
                        ) : null}
                        {isGranting
                          ? "Granting..."
                          : didGrantSuccess
                            ? "Granted!"
                            : "Grant"}
                      </Button>
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
              data-ocid="admin.cancel_button"
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

        {/* In-App Purchases Section */}
        <div
          data-ocid="admin.purchases.section"
          style={{
            marginTop: 28,
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 18,
            padding: "20px 18px",
          }}
        >
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShoppingCart size={16} style={{ color: "white" }} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: isLight ? "#111" : "white",
                  margin: 0,
                }}
              >
                In-App Purchases
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                Control radius upgrade pricing
              </p>
            </div>
          </div>

          {/* Enable toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              padding: "12px 14px",
              background: isLight
                ? "rgba(0,0,0,0.04)"
                : "rgba(255,255,255,0.05)",
              borderRadius: 12,
            }}
          >
            <div>
              <Label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isLight ? "#111" : "white",
                  cursor: "pointer",
                }}
              >
                Enable Purchases
              </Label>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                  marginTop: 2,
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

          {/* Price inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                label: "Basic (1km)",
                value: basicPrice,
                onChange: setBasicPrice,
                ocid: "admin.purchases.input",
              },
              {
                label: "Standard (5km)",
                value: standardPrice,
                onChange: setStandardPrice,
                ocid: "admin.purchases.input",
              },
              {
                label: "Premium (10km)",
                value: premiumPrice,
                onChange: setPremiumPrice,
                ocid: "admin.purchases.input",
              },
            ].map(({ label, value, onChange, ocid }) => (
              <div key={label}>
                <Label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isLight ? "#555" : "rgba(255,255,255,0.55)",
                    display: "block",
                    marginBottom: 5,
                  }}
                >
                  {label}
                </Label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: isLight ? "#888" : "rgba(255,255,255,0.35)",
                      fontSize: 14,
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
                    data-ocid={ocid}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Save button */}
          <div style={{ marginTop: 18 }}>
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
          </div>

          {/* Status messages */}
          {saveStatus === "success" && (
            <div
              data-ocid="admin.purchases.success_state"
              style={{
                marginTop: 10,
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
                marginTop: 10,
                fontSize: 12,
                color: "oklch(0.7 0.2 30)",
                textAlign: "center",
              }}
            >
              Failed to save. Please try again.
            </div>
          )}
        </div>

        {/* Broadcast Section */}
        <div
          data-ocid="admin.broadcast.section"
          style={{
            marginTop: 28,
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 18,
            padding: "20px 18px",
          }}
        >
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
                width: 34,
                height: 34,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, oklch(0.5 0.25 30), oklch(0.65 0.2 50))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Megaphone size={16} style={{ color: "white" }} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: isLight ? "#111" : "white",
                  margin: 0,
                }}
              >
                Broadcast Message
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: isLight ? "#888" : "rgba(255,255,255,0.4)",
                }}
              >
                Send a popup announcement to all users
              </p>
            </div>
          </div>
          <textarea
            data-ocid="admin.broadcast.textarea"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            placeholder="Type a broadcast message to all users..."
            rows={3}
            style={{
              width: "100%",
              background: isLight
                ? "rgba(0,0,0,0.05)"
                : "rgba(255,255,255,0.07)",
              border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 14,
              color: isLight ? "#111" : "white",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
          <Button
            data-ocid="admin.broadcast.submit_button"
            onClick={handleBroadcast}
            disabled={broadcastStatus === "loading" || !broadcastText.trim()}
            style={{
              marginTop: 10,
              width: "100%",
              borderRadius: 12,
              background:
                broadcastStatus === "success"
                  ? "linear-gradient(135deg, oklch(0.5 0.2 145), oklch(0.65 0.18 160))"
                  : broadcastStatus === "error"
                    ? "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))"
                    : "linear-gradient(135deg, oklch(0.5 0.25 30), oklch(0.65 0.2 50))",
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
            }}
          >
            {broadcastStatus === "loading" && (
              <Loader2
                size={15}
                style={{ animation: "spin 0.8s linear infinite" }}
              />
            )}
            {broadcastStatus === "success" && <CheckCircle2 size={15} />}
            {broadcastStatus === "error" && <AlertTriangle size={15} />}
            {broadcastStatus === "loading"
              ? "Sending..."
              : broadcastStatus === "success"
                ? "Sent!"
                : broadcastStatus === "error"
                  ? "Failed"
                  : "Send to All Users"}
          </Button>
        </div>

        <div style={{ height: 24 }} />
      </div>
      {/* Footer always at bottom */}
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 24 }}>
        <DevFooter />
      </div>
    </div>
  );
}
