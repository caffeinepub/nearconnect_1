import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type PurchaseSettings,
  type VZActor,
  createActorWithConfig,
} from "../config";

export type Theme =
  | "liquid-flux"
  | "dark-minimal"
  | "light-clean"
  | "neon-pulse";

export type RadiusTier = "free" | "basic" | "standard" | "premium" | "banned";

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
  maxGrantedTier?: RadiusTier;
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
  avatar?: string;
  vipStatus?: string;
  bio?: string;
  userStatus?: string;
  recoveryDate?: string;
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
  avatar?: string;
  vipStatus?: string;
  bio?: string;
  userStatus?: string;
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
  banned: "Banned",
};

const BOT_USER: FriendUser = {
  id: "bot_vibezone",
  username: "vibebot",
  displayName: "VibeBot 🤖",
  online: true,
  isBot: true,
};

// Friendship signal constants
const VZ_REQ = "__VZ_FR__";
const VZ_ACCEPT = "__VZ_FA__";
const VZ_REJECT = "__VZ_FRJ__";

function bigintToRadiusTier(n: bigint): RadiusTier {
  switch (n) {
    case 1n:
      return "basic";
    case 2n:
      return "standard";
    case 3n:
      return "premium";
    case 999n:
      return "banned";
    default:
      return "free";
  }
}

