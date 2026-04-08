import { createActor } from "./backend";

const CANISTER_ID =
  (typeof process !== "undefined" &&
    (process.env as Record<string, string>)?.["CANISTER_ID_BACKEND"]) ||
  "szzoj-jiaaa-aaaaa-qaz7a-cai";

const IS_LOCAL =
  typeof process !== "undefined" &&
  (process.env as Record<string, string>)?.["DFX_NETWORK"] === "local";

// ─── Backend data shapes ────────────────────────────────────────────────────
export interface BackendUserSettings {
  showOnlineStatus: boolean;
  showInRadius: boolean;
  notifications: boolean;
  bio?: string;
  userStatus?: string;
  recoveryDate?: string;
}

export interface BackendLocation {
  lat: number;
  lng: number;
}

export interface BackendUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  radiusTier: bigint;
  avatar: string;
  vipStatus: string;
  online: boolean;
  lastSeen?: string;
  settings: BackendUserSettings;
  location?: BackendLocation | null;
}

export interface BackendMessage {
  sender: string;
  recipient: string;
  text: string;
  timestamp: bigint;
  seen: boolean;
}

export interface PurchaseSettings {
  basicPrice: bigint;
  standardPrice: bigint;
  premiumPrice: bigint;
  enabled: boolean;
}

export interface BroadcastResult {
  text: string;
  timestamp: bigint;
}

// ─── Full actor interface ────────────────────────────────────────────────────
export interface VZActor {
  getAllUsers(): Promise<BackendUser[]>;
  getConversation(userId: string, otherId: string): Promise<BackendMessage[]>;
  getUnreadCount(userId: string, friendId: string): Promise<bigint>;
  getTotalUnreadCount(userId: string): Promise<bigint>;
  markConversationSeen(userId: string, friendId: string): Promise<void>;
  verifyCredentials(username: string, password: string): Promise<BackendUser | null>;
  register(params: {
    id: string;
    username: string;
    displayName: string;
    passwordHash: string;
    radiusTier: bigint;
    avatar: string;
    vipStatus: string;
  }): Promise<BackendUser>;
  sendMessage(from: string, to: string, text: string): Promise<void>;
  deleteConversation(userId: string, friendId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  deleteOwnAccount(userId: string, passwordHash: string): Promise<boolean>;
  setOnlineStatus(userId: string, online: boolean): Promise<void>;
  updateLocation(userId: string, location: BackendLocation): Promise<void>;
  updateSettings(userId: string, settings: Partial<BackendUserSettings>): Promise<void>;
  updateUserRadiusTier(userId: string, tier: bigint): Promise<void>;
  updateAvatar(userId: string, avatar: string): Promise<BackendUser>;
  setUserVipStatus(userId: string, status: string): Promise<void>;
  getPurchaseSettings(): Promise<PurchaseSettings>;
  setPurchaseSettings(settings: PurchaseSettings): Promise<void>;
  broadcastMessage(text: string): Promise<void>;
  getLatestBroadcast(): Promise<BroadcastResult | null>;
}

// ─── Actor factory ───────────────────────────────────────────────────────────
// Dummy upload/download stubs — this app doesn't use object storage
const noopUpload = async (_file: unknown) =>
  new Uint8Array(0) as Uint8Array<ArrayBuffer>;
const noopDownload = async (_bytes: unknown) => {
  const { ExternalBlob } = await import("./backend");
  return ExternalBlob.fromBytes(new Uint8Array(0) as Uint8Array<ArrayBuffer>);
};

export async function createActorWithConfig(): Promise<VZActor> {
  const agentOptions = IS_LOCAL
    ? { host: "http://127.0.0.1:4943" }
    : { host: "https://icp-api.io" };

  // backend.ts is @ts-nocheck so the cast is safe at runtime
  return createActor(
    CANISTER_ID,
    noopUpload as Parameters<typeof createActor>[1],
    noopDownload as Parameters<typeof createActor>[2],
    { agentOptions },
  ) as unknown as VZActor;
}
