import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type Theme =
  | "liquid-flux"
  | "dark-minimal"
  | "light-clean"
  | "neon-pulse";

export type RadiusTier = "free" | "basic" | "standard" | "premium";

export interface User {
  id: string;
  username: string;
  displayName: string;
  password: string;
  radiusTier: RadiusTier;
  showOnlineStatus: boolean;
  showInRadius: boolean;
  notifications: boolean;
  isAdmin?: boolean;
  isBot?: boolean;
  lat?: number;
  lng?: number;
  online?: boolean;
  lastSeen?: string;
  createdAt?: number;
}

export interface FriendUser {
  id: string;
  username: string;
  displayName: string;
  online: boolean;
  lastSeen?: string;
  isBot?: boolean;
  isAdmin?: boolean;
  lat?: number;
  lng?: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  replyTo?: string;
}

export interface Conversation {
  friendId: string;
  messages: Message[];
}

export interface FriendRequest {
  fromId: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
}

const RADIUS_LABELS: Record<RadiusTier, string> = {
  free: "500m",
  basic: "1km",
  standard: "5km",
  premium: "10km",
};

const BOT_USER: FriendUser = {
  id: "bot_nearconnect",
  username: "nearbot",
  displayName: "NearBot 🤖",
  online: true,
  isBot: true,
};

const ADMIN_SEED: User = {
  id: "admin_001",
  username: "admin",
  displayName: "Admin",
  password: "admin123",
  radiusTier: "free",
  showOnlineStatus: true,
  showInRadius: false,
  notifications: true,
  isAdmin: true,
  createdAt: Date.now(),
};

