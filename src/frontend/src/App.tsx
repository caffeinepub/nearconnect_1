import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { BroadcastPopup } from "./components/BroadcastPopup";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { AdminPage } from "./pages/AdminPage";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatsListPage } from "./pages/ChatsListPage";
import { FriendsPage } from "./pages/FriendsPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";

/* ── Splash Screen ─────────────────────────────────────────────── */
function SplashScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "oklch(0.08 0.02 260)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, oklch(0.55 0.28 280 / 0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <img
        src="/assets/generated/vibezone-logo-transparent.dim_256x256.png"
        alt="VibeZone"
        style={{
          width: 88,
          height: 88,
          marginBottom: 20,
          filter: "drop-shadow(0 0 24px oklch(0.65 0.28 280 / 0.6))",
          animation: "splash-logo-pulse 2s ease-in-out infinite",
        }}
      />

      {/* App name */}
      <h1
        style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontSize: 34,
          fontWeight: 800,
          color: "white",
          margin: 0,
          marginBottom: 6,
          letterSpacing: -1,
          background:
            "linear-gradient(135deg, white 30%, oklch(0.75 0.22 280))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        VibeZone
      </h1>

      <p
        style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 13,
          margin: 0,
          marginBottom: 48,
          letterSpacing: 0.3,
        }}
      >
        Discover your vibe. Find your people.
      </p>

      {/* Spinner */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "oklch(0.65 0.25 280)",
          borderRightColor: "oklch(0.65 0.22 200)",
          animation: "splash-spin 0.85s linear infinite",
        }}
      />

      <style>{`
        @keyframes splash-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes splash-logo-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

const ADMIN_PASSWORD = "Qwerty12x";

type Page =
  | "auth"
  | "friends"
  | "chats"
  | "search"
  | "chat"
  | "settings"
  | "admin";

function isAdminPath(): boolean {
  return window.location.href.includes("adminproz");
}

function hasAdminSession(): boolean {
  return sessionStorage.getItem("nc_admin_access") === "granted";
}

function parseHash(): { page: Page; chatId: string | null } {
  const hash = window.location.hash.replace("#", "");
  const [path, query] = hash.split("?");
  const params = new URLSearchParams(query || "");

  switch (path) {
    case "friends":
      return { page: "friends", chatId: null };
    case "chats":
      return { page: "chats", chatId: null };
    case "search":
      return { page: "search", chatId: null };
    case "settings":
      return { page: "settings", chatId: null };
    case "admin":
      return { page: "admin", chatId: null };
    case "chat": {
      const id = params.get("id");
      return { page: "chat", chatId: id };
    }
    default:
      return { page: "auth", chatId: null };
  }
}

function navigate(page: Page, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  window.history.pushState({}, "", `#${page}${query}`);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function AdminGate() {
  const [entered, setEntered] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entered === ADMIN_PASSWORD) {
      sessionStorage.setItem("nc_admin_access", "granted");
      window.location.reload();
    } else {
      setError(true);
      setEntered("");
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.08 0.02 260)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: 32,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
              fontSize: 22,
            }}
          >
            🛡️
          </div>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "white",
              margin: 0,
            }}
          >
            Admin Access
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 13,
              marginTop: 6,
            }}
          >
            Enter the admin password to continue
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 11,
              marginTop: 8,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: "6px 10px",
              wordBreak: "break-all",
            }}
          >
            Access via:{" "}
            <strong style={{ color: "rgba(255,255,255,0.45)" }}>
              {window.location.origin}/#adminproz
            </strong>
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <input
            data-ocid="admin_gate.input"
            type="password"
            value={entered}
            onChange={(e) => {
              setEntered(e.target.value);
              setError(false);
            }}
            placeholder="Admin password"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: error
                ? "1px solid oklch(0.6 0.25 30)"
                : "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12,
              color: "white",
              padding: "12px 16px",
              fontSize: 15,
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p
              style={{
                margin: 0,
                color: "oklch(0.7 0.2 30)",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              Incorrect password
            </p>
          )}
          <button
            data-ocid="admin_gate.submit_button"
            type="submit"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.45 0.25 30), oklch(0.6 0.2 50))",
              border: "none",
              borderRadius: 12,
              color: "white",
              padding: "13px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Enter Admin Portal
          </button>
        </form>
      </div>
    </div>
  );
}

