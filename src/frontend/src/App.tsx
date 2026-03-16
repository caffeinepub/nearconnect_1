import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AppProvider } from "./context/AppContext";
import { useApp } from "./context/AppContext";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { FriendsPage } from "./pages/FriendsPage";
import { SearchPage } from "./pages/SearchPage";
import { SettingsPage } from "./pages/SettingsPage";

type Page = "auth" | "friends" | "search" | "chat" | "settings";

function AppInner() {
  const { currentUser, logout } = useApp();
  const [page, setPage] = useState<Page>(currentUser ? "friends" : "auth");
  const [chatFriendId, setChatFriendId] = useState<string | null>(null);

  const handleAuth = () => setPage("friends");

  const handleLogout = () => {
    logout();
    setPage("auth");
  };

  const handleOpenChat = (friendId: string) => {
    setChatFriendId(friendId);
    setPage("chat");
  };

  const handleNav = (dest: "friends" | "search" | "settings") => {
    setPage(dest);
  };

  if (!currentUser && page !== "auth") {
    return <AuthPage onAuth={handleAuth} />;
  }

  if (page === "auth") return <AuthPage onAuth={handleAuth} />;

  return (
    <div
      style={{
        maxWidth: 430,
        margin: "0 auto",
        minHeight: "100dvh",
        position: "relative",
        boxShadow: "0 0 80px rgba(80,100,255,0.15)",
      }}
    >
      {page === "friends" && (
        <FriendsPage onNavigate={handleNav} onOpenChat={handleOpenChat} />
      )}
      {page === "search" && <SearchPage onNavigate={handleNav} />}
      {page === "chat" && chatFriendId && (
        <ChatPage friendId={chatFriendId} onBack={() => setPage("friends")} />
      )}
      {page === "settings" && (
        <SettingsPage onNavigate={handleNav} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppInner />
    </AppProvider>
  );
}

// Footer
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
