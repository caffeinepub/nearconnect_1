import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
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
}

export interface FriendUser {
  id: string;
  username: string;
  displayName: string;
  online: boolean;
  lastSeen?: string;
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

const MOCK_USERS: FriendUser[] = [
  { id: "u1", username: "alex_nova", displayName: "Alex Nova", online: true },
  {
    id: "u2",
    username: "maya_flow",
    displayName: "Maya Flow",
    online: false,
    lastSeen: "2 hours ago",
  },
  { id: "u3", username: "zara_x", displayName: "Zara X", online: true },
  {
    id: "u4",
    username: "kai_storm",
    displayName: "Kai Storm",
    online: false,
    lastSeen: "Yesterday",
  },
  { id: "u5", username: "luna_dream", displayName: "Luna Dream", online: true },
  {
    id: "u6",
    username: "rex_prime",
    displayName: "Rex Prime",
    online: false,
    lastSeen: "3 hours ago",
  },
];

const MOCK_CONVERSATIONS: Record<string, Message[]> = {
  u1: [
    {
      id: "m1",
      senderId: "u1",
      text: "Hey! Are you nearby right now?",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "m2",
      senderId: "me",
      text: "Yeah I'm at the park! Come join 🌿",
      timestamp: Date.now() - 3500000,
    },
    {
      id: "m3",
      senderId: "u1",
      text: "On my way! ETA 5 mins",
      timestamp: Date.now() - 3400000,
    },
    {
      id: "m4",
      senderId: "me",
      text: "Perfect, I'll grab us some coffee ☕",
      timestamp: Date.now() - 3300000,
    },
    {
      id: "m5",
      senderId: "u1",
      text: "You're the best 🙌",
      timestamp: Date.now() - 3200000,
    },
    {
      id: "m6",
      senderId: "u1",
      text: "Just arrived, where exactly are you?",
      timestamp: Date.now() - 300000,
    },
  ],
  u2: [
    {
      id: "m1",
      senderId: "u2",
      text: "Did you see the new spot on 5th?",
      timestamp: Date.now() - 86400000,
    },
    {
      id: "m2",
      senderId: "me",
      text: "Not yet! Is it good?",
      timestamp: Date.now() - 86000000,
    },
    {
      id: "m3",
      senderId: "u2",
      text: "Amazing rooftop views, must visit!",
      timestamp: Date.now() - 85000000,
    },
    {
      id: "m4",
      senderId: "me",
      text: "Let's go this weekend? 🏙️",
      timestamp: Date.now() - 84000000,
    },
    {
      id: "m5",
      senderId: "u2",
      text: "100%! Saturday works for me",
      timestamp: Date.now() - 83000000,
    },
  ],
  u3: [
    {
      id: "m1",
      senderId: "me",
      text: "Hey Zara, you near the city center?",
      timestamp: Date.now() - 7200000,
    },
    {
      id: "m2",
      senderId: "u3",
      text: "Yeah, just grabbed food from that new ramen place",
      timestamp: Date.now() - 7100000,
    },
    {
      id: "m3",
      senderId: "me",
      text: "How was it?? I've been meaning to try!",
      timestamp: Date.now() - 7000000,
    },
    {
      id: "m4",
      senderId: "u3",
      text: "Absolutely 🔥 the spicy miso is unreal",
      timestamp: Date.now() - 6900000,
    },
    {
      id: "m5",
      senderId: "me",
      text: "Going tomorrow for sure 😍",
      timestamp: Date.now() - 6800000,
    },
    {
      id: "m6",
      senderId: "u3",
      text: "I'll join you if you're nearby!",
      timestamp: Date.now() - 6700000,
    },
    {
      id: "m7",
      senderId: "me",
      text: "Deal!",
      timestamp: Date.now() - 6600000,
    },
  ],
};

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
  friendRequests: FriendRequest[];
  sendFriendRequest: (toId: string) => void;
  radiusLabel: string;
  purchaseRadius: (tier: RadiusTier) => void;
  updateSettings: (settings: Partial<User>) => void;
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
    return stored ? JSON.parse(stored) : [];
  });
  const [friends] = useState<FriendUser[]>(MOCK_USERS.slice(0, 3));
  const [conversations, setConversations] =
    useState<Record<string, Message[]>>(MOCK_CONVERSATIONS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

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
    setConversations((prev) => ({
      ...prev,
      [friendId]: [...(prev[friendId] || []), msg],
    }));
  };

  const sendFriendRequest = (toId: string) => {
    setFriendRequests((prev) => [
      ...prev,
      { fromId: "me", toId, status: "pending" },
    ]);
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
        allUsers: MOCK_USERS,
        getConversation,
        sendMessage,
        friendRequests,
        sendFriendRequest,
        radiusLabel,
        purchaseRadius,
        updateSettings,
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
