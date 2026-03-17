import { Instagram, Mail, MessageCircle } from "lucide-react";

export function DevFooter() {
  return (
    <footer
      style={{
        margin: "24px 16px 16px",
        background:
          "linear-gradient(135deg, rgba(80,50,180,0.12), rgba(30,150,255,0.1))",
        border: "1px solid rgba(120,100,255,0.2)",
        borderRadius: 20,
        padding: "18px 18px 14px",
        backdropFilter: "blur(12px)",
      }}
    >
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "rgba(180,160,255,0.7)",
          textAlign: "center",
        }}
      >
        Contact Developer · VibeZone Support
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Instagram */}
        <a
          href="https://www.instagram.com/er._ankush__singh?igsh=MXJoOW5lYzdrbnM2bg=="
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(220,39,67,0.4)",
            }}
          >
            <Instagram size={20} color="white" />
          </div>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.45)",
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
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(37,211,102,0.4)",
            }}
          >
            <MessageCircle size={20} color="white" />
          </div>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.45)",
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
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, oklch(0.5 0.25 260), oklch(0.65 0.2 280))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(100,80,255,0.4)",
            }}
          >
            <Mail size={20} color="white" />
          </div>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            Email
          </span>
        </a>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 10,
          color: "rgba(255,255,255,0.2)",
          textAlign: "center",
        }}
      >
        Made with ❤️ by Ankush Singh · 2026 · All rights reserved
      </p>
    </footer>
  );
}