function AppInner() {
  const { currentUser, logout, incomingFriendRequests } = useApp();

  usePushNotifications({
    isLoggedIn: !!currentUser,
    incomingFriendRequestCount: (incomingFriendRequests || []).length,
  });
  const didMountRef = useRef(false);

  const [page, setPage] = useState<Page>(() => {
    const { page: p } = parseHash();
    if (!currentUser && p !== "auth") return "auth";
    if (currentUser && p === "auth") return "friends";
    return p;
  });
  const [chatFriendId, setChatFriendId] = useState<string | null>(() => {
    const { chatId } = parseHash();
    return chatId;
  });

  // On mount, fix hash if logged-in user is on auth route
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      if (currentUser) {
        const { page: p } = parseHash();
        if (p === "auth") {
          window.history.replaceState({}, "", "#friends");
          setPage("friends");
        }
      }
    }
  });

  // Sync page state from hash on popstate
  useEffect(() => {
    const handlePopState = () => {
      const { page: p, chatId } = parseHash();
      // If logged in and back button leads to auth, stay on friends
      if (currentUser && p === "auth") {
        window.history.replaceState({}, "", "#friends");
        setPage("friends");
        return;
      }
      if (!currentUser && p !== "auth") {
        setPage("auth");
        return;
      }
      setPage(p);
      if (chatId) setChatFriendId(chatId);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  // Auth guard: if no user and not on auth page, redirect
  useEffect(() => {
    if (!currentUser && page !== "auth") {
      navigate("auth");
      setPage("auth");
    }
  }, [currentUser, page]);

  const handleAuth = () => {
    navigate("friends");
    setPage("friends");
  };

  const handleLogout = () => {
    logout();
    navigate("auth");
    setPage("auth");
  };

  const handleOpenChat = (friendId: string) => {
    setChatFriendId(friendId);
    navigate("chat", { id: friendId });
    setPage("chat");
  };

  const handleNav = (
    dest: "friends" | "chats" | "search" | "settings" | "admin",
  ) => {
    navigate(dest);
    setPage(dest);
  };

  if (page === "auth") return <AuthPage onAuth={handleAuth} />;

  // Fixed-position container prevents dvh-induced layout shifts on mobile
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        height: "100%",
        overflow: "hidden",
        boxShadow: "0 0 80px rgba(80,100,255,0.15)",
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      <BroadcastPopup />
      {/* Scrollable page content area — leaves room for fixed bottom nav */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 72,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {page === "friends" && (
          <FriendsPage
            onNavigate={handleNav}
            onOpenChat={(id) => handleOpenChat(id)}
          />
        )}
        {page === "chats" && (
          <ChatsListPage
            onNavigate={handleNav}
            onOpenChat={(id) => handleOpenChat(id)}
          />
        )}
        {page === "search" && <SearchPage onNavigate={handleNav} />}
        {page === "settings" && (
          <SettingsPage onNavigate={handleNav} onLogout={handleLogout} />
        )}
        {page === "admin" && currentUser?.isAdmin && (
          <AdminPage onNavigate={handleNav} />
        )}
      </div>
      {/* ChatPage rendered OUTSIDE the scrollable wrapper so its own fixed
          header and input bar are never affected by the parent overflow:auto */}
      {page === "chat" && chatFriendId && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
          }}
        >
          <ChatPage
            friendId={chatFriendId}
            onBack={() => window.history.back()}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [adminPath] = useState(() => isAdminPath());
  const [adminSession] = useState(() => hasAdminSession());
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const minDelay = new Promise<void>((res) => setTimeout(res, 1400));
    const docReady = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });
    Promise.all([minDelay, docReady]).then(() => setAppReady(true));
  }, []);

  if (!appReady) return <SplashScreen />;

  if (adminPath && !adminSession) {
    return <AdminGate />;
  }

  if (adminPath && adminSession) {
    return (
      <AppProvider>
        <Toaster position="top-center" />
        <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh" }}>
          <AdminPage onNavigate={() => {}} />
        </div>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppInner />
    </AppProvider>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "12px",
        fontSize: 11,
        color: "rgba(255,255,255,0.2)",
      }}
    >
      © {year}.{" "}
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Built with ❤ using caffeine.ai
      </a>
    </footer>
  );
}
