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
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface Coordinates {
    latitude: string;
    longitude: string;
}
export interface User {
    id: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    settings: UserSettings;
    lastSeen: Time;
    location?: Location;
    online: boolean;
}
export interface LocationInput {
    lat: number;
    lng: number;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface UserSettings {
    notifications: boolean;
    showOnlineStatus: boolean;
    showInRadius: boolean;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface UserInput {
    id: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    passwordHash: string;
}
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface PurchaseSettings {
    basicPrice: bigint;
    premiumPrice: bigint;
    enabled: boolean;
    standardPrice: bigint;
}
export interface UserProfile {
    id: string;
    username: string;
    radiusTier: bigint;
    displayName: string;
    settings: UserSettings;
    lastSeen: Time;
    location?: Location;
    online: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteUser(userId: string): Promise<void>;
    follow(username: string): Promise<string>;
    getAllUsers(): Promise<Array<User>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoordinates(): Promise<Coordinates | null>;
    getFollowers(username: string): Promise<Array<string>>;
    getFollowing(username: string): Promise<Array<string>>;
    getPurchaseSettings(): Promise<PurchaseSettings>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserById(userId: string): Promise<User | null>;
    getUserByUsername(username: string): Promise<User | null>;
    getUserProfile(userPrincipal: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    register(input: UserInput): Promise<User>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveCoordinates(coordinates: Coordinates): Promise<void>;
    setOnlineStatus(userId: string, online: boolean): Promise<User>;
    setPurchaseSettings(settings: PurchaseSettings): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unfollow(username: string): Promise<string>;
    updateLocation(userId: string, location: LocationInput): Promise<User>;
    updateSettings(userId: string, settings: UserSettings): Promise<User>;
    verifyCredentials(username: string, passwordHash: string): Promise<User | null>;
    updateUserRadiusTier(userId: string, tier: bigint): Promise<User>;
}
