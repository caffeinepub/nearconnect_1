import { useEffect, useRef } from "react";
import type { Message } from "../context/AppContext";

export function usePushNotifications({
  isLoggedIn,
  conversations,
  currentUserId,
  incomingFriendRequestCount,
}: {
  isLoggedIn: boolean;
  conversations: { friendId: string; msgs: Message[] }[];
  currentUserId: string | null;
  incomingFriendRequestCount: number;
}) {
  const permissionRequested = useRef(false);
  const prevMessageIds = useRef<Set<string>>(new Set());
  const prevFriendReqCount = useRef(0);
  const initialized = useRef(false);

  // Request permission after delay on login
  useEffect(() => {
    if (!isLoggedIn || permissionRequested.current) return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      permissionRequested.current = true;
      return;
    }
    if (Notification.permission === "denied") return;
    const t = setTimeout(() => {
      Notification.requestPermission();
      permissionRequested.current = true;
    }, 2000);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  // Notify on new messages from others
  useEffect(() => {
    if (!isLoggedIn || !currentUserId) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const isHidden = document.hidden;

    // On first run, just seed the refs without firing
    if (!initialized.current) {
      initialized.current = true;
      for (const { msgs } of conversations) {
        for (const m of msgs) {
          prevMessageIds.current.add(m.id);
        }
      }
      return;
    }

    for (const { friendId, msgs } of conversations) {
      for (const m of msgs) {
        if (prevMessageIds.current.has(m.id)) continue;
        prevMessageIds.current.add(m.id);
        // Only notify on messages FROM the friend (not self-sent)
        if (m.senderId === currentUserId) continue;
        // Don't fire if tab is visible
        if (!isHidden) continue;

        try {
          new Notification("VibeZone \uD83D\uDCAC", {
            body: `New message from ${friendId}`,
            icon: "/favicon.ico",
            tag: `msg-${m.id}`,
          });
        } catch (_) {
          // ignore
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, isLoggedIn, currentUserId]);

  // Notify on new friend requests
  useEffect(() => {
    if (!isLoggedIn) return;
    if (!("Notification" in window)) return;

    if (!initialized.current) {
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
