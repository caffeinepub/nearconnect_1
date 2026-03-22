interface VipBadgeProps {
  status?: string;
}

export function VipBadge({ status }: VipBadgeProps) {
  if (!status || status === "none" || status === "") return null;

  if (status === "vvip") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          fontSize: 10,
          fontWeight: 700,
          background:
            "linear-gradient(135deg, oklch(0.45 0.28 295), oklch(0.6 0.22 280))",
          color: "white",
          borderRadius: 6,
          padding: "1px 6px",
          letterSpacing: 0.3,
          boxShadow: "0 1px 6px oklch(0.55 0.28 295 / 0.5)",
          flexShrink: 0,
        }}
      >
        ✦ V.VIP
      </span>
    );
  }

  if (status === "vip") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          fontSize: 10,
          fontWeight: 700,
          background:
            "linear-gradient(135deg, oklch(0.55 0.2 70), oklch(0.7 0.18 55))",
          color: "white",
          borderRadius: 6,
          padding: "1px 6px",
          letterSpacing: 0.3,
          boxShadow: "0 1px 6px oklch(0.65 0.2 60 / 0.5)",
          flexShrink: 0,
        }}
      >
        ★ VIP
      </span>
    );
  }

  return null;
}
