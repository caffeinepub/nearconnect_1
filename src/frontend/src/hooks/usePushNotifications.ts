import { useEffect, useRef } from "react";

export function usePushNotifications({
  isLoggedIn,
  incomingFriendRequestCount,
}: {
  isLoggedIn: boolean;
  incomingFriendRequestCount: number;
}) {
  const permissionRequested = useRef(false);
  const prevFriendReqCount = useRef(0);
  const initialized = useRef(false);

  // Request permission after delay on login OR if already logged in (old accounts)
  useEffect(() => {
    if (!isLoggedIn || permissionRequested.current) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      permissionRequested.current = true;
      return;
    }
    if (Notification.permission === "denied") return;
    const t = setTimeout(() => {
      Notification.requestPermission().then(() => {
        permissionRequested.current = true;
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  // Notify on new friend requests only
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!("Notification" in window)) return;

    if (!initialized.current) {
      initialized.current = true;
      prevFriendReqCount.current = incomingFriendRequestCount;
      return;
    }

    if (Notification.permission !== "granted") return;
    const diff = incomingFriendRequestCount - prevFriendReqCount.current;
    prevFriendReqCount.current = incomingFriendRequestCount;
    if (diff <= 0) return;
    if (!document.hidden) return;

    try {
      new Notification("VibeZone \uD83D\uDC65", {
        body: "You have a new friend request!",
        icon: "/favicon.ico",
        tag: "friend-request",
      });
    } catch (_) {
      // ignore
    }
  }, [incomingFriendRequestCount, isLoggedIn]);
}