export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  signup: (username: string, displayName: string, password: string) => boolean;
  logout: () => void;
  friends: FriendUser[];
  allUsers: FriendUser[];
  getConversation: (friendId: string) => Message[];
  sendMessage: (friendId: string, text: string, replyTo?: string) => void;
  receiveMessage: (friendId: string, text: string) => void;
  friendRequests: FriendRequest[];
  sendFriendRequest: (toId: string) => void;
  acceptFriendRequest: (fromId: string) => void;
  radiusLabel: string;
  purchaseRadius: (tier: RadiusTier) => void;
  updateSettings: (settings: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  userLocation: { lat: number; lng: number } | null;
  allRealUsers: User[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("liquid-flux");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("nc_current_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem("nc_users");
    let parsed: User[] = stored ? JSON.parse(stored) : [];
    // Seed admin if not present
    if (!parsed.find((u) => u.id === "admin_001")) {
      parsed = [ADMIN_SEED, ...parsed];
      localStorage.setItem("nc_users", JSON.stringify(parsed));
    }
    return parsed;
  });
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    () => {
      const stored = localStorage.getItem("nc_conversations");
      return stored ? JSON.parse(stored) : {};
    },
  );
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(() => {
    const stored = localStorage.getItem("nc_friend_requests");
    return stored ? JSON.parse(stored) : [];
  });
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Persist conversations
  const persistConversations = (updated: Record<string, Message[]>) => {
    localStorage.setItem("nc_conversations", JSON.stringify(updated));
  };

  useEffect(() => {
    const stored = localStorage.getItem("nc_theme");
    if (stored) setThemeState(stored as Theme);
  }, []);

  // Apply theme class to body
  useEffect(() => {
    const body = document.body;
    body.classList.remove(
      "theme-dark-minimal",
      "theme-light-clean",
      "theme-neon-pulse",
    );
    if (theme === "dark-minimal") body.classList.add("theme-dark-minimal");
    else if (theme === "light-clean") body.classList.add("theme-light-clean");
    else if (theme === "neon-pulse") body.classList.add("theme-neon-pulse");
    localStorage.setItem("nc_theme", theme);
  }, [theme]);

  // Geolocation tracking
  // biome-ignore lint/correctness/useExhaustiveDependencies: tracking by id only to avoid loop from location updates
  useEffect(() => {
    if (!currentUser) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          // Update user record with location
          setUsers((prev) => {
            const updated = prev.map((u) =>
              u.id === currentUser.id
                ? { ...u, lat: latitude, lng: longitude }
                : u,
            );
            localStorage.setItem("nc_users", JSON.stringify(updated));
            return updated;
          });
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const up = { ...prev, lat: latitude, lng: longitude };
            localStorage.setItem("nc_current_user", JSON.stringify(up));
            return up;
          });
        },
        () => {
          // Permission denied or error — silent
        },
        { enableHighAccuracy: true, maximumAge: 10000 },
      );
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentUser?.id]);

  const setTheme = (t: Theme) => setThemeState(t);

  const login = (username: string, password: string): boolean => {
    const found = users.find(
      (u) =>
        (u.username === username || u.id === username) &&
        u.password === password,
    );
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("nc_current_user", JSON.stringify(found));
      return true;
    }
    return false;
  };

  const signup = (
    username: string,
    displayName: string,
    password: string,
  ): boolean => {
    if (users.find((u) => u.username === username)) return false;
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      displayName,
      password,
      radiusTier: "free",
      showOnlineStatus: true,
      showInRadius: true,
      notifications: true,
      createdAt: Date.now(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem("nc_users", JSON.stringify(updated));
    setCurrentUser(newUser);
    localStorage.setItem("nc_current_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("nc_current_user");
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(null);
  };

  const getConversation = (friendId: string): Message[] => {
    return conversations[friendId] || [];
  };

  const sendMessage = (friendId: string, text: string, replyTo?: string) => {
    const msg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      text,
      timestamp: Date.now(),
      replyTo,
    };
    setConversations((prev) => {
      const updated = {
        ...prev,
        [friendId]: [...(prev[friendId] || []), msg],
      };
      persistConversations(updated);
      return updated;
    });
  };

  const receiveMessage = (friendId: string, text: string) => {
    const msg: Message = {
      id: `bot_${Date.now()}`,
      senderId: friendId,
      text,
      timestamp: Date.now(),
    };
    setConversations((prev) => {
      const updated = {
        ...prev,
        [friendId]: [...(prev[friendId] || []), msg],
      };
      persistConversations(updated);
      return updated;
    });
  };

  const sendFriendRequest = (toId: string) => {
    if (!currentUser) return;
    const existing = friendRequests.find(
      (r) => r.fromId === currentUser.id && r.toId === toId,
    );
    if (existing) return;
    const updated = [
      ...friendRequests,
      { fromId: currentUser.id, toId, status: "pending" as const },
    ];
    setFriendRequests(updated);
    localStorage.setItem("nc_friend_requests", JSON.stringify(updated));
  };

  const acceptFriendRequest = (fromId: string) => {
    if (!currentUser) return;
    const updatedReqs = friendRequests.map((r) =>
      r.fromId === fromId && r.toId === currentUser.id
        ? { ...r, status: "accepted" as const }
        : r,
    );
    setFriendRequests(updatedReqs);
    localStorage.setItem("nc_friend_requests", JSON.stringify(updatedReqs));
  };

  const deleteUser = (userId: string) => {
    if (userId === "admin_001") return;
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem("nc_users", JSON.stringify(updated));
    if (currentUser?.id === userId) {
      logout();
    }
  };

  const purchaseRadius = (tier: RadiusTier) => {
    if (!currentUser) return;
    const updated = { ...currentUser, radiusTier: tier };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? updated : u,
    );
    setUsers(updatedUsers);
    localStorage.setItem("nc_users", JSON.stringify(updatedUsers));
  };

  const updateSettings = (settings: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...settings };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id ? updated : u,
    );
    setUsers(updatedUsers);
    localStorage.setItem("nc_users", JSON.stringify(updatedUsers));
  };

  const radiusLabel = RADIUS_LABELS[currentUser?.radiusTier || "free"];

  // allUsers: all non-current, non-bot users + bot
  const allUsers: FriendUser[] = [
    ...users
      .filter((u) => u.id !== currentUser?.id && !u.isBot)
      .map(
        (u): FriendUser => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          online: u.online ?? false,
          lastSeen: u.lastSeen,
          isBot: u.isBot,
          isAdmin: u.isAdmin,
          lat: u.lat,
          lng: u.lng,
        }),
      ),
    BOT_USER,
  ];

  // friends: ALL registered users (with showInRadius) are visible as nearby + bot always
  // This ensures users who sign up are discoverable without needing explicit friend requests
  const friends: FriendUser[] = [
    ...users
      .filter(
        (u) =>
          u.id !== currentUser?.id &&
          !u.isBot &&
          !u.isAdmin &&
          u.showInRadius !== false,
      )
      .map(
        (u): FriendUser => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          online: u.online ?? true,
          lastSeen: u.lastSeen,
          isBot: u.isBot,
          isAdmin: u.isAdmin,
          lat: u.lat,
          lng: u.lng,
        }),
      ),
    BOT_USER,
  ];

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        currentUser,
        login,
        signup,
        logout,
        friends,
        allUsers,
        allRealUsers: users,
        getConversation,
        sendMessage,
        receiveMessage,
        friendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        radiusLabel,
        purchaseRadius,
        updateSettings,
        deleteUser,
        userLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

export { RADIUS_LABELS };
