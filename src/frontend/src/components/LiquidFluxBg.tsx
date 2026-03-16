import { useApp } from "../context/AppContext";

export function LiquidFluxBg() {
  const { theme } = useApp();

  if (theme === "light-clean") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "oklch(0.97 0.005 280)",
        }}
      />
    );
  }
  if (theme === "dark-minimal") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "#0f0f0f",
        }}
      />
    );
  }
  if (theme === "neon-pulse") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          background: "#050505",
        }}
      />
    );
  }

  return (
    <div className="liquid-flux-bg">
      <div className="liquid-flux-blob3" />
    </div>
  );
}
