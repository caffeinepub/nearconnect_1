export function DevFooter() {
  return (
    <footer
      style={{
        margin: "24px 16px 16px",
        background:
          "linear-gradient(135deg, rgba(80,50,180,0.12), rgba(30,150,255,0.1))",
        border: "1px solid rgba(120,100,255,0.2)",
        borderRadius: 20,
        padding: "14px 18px",
        backdropFilter: "blur(12px)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.4,
          background:
            "linear-gradient(90deg, rgba(180,160,255,0.8), rgba(100,200,255,0.8))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Made with ❤️ by Ankush Singh © 2026 ® All rights reserved
      </p>
    </footer>
  );
}
