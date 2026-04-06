import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DevFooter } from "../components/DevFooter";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { type SavedAccount, useApp } from "../context/AppContext";

interface AuthPageProps {
  onAuth: () => void;
}

type AuthView = "switcher" | "login" | "signup";

// Inline keyframe styles injected once
const AUTH_STYLES = `
  @keyframes auth-card-in {
    from { opacity: 0; transform: translateY(32px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)   scale(1); }
  }
  @keyframes logo-pulse {
    0%, 100% { box-shadow: 0 0 0 0 oklch(0.65 0.28 285 / 0.6), 0 0 40px oklch(0.72 0.22 200 / 0.5); }
    50%       { box-shadow: 0 0 0 14px oklch(0.65 0.28 285 / 0), 0 0 60px oklch(0.72 0.22 200 / 0.7); }
  }
  @keyframes float-dot {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.35; }
    50%       { transform: translateY(-18px) translateX(8px); opacity: 0.7; }
  }
  @keyframes gradient-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes tab-slide {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-card-enter { animation: auth-card-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .auth-logo-pulse { animation: logo-pulse 3s ease-in-out infinite; }
  .auth-gradient-text {
    background: linear-gradient(90deg, oklch(0.75 0.22 285), oklch(0.85 0.18 200), oklch(0.75 0.22 285));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-shift 4s ease infinite;
  }
  .auth-btn-shimmer {
    background: linear-gradient(135deg, oklch(0.5 0.28 285), oklch(0.6 0.25 220), oklch(0.65 0.22 200));
    background-size: 200% auto;
    animation: shimmer 2.5s linear infinite;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .auth-btn-shimmer:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 28px oklch(0.6 0.25 220 / 0.55);
  }
  .auth-input {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    color: white !important;
    border-radius: 14px !important;
    height: 50px !important;
    font-size: 15px !important;
    padding: 0 16px !important;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-input::placeholder { color: rgba(255,255,255,0.3) !important; }
  .auth-input:focus {
    border-color: oklch(0.7 0.22 285 / 0.8) !important;
    box-shadow: 0 0 0 3px oklch(0.7 0.22 285 / 0.2) !important;
    outline: none !important;
  }
  .auth-tab-active {
    background: linear-gradient(135deg, oklch(0.5 0.28 285 / 0.35), oklch(0.65 0.22 200 / 0.35)) !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 12px oklch(0.6 0.25 220 / 0.3);
  }
  .auth-tab-inactive {
    background: transparent !important;
    color: rgba(255,255,255,0.4) !important;
    font-weight: 400 !important;
  }
  .auth-tab-inactive:hover { color: rgba(255,255,255,0.7) !important; }
  .auth-account-card {
    transition: all 0.18s ease;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 14px;
    cursor: pointer;
  }
  .auth-account-card:hover { background: rgba(255,255,255,0.09) !important; border-color: rgba(255,255,255,0.18) !important; }
  .auth-account-card-active {
    background: linear-gradient(135deg, oklch(0.5 0.28 285 / 0.2), oklch(0.65 0.22 200 / 0.2)) !important;
    border-color: oklch(0.7 0.22 285 / 0.45) !important;
  }
  @keyframes auth-shake {
    0%, 100% { transform: translateX(0); }
    15% { transform: translateX(-8px); }
    30% { transform: translateX(8px); }
    45% { transform: translateX(-6px); }
    60% { transform: translateX(6px); }
    75% { transform: translateX(-3px); }
    90% { transform: translateX(3px); }
  }
  @keyframes auth-success {
    0% { transform: scale(0.8); opacity: 0; }
    50% { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes auth-success-ring {
    0% { box-shadow: 0 0 0 0 oklch(0.72 0.25 145 / 0.8); }
    100% { box-shadow: 0 0 0 20px oklch(0.72 0.25 145 / 0); }
  }
  .auth-shake { animation: auth-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
  .auth-success-icon { animation: auth-success 0.4s cubic-bezier(0.22, 1, 0.36, 1) both, auth-success-ring 0.6s ease-out 0.2s both; }

  @keyframes welcome-pop {
    0%   { transform: scale(0.5); opacity: 0; }
    60%  { transform: scale(1.12); opacity: 1; }
    80%  { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes welcome-text-in {
    0%   { opacity: 0; transform: translateY(18px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes confetti-float {
    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-120px) scale(0.4) rotate(360deg); opacity: 0; }
  }
  @keyframes welcome-overlay-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes welcome-back-wave {
    0%   { transform: rotate(0deg); }
    20%  { transform: rotate(-20deg); }
    40%  { transform: rotate(20deg); }
    60%  { transform: rotate(-15deg); }
    80%  { transform: rotate(10deg); }
    100% { transform: rotate(0deg); }
  }
  .welcome-pop  { animation: welcome-pop  0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
  .welcome-text { animation: welcome-text-in 0.4s ease 0.25s both; }
  .welcome-back-wave { animation: welcome-back-wave 0.8s ease 0.3s both; display: inline-block; }
  .welcome-overlay-in { animation: welcome-overlay-in 0.25s ease both; }
`;

