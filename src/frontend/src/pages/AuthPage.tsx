import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Zap } from "lucide-react";
import { useState } from "react";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { useApp } from "../context/AppContext";

interface AuthPageProps {
  onAuth: () => void;
}

export function AuthPage({ onAuth }: AuthPageProps) {
  const { login, signup } = useApp();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    if (tab === "login") {
      const ok = login(username.trim(), password);
      if (ok) {
        onAuth();
      } else {
        setError("Invalid username or password.");
      }
    } else {
      if (!username.trim() || !displayName.trim() || !password) {
        setError("All fields are required.");
        setLoading(false);
        return;
      }
      const ok = signup(username.trim(), displayName.trim(), password);
      if (ok) {
        onAuth();
      } else {
        setError("Username already taken.");
      }
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LiquidFluxBg />
      <div
        className="page-enter"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 380,
          padding: "0 20px",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
              marginBottom: 16,
              boxShadow: "0 0 32px oklch(0.65 0.2 200 / 0.5)",
            }}
          >
            <MapPin size={28} style={{ color: "white" }} />
          </div>
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              margin: 0,
              letterSpacing: -1,
            }}
          >
            NearConnect
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 14,
              marginTop: 4,
            }}
          >
            Find friends around you
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.07)",
            borderRadius: 14,
            padding: 4,
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            data-ocid="auth.login.tab"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background:
                tab === "login" ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === "login" ? "white" : "rgba(255,255,255,0.4)",
              fontWeight: tab === "login" ? 600 : 400,
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            data-ocid="auth.signup.tab"
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background:
                tab === "signup" ? "rgba(255,255,255,0.12)" : "transparent",
              color: tab === "signup" ? "white" : "rgba(255,255,255,0.4)",
              fontWeight: tab === "signup" ? 600 : 400,
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="glass-card"
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {tab === "signup" && (
            <div>
              <Label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Display Name
              </Label>
              <Input
                data-ocid="auth.displayname.input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{
                  marginTop: 6,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white",
                }}
              />
            </div>
          )}
          <div>
            <Label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              Username or ID
            </Label>
            <Input
              data-ocid="auth.username.input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@username"
              style={{
                marginTop: 6,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
              }}
            />
          </div>
          <div>
            <Label style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              Password
            </Label>
            <Input
              data-ocid="auth.password.input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                marginTop: 6,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
              }}
            />
          </div>

          {error && (
            <p
              data-ocid="auth.error_state"
              style={{
                color: "oklch(0.75 0.2 25)",
                fontSize: 13,
                margin: 0,
                padding: "8px 12px",
                background: "rgba(255,50,50,0.1)",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          <Button
            data-ocid="auth.submit_button"
            type="submit"
            disabled={loading}
            style={{
              background:
                "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
              color: "white",
              fontWeight: 600,
              borderRadius: 12,
              height: 48,
              fontSize: 15,
              marginTop: 4,
              border: "none",
              boxShadow: "0 4px 20px oklch(0.65 0.2 200 / 0.4)",
            }}
          >
            <Zap size={16} style={{ marginRight: 6 }} />
            {loading
              ? "Please wait..."
              : tab === "login"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: 16,
            color: "rgba(255,255,255,0.3)",
            fontSize: 12,
          }}
        >
          {tab === "login" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setTab(tab === "login" ? "signup" : "login");
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "oklch(0.8 0.15 200)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {tab === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
