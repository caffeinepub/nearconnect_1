import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { PurchaseSettings, backendInterface } from "../backend";
import { createActorWithConfig } from "../config";

export type Theme =
  | "liquid-flux"
  | "dark-minimal"
  | "light-clean"
  | "neon-pulse";

export type RadiusTier = "free" | "basic" | "standard" | "premium";

export interface SavedAccount {
  id: string;
  username: string;
  displayName: string;
  password: string;
}

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
  seen?: boolean;
  backendTimestamp?: number;
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
  id: "bot_vibezone",
  username: "vibebot",
  displayName: "VibeBot 🤖",
  online: true,
  isBot: true,
};

function bigintToRadiusTier(n: bigint): RadiusTier {
  switch (n) {
    case 1n:
      return "basic";
    case 2n:
      return "standard";
    case 3n:
      return "premium";
    default:
      return "free";
  }
}

// Lazily initialized backend actor (module-level singleton)
let _actorPromise: Promise<backendInterface> | null = null;
function getActor(): Promise<backendInterface> {
  if (!_actorPromise) {
    _actorPromise = createActorWithConfig().catch((e) => {
      _actorPromise = null;
      throw e;
    });
  }
  return _actorPromise;
}

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

function extractErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    const msg = e.message;
    // ICP canister errors are wrapped like: "Reject text: ..."
    const rejectMatch = msg.match(/Reject text:\s*(.+)/i);
    if (rejectMatch) return rejectMatch[1].trim();
    // Also handle trap messages
    const trapMatch = msg.match(/trapped.*?:\s*(.+)/i);
    if (trapMatch) return trapMatch[1].trim();
    return msg;
  }
  return String(e);
}

