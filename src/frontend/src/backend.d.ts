import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    lat: number;
    lng: number;
    updatedAt: Time;
}
export type Time = bigint;
export interface Coordinates {
    latitude: string;
    longitude: string;
}
export interface User {
    id: string;
    vipStatus: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    settings: UserSettings;
    lastSeen: Time;
    location?: Location;
    avatar: string;
    online: boolean;
}
export interface Message {
    seen: boolean;
    text: string;
    recipient: string;
    sender: string;
    timestamp: Time;
}
export interface UserSettings {
    notifications: boolean;
    showOnlineStatus: boolean;
    showInRadius: boolean;
}
export interface LocationInput {
    lat: number;
    lng: number;
}
export interface UserInput {
    id: string;
    vipStatus: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    passwordHash: string;
    avatar: string;
}
export interface PurchaseSettings {
    basicPrice: bigint;
    premiumPrice: bigint;
    enabled: boolean;
    standardPrice: bigint;
}
export interface UserProfile {
    id: string;
    vipStatus: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    settings: UserSettings;
    lastSeen: Time;
    location?: Location;
    avatar: string;
    online: boolean;
}
export interface backendInterface {
    broadcastMessage(text: string): Promise<void>;
    deleteConversation(userId: string, otherUserId: string): Promise<void>;
    deleteMessage(userId: string, otherUserId: string, timestamp: Time): Promise<void>;
    deleteOwnAccount(userId: string, passwordHash: string): Promise<boolean>;
    deleteUser(userId: string): Promise<void>;
    follow(username: string): Promise<string>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getConversation(userId: string, otherUserId: string): Promise<Array<Message>>;
    getCoordinates(): Promise<Coordinates | null>;
    getFollowers(username: string): Promise<Array<string>>;
    getFollowing(username: string): Promise<Array<string>>;
    getLatestBroadcast(): Promise<{
        text: string;
        timestamp: Time;
    } | null>;
    getNewMessages(userId: string, otherUserId: string, lastTimestamp: Time): Promise<Array<Message>>;
    getPurchaseSettings(): Promise<PurchaseSettings>;
    getTotalUnreadCount(userId: string): Promise<bigint>;
    getUnreadCount(userId: string, otherUserId: string): Promise<bigint>;
    getUserById(userId: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    getUserProfile(userPrincipal: Principal): Promise<UserProfile | null>;
    markConversationSeen(userId: string, otherUserId: string): Promise<void>;
    register(input: UserInput): Promise<User>;
    removeFollower(followerUsername: string): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCoordinates(coordinates: Coordinates): Promise<void>;
    sendMessage(sender: string, recipient: string, text: string): Promise<void>;
    setOnlineStatus(userId: string, online: boolean): Promise<User>;
    setPurchaseSettings(settings: PurchaseSettings): Promise<void>;
    setUserVipStatus(userId: string, status: string): Promise<User>;
    unfollow(username: string): Promise<string>;
    updateAvatar(userId: string, avatar: string): Promise<User>;
    updateLocation(userId: string, location: LocationInput): Promise<User>;
    updateSettings(userId: string, settings: UserSettings): Promise<User>;
    updateUserRadiusTier(userId: string, tier: bigint): Promise<User>;
    verifyCredentials(username: string, passwordHash: string): Promise<User | null>;
}