// Floating particles background
const PARTICLES = [
  { id: "p1", size: 3, top: "12%", left: "8%", delay: "0s", dur: "6s" },
  { id: "p2", size: 2, top: "28%", left: "88%", delay: "1.2s", dur: "7.5s" },
  { id: "p3", size: 4, top: "65%", left: "5%", delay: "0.6s", dur: "8s" },
  { id: "p4", size: 2, top: "78%", left: "82%", delay: "2s", dur: "6.5s" },
  { id: "p5", size: 3, top: "44%", left: "92%", delay: "0.4s", dur: "9s" },
  { id: "p6", size: 2, top: "88%", left: "35%", delay: "1.8s", dur: "7s" },
  { id: "p7", size: 3, top: "20%", left: "60%", delay: "3s", dur: "5.5s" },
  { id: "p8", size: 2, top: "55%", left: "18%", delay: "1.5s", dur: "8.5s" },
];

const CONFETTI_DOTS = [
  { color: "oklch(0.8 0.25 285)", left: "38%", delay: "0s", size: 10 },
  { color: "oklch(0.85 0.2 60)", left: "50%", delay: "0.1s", size: 8 },
  { color: "oklch(0.75 0.28 340)", left: "44%", delay: "0.05s", size: 12 },
  { color: "oklch(0.8 0.22 160)", left: "56%", delay: "0.15s", size: 9 },
  { color: "oklch(0.85 0.2 200)", left: "62%", delay: "0.08s", size: 7 },
];

const FIELD_LABEL_STYLE: React.CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