function loadSavedAccounts(): SavedAccount[] {
  try {
    const stored = localStorage.getItem("nc_saved_accounts");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function persistSavedAccounts(accounts: SavedAccount[]) {
  localStorage.setItem("nc_saved_accounts", JSON.stringify(accounts));
}

function upsertSavedAccount(account: SavedAccount) {
  const accounts = loadSavedAccounts();
  const idx = accounts.findIndex((a) => a.username === account.username);
  if (idx >= 0) {
    accounts[idx] = account;
  } else {
    accounts.push(account);
  }
  persistSavedAccounts(accounts);
  return accounts;
}

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (
    username: string,
    displayName: string,
    password: string,
  ) => Promise<{ success: true } | { success: false; error: string }>;
  logout: () => void;
  friends: FriendUser[];
  allUsers: FriendUser[];
  getConversation: (friendId: string) => Message[];
  sendMessage: (friendId: string, text: string, replyTo?: string) => void;
  fetchConversation: (friendId: string) => Promise<Message[]>;
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
  refreshFriends: () => void;
  purchaseSettings: PurchaseSettings | null;
  savePurchaseSettings: (settings: PurchaseSettings) => Promise<void>;
  grantPurchaseToUser: (userId: string, tier: RadiusTier) => Promise<void>;
  savedAccounts: SavedAccount[];
  switchAccount: (username: string, password: string) => Promise<boolean>;
  deleteMessage: (friendId: string, msgId: string) => void;
  deleteConversation: (friendId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("liquid-flux");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("nc_current_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [savedAccounts, setSavedAccounts] =
    useState<SavedAccount[]>(loadSavedAccounts);
  // Local user store is only used for offline caching; backend is source of truth
  const [users, setUsers] = useState<User[]>([]);
  const [backendUsers, setBackendUsers] = useState<FriendUser[]>([]);
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
  const [purchaseSettings, setPurchaseSettingsState] =
    useState<PurchaseSettings | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const backendPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep a ref to conversations so fetchConversation can merge without stale closure
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const persistConversations = (updated: Record<string, Message[]>) => {
    localStorage.setItem("nc_conversations", JSON.stringify(updated));
  };

  useEffect(() => {
    const stored = localStorage.getItem("nc_theme");
    if (stored) setThemeState(stored as Theme);
  }, []);

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

  // Load purchase settings from backend on mount
  useEffect(() => {
    getActor()
      .then((actor) => actor.getPurchaseSettings())
      .then((settings) => setPurchaseSettingsState(settings))
      .catch(() => {});
  }, []);

  const fetchBackendUsers = async (userId: string) => {
    try {
      const actor = await getActor();
      const allBE = await actor.getAllUsers();
      const mapped: FriendUser[] = allBE
        .filter((u) => u.id !== userId && !u.settings?.showInRadius === false)
        .map((u) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          online: u.online,
          lastSeen: u.lastSeen ? String(u.lastSeen) : undefined,
          lat: u.location?.lat,
          lng: u.location?.lng,
          isBot: false,
          isAdmin: false,
        }));
      // Also update local users list for admin page
      const localUsers: User[] = allBE.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        password: "",
        radiusTier: bigintToRadiusTier(u.radiusTier),
        showOnlineStatus: u.settings.showOnlineStatus,
        showInRadius: u.settings.showInRadius,
        notifications: u.settings.notifications,
        online: u.online,
        lastSeen: u.lastSeen ? String(u.lastSeen) : undefined,
        createdAt: Number(u.lastSeen) || Date.now(),
      }));
      setUsers(localUsers);
      setBackendUsers(mapped);
      // Refresh currentUser tier from backend in case it was granted by admin
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const fresh = localUsers.find((u) => u.id === prev.id);
        if (!fresh) return prev;
        if (fresh.radiusTier !== prev.radiusTier) {
          const updated = { ...prev, radiusTier: fresh.radiusTier };
          localStorage.setItem("nc_current_user", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } catch {
      // Silent fail
    }
  };

  const refreshFriends = () => {
    if (currentUser) {
      fetchBackendUsers(currentUser.id);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: poll by id only
  useEffect(() => {
    if (!currentUser) {
      setBackendUsers([]);
      if (backendPollRef.current !== null) {
        clearInterval(backendPollRef.current);
        backendPollRef.current = null;
      }
      return;
    }
    fetchBackendUsers(currentUser.id);
    backendPollRef.current = setInterval(() => {
      fetchBackendUsers(currentUser.id);
    }, 30000);
    return () => {
      if (backendPollRef.current !== null) {
        clearInterval(backendPollRef.current);
        backendPollRef.current = null;
      }
    };
  }, [currentUser?.id]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: tracking by id only
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
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const up = { ...prev, lat: latitude, lng: longitude };
            localStorage.setItem("nc_current_user", JSON.stringify(up));
            return up;
          });
          // Update backend location (fire-and-forget)
          getActor()
            .then((actor) =>
              actor.updateLocation(currentUser.id, {
                lat: latitude,
                lng: longitude,
              }),
            )
            .catch(() => {});
        },
        () => {},
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

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    // Always verify against backend first
    try {
      const actor = await getActor();
      const beUser = await actor.verifyCredentials(username, password);
      if (beUser) {
        const localUser: User = {
          id: beUser.id,
          username: beUser.username,
          displayName: beUser.displayName,
          password,
          radiusTier: bigintToRadiusTier(beUser.radiusTier),
          showOnlineStatus: beUser.settings.showOnlineStatus,
          showInRadius: beUser.settings.showInRadius,
          notifications: beUser.settings.notifications,
          online: beUser.online,
          createdAt: Date.now(),
        };
        setCurrentUser(localUser);
        localStorage.setItem("nc_current_user", JSON.stringify(localUser));
        actor.setOnlineStatus(localUser.id, true).catch(() => {});
        // Save to saved accounts
        const updated = upsertSavedAccount({
          id: localUser.id,
          username: localUser.username,
          displayName: localUser.displayName,
          password,
        });
        setSavedAccounts(updated);
        return true;
      }
    } catch {
      // Silent fail
    }
    return false;
  };

  const signup = async (
    username: string,
    displayName: string,
    password: string,
  ): Promise<{ success: true } | { success: false; error: string }> => {
    try {
      const actor = await getActor();
      const newUser = await actor.register({
        id: `user_${Date.now()}`,
        username,
        displayName,
        passwordHash: password,
        radiusTier: 0n,
      });
      const localUser: User = {
        id: newUser.id,
        username: newUser.username,
        displayName: newUser.displayName,
        password,
        radiusTier: bigintToRadiusTier(newUser.radiusTier),
        showOnlineStatus: newUser.settings.showOnlineStatus,
        showInRadius: newUser.settings.showInRadius,
        notifications: newUser.settings.notifications,
        online: true,
        createdAt: Date.now(),
      };
      setCurrentUser(localUser);
      localStorage.setItem("nc_current_user", JSON.stringify(localUser));
      actor.setOnlineStatus(localUser.id, true).catch(() => {});
      // Save to saved accounts
      const updated = upsertSavedAccount({
        id: localUser.id,
        username: localUser.username,
        displayName: localUser.displayName,
        password,
      });
      setSavedAccounts(updated);
      return { success: true };
    } catch (e) {
      const raw = extractErrorMessage(e);
      // Map known backend errors to friendly messages
      let friendly = raw;
      if (raw.toLowerCase().includes("username already taken")) {
        friendly =
          "That username is already taken. Please choose a different one.";
      } else if (raw.toLowerCase().includes("user already registered")) {
        friendly =
          "This account is already registered. Please sign in instead.";
      } else if (raw.toLowerCase().includes("unauthorized")) {
        friendly =
          "Authentication error. Please refresh the page and try again.";
      } else if (!raw || raw === "undefined") {
        friendly = "Something went wrong. Please try again.";
      }
      return { success: false, error: friendly };
    }
  };

  const logout = () => {
    if (currentUser) {
      getActor()
        .then((actor) => actor.setOnlineStatus(currentUser.id, false))
        .catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem("nc_current_user");
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(null);
    setBackendUsers([]);
    // Intentionally keep savedAccounts in localStorage
  };

  const switchAccount = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    return login(username, password);
  };

  const getConversation = (friendId: string): Message[] => {
    return conversations[friendId] || [];
  };

  const sendMessage = (friendId: string, text: string, replyTo?: string) => {
    if (!currentUser) return;
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
    // For real users (not bot), also send to backend
    if (friendId !== "bot_vibezone") {
      getActor()
        .then((actor) => actor.sendMessage(currentUser.id, friendId, text))
        .catch(() => {});
    }
  };

  const fetchConversation = async (friendId: string): Promise<Message[]> => {
    if (!currentUser || friendId === "bot_vibezone") {
      return conversationsRef.current[friendId] || [];
    }
    try {
      const actor = await getActor();
      const backendMsgs = await actor.getConversation(currentUser.id, friendId);
      // Map backend messages to local Message format
      const mapped: Message[] = backendMsgs.map((m) => ({
        id: `${m.sender}_${m.timestamp}`,
        senderId: m.sender === currentUser.id ? "me" : m.sender,
        text: m.text,
        timestamp: Number(m.timestamp) / 1_000_000,
        seen: m.seen,
        backendTimestamp: Number(m.timestamp),
      }));
      // Merge with local messages (keep local sent messages that may not be in backend yet)
      const local = conversationsRef.current[friendId] || [];
      // Deduplicate: prefer backend version; match by exact timestamp or same text within 1s
      const merged: Message[] = [...mapped];
      for (const localMsg of local) {
        const isDuplicate = mapped.some(
          (bMsg) =>
            bMsg.text === localMsg.text &&
            Math.abs(bMsg.timestamp - localMsg.timestamp) < 2000,
        );
        if (!isDuplicate) {
          merged.push(localMsg);
        }
      }
      // Sort by timestamp
      merged.sort((a, b) => a.timestamp - b.timestamp);
      // Update local state
      setConversations((prev) => {
        const updated = { ...prev, [friendId]: merged };
        persistConversations(updated);
        return updated;
      });
      return merged;
    } catch {
      return conversationsRef.current[friendId] || [];
    }
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

  const deleteMessage = (friendId: string, msgId: string) => {
    setConversations((prev) => {
      const updated = {
        ...prev,
        [friendId]: (prev[friendId] || []).filter((m) => m.id !== msgId),
      };
      persistConversations(updated);
      return updated;
    });
  };

  const deleteConversation = (friendId: string) => {
    setConversations((prev) => {
      const updated = { ...prev };
      delete updated[friendId];
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
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    getActor()
      .then((actor) => actor.deleteUser(userId))
      .catch(() => {});
    if (currentUser?.id === userId) {
      logout();
    }
  };

  const purchaseRadius = (tier: RadiusTier) => {
    if (!currentUser) return;
    const updated = { ...currentUser, radiusTier: tier };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
  };

  const updateSettings = (settings: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...settings };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
    getActor()
      .then((actor) =>
        actor.updateSettings(currentUser.id, {
          showOnlineStatus: updated.showOnlineStatus,
          showInRadius: updated.showInRadius,
          notifications: updated.notifications,
        }),
      )
      .catch(() => {});
  };

  const tierToNumber: Record<RadiusTier, bigint> = {
    free: 0n,
    basic: 1n,
    standard: 2n,
    premium: 3n,
  };

  const grantPurchaseToUser = async (userId: string, tier: RadiusTier) => {
    // Call backend to persist tier change
    const actor = await getActor();
    await actor.updateUserRadiusTier(userId, tierToNumber[tier]);
    // Update local user list state
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, radiusTier: tier } : u)),
    );
    // If the granted user is the currently logged-in user, update currentUser too
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, radiusTier: tier };
      setCurrentUser(updated);
      localStorage.setItem("nc_current_user", JSON.stringify(updated));
    }
    // Refresh from backend to sync latest state
    if (currentUser) await fetchBackendUsers(currentUser.id);
  };

  const savePurchaseSettings = async (settings: PurchaseSettings) => {
    const actor = await getActor();
    await actor.setPurchaseSettings(settings);
    setPurchaseSettingsState(settings);
  };

  const radiusLabel = RADIUS_LABELS[currentUser?.radiusTier || "free"];

  const RADIUS_METERS: Record<RadiusTier, number> = {
    free: 500,
    basic: 1000,
    standard: 5000,
    premium: 10000,
  };

  // Backend users filtered: exclude current user and admin users, then filter by radius distance
  const filteredBackendUsers = backendUsers.filter((u) => {
    if (u.isAdmin || u.id === currentUser?.id) return false;
    // If we have location data for both users, filter by radius tier
    if (
      userLocation &&
      u.lat !== undefined &&
      u.lng !== undefined &&
      currentUser
    ) {
      const dist = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        u.lat,
        u.lng,
      );
      const maxRadius = RADIUS_METERS[currentUser.radiusTier || "free"];
      return dist <= maxRadius;
    }
    // If no location data available, show the user (fallback)
    return true;
  });

  const friends: FriendUser[] = [...filteredBackendUsers, BOT_USER];

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
        fetchConversation,
        receiveMessage,
        friendRequests,
        sendFriendRequest,
        acceptFriendRequest,
        radiusLabel,
        purchaseRadius,
        updateSettings,
        deleteUser,
        userLocation,
        refreshFriends,
        purchaseSettings,
        savePurchaseSettings,
        grantPurchaseToUser,
        savedAccounts,
        switchAccount,
        deleteMessage,
        deleteConversation,
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