// Lazily initialized backend actor (module-level singleton)
let _actorPromise: Promise<VZActor> | null = null;
function getActor(): Promise<VZActor> {
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
    const rejectMatch = msg.match(/Reject text:\s*(.+)/i);
    if (rejectMatch) return rejectMatch[1].trim();
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
  acceptFriendRequest: (fromId: string) => Promise<void>;
  rejectFriendRequest: (fromId: string) => Promise<void>;
  radiusLabel: string;
  purchaseRadius: (tier: RadiusTier) => void;
  updateSettings: (settings: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  deleteOwnAccount: (userId: string, passwordHash: string) => Promise<boolean>;
  userLocation: { lat: number; lng: number } | null;
  allRealUsers: User[];
  refreshFriends: () => Promise<void>;
  purchaseSettings: PurchaseSettings | null;
  savePurchaseSettings: (settings: PurchaseSettings) => Promise<void>;
  grantPurchaseToUser: (userId: string, tier: RadiusTier) => Promise<void>;
  savedAccounts: SavedAccount[];
  switchAccount: (username: string, password: string) => Promise<boolean>;
  deleteMessage: (friendId: string, msgId: string) => void;
  deleteConversation: (friendId: string) => void;
  incomingFriendRequests: string[];
  followingUsernames: string[];
  mutualFriendIds: Set<string>;
  updateAvatar: (avatar: string) => Promise<void>;
  setVipStatus: (userId: string, status: string) => Promise<void>;
  deletedConversationIds: Set<string>;
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
  const [users, setUsers] = useState<User[]>([]);
  const [backendUsers, setBackendUsers] = useState<FriendUser[]>([]);
  const [conversations, setConversations] = useState<Record<string, Message[]>>(
    () => {
      const stored = localStorage.getItem("nc_conversations");
      return stored ? JSON.parse(stored) : {};
    },
  );
  // Friendship state: maps otherId -> 'sent' | 'received' | 'mutual'
  const [friendshipsState, setFriendshipsState] = useState<
    Record<string, "sent" | "received" | "mutual">
  >({});
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [purchaseSettings, setPurchaseSettingsState] =
    useState<PurchaseSettings | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const backendPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  // Keep backendUsers in a ref for use inside syncFriendships
  const backendUsersRef = useRef(backendUsers);
  backendUsersRef.current = backendUsers;

  // Keep users in a ref
  const usersRef = useRef(users);
  usersRef.current = users;

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

  useEffect(() => {
    getActor()
      .then((actor) => actor.getPurchaseSettings())
      .then((settings) => setPurchaseSettingsState(settings))
      .catch(() => {});
  }, []);

  const fetchBackendUsers = async (userId: string): Promise<void> => {
    try {
      const actor = await getActor();
      const allBE = await actor.getAllUsers();
      const mapped: FriendUser[] = allBE
        .filter(
          (u) =>
            u.id !== userId &&
            u.settings?.showInRadius !== false &&
            u.location != null &&
            u.location.lat != null &&
            u.location.lng != null,
        )
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
          avatar: u.avatar || "",
          vipStatus: u.vipStatus || "none",
        }));
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
        avatar: u.avatar || "",
        vipStatus: u.vipStatus || "none",
      }));
      setUsers(localUsers);
      setBackendUsers(mapped);
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const fresh = localUsers.find((u) => u.id === prev.id);
        if (!fresh) return prev;
        const newMaxTier = fresh.radiusTier;
        const tierOrder: Record<string, number> = {
          free: 0,
          basic: 1,
          standard: 2,
          premium: 3,
        };
        const newActiveTier =
          tierOrder[prev.radiusTier] <= tierOrder[newMaxTier]
            ? prev.radiusTier
            : newMaxTier;
        if (
          fresh.radiusTier !== prev.maxGrantedTier ||
          newActiveTier !== prev.radiusTier
        ) {
          const updated = {
            ...prev,
            maxGrantedTier: newMaxTier,
            radiusTier: newActiveTier,
          };
          localStorage.setItem("nc_current_user", JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    } catch {
      // Silent fail
    }
  };

  const syncFriendships = async (user: User): Promise<void> => {
    const allUserIds = backendUsersRef.current
      .map((u) => u.id)
      .filter((id) => id !== user.id);
    if (allUserIds.length === 0) return;
    try {
      const actor = await getActor();
      const newFriendships: Record<string, "sent" | "received" | "mutual"> = {};
      await Promise.all(
        allUserIds.map(async (otherId) => {
          try {
            const msgs = await actor.getConversation(user.id, otherId);
            const theyReqMe = msgs.some(
              (m) => m.sender === otherId && m.text === VZ_REQ,
            );
            const iReqThem = msgs.some(
              (m) => m.sender === user.id && m.text === VZ_REQ,
            );
            const iAccepted = msgs.some(
              (m) => m.sender === user.id && m.text === VZ_ACCEPT,
            );
            const theyAccepted = msgs.some(
              (m) => m.sender === otherId && m.text === VZ_ACCEPT,
            );
            const iRejected = msgs.some(
              (m) => m.sender === user.id && m.text === VZ_REJECT,
            );
            if ((iReqThem && theyAccepted) || (theyReqMe && iAccepted)) {
              newFriendships[otherId] = "mutual";
            } else if (theyReqMe && !iRejected) {
              newFriendships[otherId] = "received";
            } else if (iReqThem) {
              newFriendships[otherId] = "sent";
            }
          } catch {
            // ignore per-user errors
          }
        }),
      );
      setFriendshipsState(newFriendships);
    } catch {
      // silent
    }
  };

  const refreshFriends = (): Promise<void> => {
    if (currentUser) {
      return fetchBackendUsers(currentUser.id).then(() =>
        syncFriendships(currentUser),
      );
    }
    return Promise.resolve();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: poll by id only
  useEffect(() => {
    if (!currentUser) {
      setBackendUsers([]);
      setFriendshipsState({});
      if (backendPollRef.current !== null) {
        clearInterval(backendPollRef.current);
        backendPollRef.current = null;
      }
      if (syncRef.current !== null) {
        clearInterval(syncRef.current);
        syncRef.current = null;
      }
      if (heartbeatRef.current !== null) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }
    const id = currentUser.id;
    // Set online immediately on mount — only if internet is available
    getActor()
      .then((actor) => actor.setOnlineStatus(id, navigator.onLine))
      .catch(() => {});
    fetchBackendUsers(id).then(() => syncFriendships(currentUser));
    backendPollRef.current = setInterval(() => {
      fetchBackendUsers(id);
    }, 10000);
    syncRef.current = setInterval(() => {
      syncFriendships(currentUser);
    }, 30000);
    // Reset activity ref on mount so user is immediately online
    lastActivityRef.current = Date.now();
    // Heartbeat: keep online status alive every 45 seconds, idle after 10 min
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("keydown", handleActivity);
    heartbeatRef.current = setInterval(() => {
      const isIdle = Date.now() - lastActivityRef.current > 10 * 60 * 1000;
      getActor()
        .then((actor) =>
          actor.setOnlineStatus(id, isIdle ? false : navigator.onLine),
        )
        .catch(() => {});
    }, 45000);
    // React to connectivity changes
    const handleOnline = () => {
      getActor()
        .then((actor) => actor.setOnlineStatus(id, true))
        .catch(() => {});
    };
    const handleOffline = () => {
      getActor()
        .then((actor) => actor.setOnlineStatus(id, false))
        .catch(() => {});
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (backendPollRef.current !== null) {
        clearInterval(backendPollRef.current);
        backendPollRef.current = null;
      }
      if (syncRef.current !== null) {
        clearInterval(syncRef.current);
        syncRef.current = null;
      }
      if (heartbeatRef.current !== null) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
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
    try {
      const actor = await getActor();
      const beUser = await actor.verifyCredentials(username, password);
      if (beUser) {
        // Block banned users from logging in
        if (beUser.radiusTier === 999n) {
          return false;
        }
        const localUser: User = {
          id: beUser.id,
          username: beUser.username,
          displayName: beUser.displayName,
          password,
          radiusTier: bigintToRadiusTier(beUser.radiusTier),
          maxGrantedTier: bigintToRadiusTier(beUser.radiusTier),
          showOnlineStatus: beUser.settings.showOnlineStatus,
          showInRadius: beUser.settings.showInRadius,
          notifications: beUser.settings.notifications,
          online: beUser.online,
          createdAt: Date.now(),
          avatar: beUser.avatar || "",
          vipStatus: beUser.vipStatus || "none",
        };
        setCurrentUser(localUser);
        localStorage.setItem("nc_current_user", JSON.stringify(localUser));
        actor.setOnlineStatus(localUser.id, navigator.onLine).catch(() => {});
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
        avatar: "",
        vipStatus: "none",
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
      actor.setOnlineStatus(localUser.id, navigator.onLine).catch(() => {});
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
    setFriendshipsState({});
  };

  const switchAccount = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    return login(username, password);
  };

  const getConversation = (friendId: string): Message[] => {
    return (conversations[friendId] || []).filter(
      (m) => !m.text.startsWith("__VZ_"),
    );
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
      const mapped: Message[] = backendMsgs
        .filter((m) => !m.text.startsWith("__VZ_"))
        .map((m) => ({
          id: `${m.sender}_${m.timestamp}`,
          senderId: m.sender === currentUser.id ? "me" : m.sender,
          text: m.text,
          timestamp: Number(m.timestamp) / 1_000_000,
          seen: m.seen,
          backendTimestamp: Number(m.timestamp),
        }));
      const local = conversationsRef.current[friendId] || [];
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
      merged.sort((a, b) => a.timestamp - b.timestamp);
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

  const [deletedConversationIds, setDeletedConversationIds] = useState<
    Set<string>
  >(new Set());

  const deleteConversation = (friendId: string) => {
    setDeletedConversationIds((prev) => new Set([...prev, friendId]));
    setConversations((prev) => {
      const updated = { ...prev };
      delete updated[friendId];
      persistConversations(updated);
      return updated;
    });
    if (currentUser) {
      getActor()
        .then((actor) => actor.deleteConversation(currentUser.id, friendId))
        .catch(() => {});
    }
  };

  const sendFriendRequest = (toId: string) => {
    if (!currentUser) return;
    // Already sent or mutual — don't duplicate
    if (
      friendshipsState[toId] === "sent" ||
      friendshipsState[toId] === "mutual"
    )
      return;
    // Optimistically update state
    setFriendshipsState((prev) => ({ ...prev, [toId]: "sent" }));
    // Send signal message via backend
    getActor()
      .then((actor) => actor.sendMessage(currentUser.id, toId, VZ_REQ))
      .catch(() => {});
  };

  const acceptFriendRequest = async (fromId: string): Promise<void> => {
    if (!currentUser) return;
    try {
      const actor = await getActor();
      await actor.sendMessage(currentUser.id, fromId, VZ_ACCEPT);
      setFriendshipsState((prev) => ({ ...prev, [fromId]: "mutual" }));
      // Re-sync to confirm
      await syncFriendships(currentUser);
    } catch {
      // silent
    }
  };

  const rejectFriendRequest = async (fromId: string): Promise<void> => {
    if (!currentUser) return;
    try {
      const actor = await getActor();
      await actor.sendMessage(currentUser.id, fromId, VZ_REJECT);
      setFriendshipsState((prev) => {
        const n = { ...prev };
        delete n[fromId];
        return n;
      });
    } catch {
      // silent
    }
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

  const deleteOwnAccount = async (
    userId: string,
    passwordHash: string,
  ): Promise<boolean> => {
    try {
      const actor = await getActor();
      const success = await actor.deleteOwnAccount(userId, passwordHash);
      if (success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        // Remove from saved accounts
        const updated = savedAccounts.filter((a) => a.id !== userId);
        setSavedAccounts(updated);
        localStorage.setItem("nc_saved_accounts", JSON.stringify(updated));
        logout();
      }
      return success;
    } catch {
      return false;
    }
  };

  const purchaseRadius = (tier: RadiusTier) => {
    if (!currentUser) return;
    const tierOrder: Record<string, number> = {
      free: 0,
      basic: 1,
      standard: 2,
      premium: 3,
    };
    const maxTier = currentUser.maxGrantedTier || currentUser.radiusTier;
    if (tierOrder[tier] > tierOrder[maxTier]) return;
    const updated = { ...currentUser, radiusTier: tier };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
  };

  const updateSettings = (settings: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...settings };
    setCurrentUser(updated);
    localStorage.setItem("nc_current_user", JSON.stringify(updated));
    // Only sync supported backend fields; bio/userStatus/recoveryDate are localStorage-only
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
    banned: 999n,
  };

  const grantPurchaseToUser = async (userId: string, tier: RadiusTier) => {
    const actor = await getActor();
    await actor.updateUserRadiusTier(userId, tierToNumber[tier]);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, radiusTier: tier } : u)),
    );
    if (currentUser && currentUser.id === userId) {
      const updated = {
        ...currentUser,
        radiusTier: tier,
        maxGrantedTier: tier,
      };
      setCurrentUser(updated);
      localStorage.setItem("nc_current_user", JSON.stringify(updated));
    }
    if (currentUser) await fetchBackendUsers(currentUser.id);
  };

  const savePurchaseSettings = async (settings: PurchaseSettings) => {
    const actor = await getActor();
    await actor.setPurchaseSettings(settings);
    setPurchaseSettingsState(settings);
  };

  const updateAvatar = async (avatar: string): Promise<void> => {
    if (!currentUser) return;
    try {
      const actor = await getActor();
      const updated = await actor.updateAvatar(currentUser.id, avatar);
      const newUser = { ...currentUser, avatar: updated.avatar || avatar };
      setCurrentUser(newUser);
      localStorage.setItem("nc_current_user", JSON.stringify(newUser));
    } catch {
      // silent
    }
  };

  const setVipStatus = async (
    userId: string,
    status: string,
  ): Promise<void> => {
    const actor = await getActor();
    await actor.setUserVipStatus(userId, status);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, vipStatus: status } : u)),
    );
    setBackendUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, vipStatus: status } : u)),
    );
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, vipStatus: status };
      setCurrentUser(updated);
      localStorage.setItem("nc_current_user", JSON.stringify(updated));
    }
    if (currentUser) await fetchBackendUsers(currentUser.id);
  };

  const radiusLabel = RADIUS_LABELS[currentUser?.radiusTier || "free"];

  const filteredBackendUsers = backendUsers.filter((u) => {
    if (u.id === currentUser?.id) return false;
    if (u.username === "admin") return false;
    return true;
  });

  // Compute derived friendship values from friendshipsState
  const incomingFriendRequests = Object.entries(friendshipsState)
    .filter(([, s]) => s === "received")
    .map(([id]) => id);

  const followingUsernames = backendUsers
    .filter(
      (u) =>
        friendshipsState[u.id] === "sent" ||
        friendshipsState[u.id] === "mutual",
    )
    .map((u) => u.username);

  const mutualFriendIds = new Set(
    Object.entries(friendshipsState)
      .filter(([, s]) => s === "mutual")
      .map(([id]) => id),
  );

  // Backward-compat friendRequests computed value
  const friendRequests: FriendRequest[] = currentUser
    ? Object.entries(friendshipsState).flatMap(([userId, state]) => {
        if (state === "sent")
          return [
            {
              fromId: currentUser.id,
              toId: userId,
              status: "pending" as const,
            },
          ];
        if (state === "received")
          return [
            {
              fromId: userId,
              toId: currentUser.id,
              status: "pending" as const,
            },
          ];
        if (state === "mutual")
          return [
            {
              fromId: userId,
              toId: currentUser.id,
              status: "accepted" as const,
            },
          ];
        return [] as FriendRequest[];
      })
    : [];

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
          avatar: u.avatar,
          vipStatus: u.vipStatus,
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
        rejectFriendRequest,
        radiusLabel,
        purchaseRadius,
        updateSettings,
        deleteUser,
        deleteOwnAccount,
        userLocation,
        refreshFriends,
        purchaseSettings,
        savePurchaseSettings,
        grantPurchaseToUser,
        savedAccounts,
        switchAccount,
        deleteMessage,
        deleteConversation,
        incomingFriendRequests,
        followingUsernames,
        mutualFriendIds,
        updateAvatar,
        setVipStatus,
        deletedConversationIds,
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