export function AuthPage({ onAuth }: AuthPageProps) {
  const { login, signup, savedAccounts, switchAccount } = useApp();
  const [view, setView] = useState<AuthView>("signup");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [successType, setSuccessType] = useState<"login" | "signup" | null>(
    null,
  );
  const [successName, setSuccessName] = useState("");
  const stylesInjected = useRef(false);

  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(
    null,
  );
  const [switcherPassword, setSwitcherPassword] = useState("");
  const [switcherError, setSwitcherError] = useState("");

  useEffect(() => {
    if (!stylesInjected.current) {
      const tag = document.createElement("style");
      tag.textContent = AUTH_STYLES;
      document.head.appendChild(tag);
      stylesInjected.current = true;
    }
  }, []);

  useEffect(() => {
    if (savedAccounts.length > 0) {
      setView("switcher");
    }
  }, [savedAccounts.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (view === "login") {
      const ok = await login(username.trim(), password);
      if (ok) {
        setSuccessName(username.trim());
        setSuccessType("login");
        await new Promise((r) => setTimeout(r, 700));
        onAuth();
      } else {
        setError("Invalid username or password.");
        setShakeKey((k) => k + 1);
      }
    } else {
      if (!username.trim() || !displayName.trim() || !password) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }
      const result = await signup(
        username.trim(),
        displayName.trim(),
        password,
      );
      if (result.success) {
        setSuccessName(username.trim());
        setSuccessType("signup");
        await new Promise((r) => setTimeout(r, 700));
        onAuth();
      } else {
        setError(result.error);
        setShakeKey((k) => k + 1);
      }
    }
    setLoading(false);
  };

  const handleSwitcherSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    setSwitcherError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const ok = await switchAccount(selectedAccount.username, switcherPassword);
    if (ok) {
      setSuccessName(selectedAccount.username);
      setSuccessType("login");
      await new Promise((r) => setTimeout(r, 700));
      onAuth();
    } else {
      setSwitcherError("Wrong password. Please try again.");
      setShakeKey((k) => k + 1);
    }
    setLoading(false);
  };

  const renderParticles = () =>
    PARTICLES.map((p, idx) => (
      <div
        key={p.id}
        style={{
          position: "fixed",
          width: p.size,
          height: p.size,
          borderRadius: "50%",
          background:
            idx % 2 === 0 ? "oklch(0.75 0.22 285)" : "oklch(0.8 0.18 200)",
          top: p.top,
          left: p.left,
          animation: `float-dot ${p.dur} ease-in-out ${p.delay} infinite`,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    ));

  // Success overlay
  const renderSuccessOverlay = () => {
    if (!successType) return null;
    const isSignup = successType === "signup";
    return (
      <div
        className="welcome-overlay-in"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isSignup
            ? "rgba(4, 8, 22, 0.82)"
            : "rgba(4, 14, 20, 0.82)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Confetti dots for signup */}
        {isSignup &&
          CONFETTI_DOTS.map((dot) => (
            <div
              key={dot.color}
              style={{
                position: "absolute",
                bottom: "50%",
                left: dot.left,
                width: dot.size,
                height: dot.size,
                borderRadius: "50%",
                background: dot.color,
                animation: `confetti-float 1.2s ease-out ${dot.delay} both`,
                pointerEvents: "none",
              }}
            />
          ))}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          {/* Icon circle */}
          <div
            className="welcome-pop"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: isSignup
                ? "linear-gradient(135deg, oklch(0.5 0.28 285), oklch(0.65 0.22 200))"
                : "linear-gradient(135deg, oklch(0.48 0.22 145), oklch(0.65 0.18 160))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              boxShadow: isSignup
                ? "0 0 48px oklch(0.6 0.25 220 / 0.6)"
                : "0 0 48px oklch(0.6 0.22 160 / 0.6)",
            }}
          >
            {isSignup ? "🎉" : "👋"}
          </div>

          {/* Main heading */}
          <div className="welcome-text" style={{ lineHeight: 1.1 }}>
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                letterSpacing: -1,
                background: isSignup
                  ? "linear-gradient(90deg, oklch(0.75 0.22 285), oklch(0.85 0.18 200), oklch(0.9 0.15 60))"
                  : "linear-gradient(90deg, oklch(0.8 0.18 160), oklch(0.85 0.18 200))",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {isSignup ? (
                "Welcome to VibeZone!"
              ) : (
                <>
                  Welcome back, {successName}!{" "}
                  <span className="welcome-back-wave">👋</span>
                </>
              )}
            </h2>
            <p
              style={{
                marginTop: 10,
                color: "rgba(255,255,255,0.55)",
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              {isSignup
                ? "Your account is ready. Let's find your vibe!"
                : "Good to see you again."}
            </p>
          </div>

          {/* Checkmark badge */}
          <div
            className="welcome-text"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: isSignup
                ? "oklch(0.55 0.22 285 / 0.2)"
                : "oklch(0.5 0.2 160 / 0.2)",
              border: isSignup
                ? "1px solid oklch(0.65 0.22 285 / 0.35)"
                : "1px solid oklch(0.65 0.2 160 / 0.35)",
              borderRadius: 100,
              padding: "8px 20px",
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 500,
              animationDelay: "0.4s",
            }}
          >
            <span
              style={{
                color: isSignup
                  ? "oklch(0.8 0.22 285)"
                  : "oklch(0.75 0.22 160)",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              ✓
            </span>
            {isSignup ? "Account created" : "Authentication successful"}
          </div>
        </div>
      </div>
    );
  };

  // Shared hero section
  const hero = (
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div
        className="auth-logo-pulse"
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          margin: "0 auto 18px",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, oklch(0.5 0.28 285), oklch(0.65 0.22 200))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/assets/generated/vibezone-logo-transparent.dim_256x256.png"
          alt="VibeZone"
          style={{ width: 80, height: 80, objectFit: "cover" }}
        />
      </div>
      <h1
        className="auth-gradient-text"
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 36,
          fontWeight: 800,
          margin: 0,
          letterSpacing: -1.5,
          lineHeight: 1.1,
        }}
      >
        VibeZone
      </h1>
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 13.5,
          marginTop: 8,
          letterSpacing: 0.2,
        }}
      >
        Discover your vibe. Find your people.
      </p>
    </div>
  );

  // ---- SWITCHER VIEW ----
  if (view === "switcher") {
    return (
      <div
        style={{
          position: "relative",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 20px",
        }}
      >
        <LiquidFluxBg />
        {renderParticles()}
        {renderSuccessOverlay()}

        <div
          key={shakeKey > 0 ? `card-${shakeKey}` : "card"}
          className={`auth-card-enter${shakeKey > 0 ? " auth-shake" : ""}`}
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: 400,
          }}
        >
          {hero}

          <div
            data-ocid="auth.switcher.section"
            style={{
              background: "rgba(15, 12, 28, 0.75)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              padding: 24,
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            <p
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "white",
                margin: "0 0 4px",
              }}
            >
              Welcome back
            </p>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                margin: "0 0 20px",
              }}
            >
              Choose an account to continue
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {savedAccounts.map((account, idx) => (
                <div key={account.username}>
                  <button
                    type="button"
                    data-ocid={`auth.account.item.${idx + 1}`}
                    className={`auth-account-card ${
                      selectedAccount?.username === account.username
                        ? "auth-account-card-active"
                        : ""
                    }`}
                    onClick={() => {
                      if (selectedAccount?.username === account.username) {
                        setSelectedAccount(null);
                        setSwitcherPassword("");
                        setSwitcherError("");
                      } else {
                        setSelectedAccount(account);
                        setSwitcherPassword("");
                        setSwitcherError("");
                      }
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, oklch(0.5 0.28 285), oklch(0.65 0.22 200))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 17,
                        color: "white",
                        flexShrink: 0,
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                      }}
                    >
                      {account.displayName[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 14,
                          color: "white",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {account.displayName}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        @{account.username}
                      </p>
                    </div>
                    <UserCircle2
                      size={16}
                      style={{
                        color:
                          selectedAccount?.username === account.username
                            ? "oklch(0.8 0.18 200)"
                            : "rgba(255,255,255,0.25)",
                        flexShrink: 0,
                      }}
                    />
                  </button>

                  {selectedAccount?.username === account.username && (
                    <form
                      onSubmit={handleSwitcherSignIn}
                      style={{
                        marginTop: 8,
                        padding: "16px",
                        background: "rgba(255,255,255,0.04)",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        animation: "tab-slide 0.2s ease both",
                      }}
                    >
                      <Input
                        data-ocid="auth.account.password.input"
                        type="password"
                        value={switcherPassword}
                        onChange={(e) => setSwitcherPassword(e.target.value)}
                        placeholder="Enter password"
                        autoFocus
                        className="auth-input"
                      />
                      {switcherError && (
                        <p
                          data-ocid="auth.error_state"
                          style={{
                            color: "oklch(0.75 0.2 25)",
                            fontSize: 12,
                            margin: 0,
                          }}
                        >
                          {switcherError}
                        </p>
                      )}
                      <Button
                        data-ocid="auth.account.signin.button"
                        type="submit"
                        disabled={loading || !switcherPassword}
                        className="auth-btn-shimmer"
                        style={{
                          color: "white",
                          fontWeight: 600,
                          borderRadius: 12,
                          height: 44,
                          fontSize: 14,
                          border: "none",
                          width: "100%",
                        }}
                      >
                        {loading ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : null}
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              data-ocid="auth.add_account.button"
              onClick={() => {
                setView("signup");
                setError("");
                setUsername("");
                setDisplayName("");
                setPassword("");
              }}
              style={{
                width: "100%",
                marginTop: 14,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.18s",
              }}
            >
              <Plus size={15} />
              Add Account
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              data-ocid="auth.different_account.button"
              onClick={() => {
                setView("login");
                setError("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "oklch(0.78 0.18 200)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Use a different account
            </button>
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              color: "rgba(255,255,255,0.2)",
              fontSize: 11,
            }}
          >
            Made with ❤️ by Ankush Singh · 2026 · All rights reserved
          </p>
        </div>
      </div>
    );
  }

  // ---- LOGIN / SIGNUP VIEW ----
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <LiquidFluxBg />
      {renderParticles()}
      {renderSuccessOverlay()}

      <div
        className="auth-card-enter"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 400,
        }}
      >
        {hero}

        {/* Pill tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 100,
            padding: 5,
            marginBottom: 20,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <button
            type="button"
            data-ocid="auth.login.tab"
            className={
              view === "login" ? "auth-tab-active" : "auth-tab-inactive"
            }
            onClick={() => {
              setView("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.22s ease",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            data-ocid="auth.signup.tab"
            className={
              view === "signup" ? "auth-tab-active" : "auth-tab-inactive"
            }
            onClick={() => {
              setView("signup");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 100,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              transition: "all 0.22s ease",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Glass form card */}
        <div
          style={{
            background: "rgba(15, 12, 28, 0.75)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: 28,
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          <form
            key={view}
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              animation: "tab-slide 0.22s ease both",
            }}
          >
            {view === "signup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor="auth-displayname" style={FIELD_LABEL_STYLE}>
                  Display Name
                </label>
                <Input
                  id="auth-displayname"
                  data-ocid="auth.displayname.input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="auth-input"
                />
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="auth-username" style={FIELD_LABEL_STYLE}>
                Username or ID
              </label>
              <Input
                id="auth-username"
                data-ocid="auth.username.input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="auth-input"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="auth-password" style={FIELD_LABEL_STYLE}>
                Password
              </label>
              <Input
                id="auth-password"
                data-ocid="auth.password.input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
              />
            </div>

            {error && (
              <div
                data-ocid="auth.error_state"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "oklch(0.82 0.18 25)",
                  fontSize: 13,
                  padding: "10px 14px",
                  background: "oklch(0.65 0.22 25 / 0.1)",
                  borderRadius: 12,
                  border: "1px solid oklch(0.65 0.22 25 / 0.25)",
                }}
              >
                <span style={{ fontSize: 15 }}>⚠️</span>
                {error}
              </div>
            )}

            <Button
              data-ocid="auth.submit_button"
              type="submit"
              disabled={loading}
              className="auth-btn-shimmer"
              style={{
                color: "white",
                fontWeight: 700,
                borderRadius: 14,
                height: 52,
                fontSize: 16,
                marginTop: 4,
                border: "none",
                width: "100%",
                letterSpacing: 0.3,
                boxShadow: "0 4px 24px oklch(0.6 0.25 220 / 0.4)",
              }}
            >
              {loading ? (
                <Loader2 size={18} className="mr-2 animate-spin" />
              ) : null}
              {loading
                ? "Please wait..."
                : view === "login"
                  ? "Sign In"
                  : "Create Account"}
            </Button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          {savedAccounts.length > 0 ? (
            <button
              type="button"
              onClick={() => setView("switcher")}
              style={{
                background: "none",
                border: "none",
                color: "oklch(0.78 0.18 200)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ← Back to accounts
            </button>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              {view === "login" ? "New here? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setView(view === "login" ? "signup" : "login");
                  setError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "oklch(0.78 0.18 200)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {view === "login" ? "Create account" : "Sign in"}
              </button>
            </span>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
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
              color: "rgba(255,255,255,0.55)",
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
              color: "rgba(255,255,255,0.55)",
              textDecoration: "underline",
            }}
          >
            Terms & Conditions
          </a>
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "rgba(255,255,255,0.2)",
            fontSize: 11,
          }}
        >
          Made with ❤️ by Ankush Singh · 2026 · All rights reserved
        </p>
        <DevFooter />
      </div>
    </div>
  );
}
