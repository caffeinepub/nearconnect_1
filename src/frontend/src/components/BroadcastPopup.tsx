import { Megaphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createActorWithConfig } from "../config";
import { useApp } from "../context/AppContext";

export function BroadcastPopup() {
  const { currentUser } = useApp();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: poll by user id only
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    const checkBroadcast = async () => {
      try {
        const actor = await createActorWithConfig();
        const result = await actor.getLatestBroadcast();
        if (cancelled) return;
        if (result) {
          const ts = String(result.timestamp);
          const lastSeen = localStorage.getItem("vz_last_broadcast_ts");
          if (lastSeen !== ts) {
            setMessage(result.text);
            setVisible(true);
          }
        }
      } catch {
        // silent
      }
    };

    checkBroadcast();
    const interval = setInterval(checkBroadcast, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  const handleDismiss = async () => {
    setVisible(false);
    try {
      const actor = await createActorWithConfig();
      const result = await actor.getLatestBroadcast();
      if (result) {
        localStorage.setItem("vz_last_broadcast_ts", String(result.timestamp));
      }
    } catch {
      // silent
    }
    setTimeout(() => setMessage(null), 300);
  };

  if (!message) return null;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
      onClick={handleDismiss}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop propagation only */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 360,
          background:
            "linear-gradient(135deg, rgba(20,15,50,0.98), rgba(10,10,30,0.98))",
          border: "1px solid rgba(120,100,255,0.3)",
          borderRadius: 24,
          padding: "28px 24px",
          boxShadow:
            "0 24px 80px rgba(80,60,255,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
          transform: visible
            ? "scale(1) translateY(0)"
            : "scale(0.9) translateY(20px)",
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            transition: "background 0.15s",
          }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, oklch(0.5 0.25 30), oklch(0.65 0.2 50))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
            boxShadow: "0 8px 24px oklch(0.5 0.25 30 / 0.4)",
          }}
        >
          <Megaphone size={24} style={{ color: "white" }} />
        </div>

        {/* Title */}
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color: "oklch(0.75 0.2 50)",
          }}
        >
          Announcement from VibeZone
        </p>

        {/* Message */}
        <p
          style={{
            margin: "0 0 22px",
            fontSize: 16,
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.5,
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}
        >
          {message}
        </p>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 14,
            background:
              "linear-gradient(135deg, oklch(0.45 0.2 260), oklch(0.6 0.18 280))",
            border: "none",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: 0.3,
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
