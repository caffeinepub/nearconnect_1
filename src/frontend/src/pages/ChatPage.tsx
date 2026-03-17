import { ArrowLeft, CornerUpLeft, Send, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
import { createActorWithConfig } from "../config";
import { type Message, useApp } from "../context/AppContext";

interface ChatPageProps {
  friendId: string;
  onBack: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypingIndicator() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "8px 14px",
        marginBottom: 4,
      }}
    >
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

function getBotReply(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(hi|hello|hey)\b/.test(lower)) {
    return "Hey there! 👋 I'm VibeBot, your VibeZone assistant! How can I help you today?";
  }
  if (lower.includes("help")) {
    return "I can help you find nearby friends, manage your profile, or answer questions about VibeZone! What do you need?";
  }
  if (lower.includes("how") && lower.includes("work")) {
    return "VibeZone uses your location to show you friends within your selected radius. Upgrade your radius tier to find more people!";
  }
  if (lower.includes("radius") || lower.includes("upgrade")) {
    return "Your current radius determines how far away friends appear. Go to Settings > Upgrade Radius to expand it up to 10km!";
  }
  if (
    (lower.includes("friend") && lower.includes("add")) ||
    (lower.includes("how") && lower.includes("find"))
  ) {
    return "Go to the Search tab to find people by username or ID, then start chatting with them!";
  }
  if (lower.includes("location") || lower.includes("permission")) {
    return "Please allow location access so VibeZone can show you nearby friends in real time!";
  }
  if (lower.includes("admin")) {
    return "The admin portal is only accessible to administrators. If you need help, contact support!";
  }
  const defaults = [
    "Got it! 👍",
    "That's interesting! Tell me more.",
    "I'm here if you need anything!",
    "Try exploring the app — there's a lot to discover!",
    "Feel free to ask me anything about VibeZone!",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

interface MsgMenuProps {
  onDelete: () => void;
  onClose: () => void;
  x: number;
  y: number;
}

function MsgMenu({ onDelete, onClose, x, y }: MsgMenuProps) {
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener("click", handler, { once: true });
    return () => document.removeEventListener("click", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: y,
        left: x,
        zIndex: 1000,
        background: "rgba(20,20,35,0.97)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 130,
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        data-ocid="chat.delete_button"
        onClick={onDelete}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "11px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "oklch(0.7 0.2 15)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}

interface DeleteConvDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConvDialog({ onConfirm, onCancel }: DeleteConvDialogProps) {
  return (
    <div
      data-ocid="chat.dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          background: "rgba(20,20,35,0.97)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 18,
          padding: "28px 28px 22px",
          maxWidth: 300,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "oklch(0.35 0.18 15 / 0.3)",
            border: "1px solid oklch(0.5 0.2 15 / 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Trash2 size={20} style={{ color: "oklch(0.7 0.2 15)" }} />
        </div>
        <p
          style={{
            margin: "0 0 6px",
            fontWeight: 700,
            fontSize: 16,
            color: "white",
          }}
        >
          Delete conversation?
        </p>
        <p
          style={{
            margin: "0 0 22px",
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.5,
          }}
        >
          This will remove all messages locally. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            data-ocid="chat.cancel_button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            data-ocid="chat.confirm_button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: 12,
              background: "oklch(0.42 0.22 15)",
              border: "none",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatPage({ friendId, onBack }: ChatPageProps) {
  const {
    friends,
    getConversation,
    sendMessage,
    receiveMessage,
    fetchConversation,
    deleteMessage,
    deleteConversation,
    theme,
    currentUser,
  } = useApp();
  const friend = friends.find((f) => f.id === friendId);
  const isBot = friendId === "bot_vibezone";
  const [messages, setMessages] = useState<Message[]>(() =>
    getConversation(friendId),
  );
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const [msgMenu, setMsgMenu] = useState<{
    msg: Message;
    x: number;
    y: number;
  } | null>(null);
  const [showDeleteConvDialog, setShowDeleteConvDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeStartX = useRef<number>(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLight = theme === "light-clean";
  const messagesLen = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message count and typing state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLen, isTyping]);

  // Poll backend for new messages every 3 seconds (non-bot chats only)
  // biome-ignore lint/correctness/useExhaustiveDependencies: stable function refs
  useEffect(() => {
    if (isBot) return;

    const poll = async () => {
      const merged = await fetchConversation(friendId);
      setMessages(merged);
    };

    // Initial fetch
    poll();

    pollRef.current = setInterval(poll, 3000);
    return () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [friendId, isBot]);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (isBot || !currentUser?.id) return;
    const markSeen = async () => {
      try {
        const actor = await createActorWithConfig();
        await actor.markConversationSeen(currentUser.id, friendId);
      } catch {
        // silent
      }
    };
    markSeen();
  }, [friendId, isBot, currentUser?.id]);

  const handleBotReply = useCallback(
    (userText: string) => {
      setIsTyping(true);
      const delay = 1000 + Math.random() * 500;
      setTimeout(() => {
        setIsTyping(false);
        const replyText = getBotReply(userText);
        receiveMessage(friendId, replyText);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot_${Date.now()}`,
            senderId: friendId,
            text: replyText,
            timestamp: Date.now(),
          },
        ]);
      }, delay);
    },
    [friendId, receiveMessage],
  );

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    const text = input.trim();
    const msg: Message = {
      id: `msg_${Date.now()}`,
      senderId: "me",
      text,
      timestamp: Date.now(),
      replyTo: replyTo?.id,
    };
    setMessages((prev) => [...prev, msg]);
    sendMessage(friendId, text, replyTo?.id);
    setInput("");
    setReplyTo(null);
    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 400);

    if (isBot) {
      handleBotReply(text);
    }
  }, [input, replyTo, friendId, sendMessage, isBot, handleBotReply]);

  const handleTouchStart = (e: React.TouchEvent, msg: Message) => {
    swipeStartX.current = e.touches[0].clientX;
    // Long press for delete menu
    longPressTimer.current = setTimeout(() => {
      if (msg.senderId === "me") {
        const touch = e.touches[0];
        setMsgMenu({
          msg,
          x: Math.min(touch.clientX, window.innerWidth - 150),
          y: touch.clientY,
        });
      }
    }, 600);
  };

  const handleTouchEnd = (e: React.TouchEvent, msg: Message) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 50) {
      setReplyTo(msg);
      inputRef.current?.focus();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (msg.senderId !== "me") return;
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 150);
    const y = Math.min(e.clientY, window.innerHeight - 80);
    setMsgMenu({ msg, x, y });
  };

  const handleDeleteMsg = (msg: Message) => {
    deleteMessage(friendId, msg.id);
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setMsgMenu(null);
  };

  const handleDeleteConversation = () => {
    deleteConversation(friendId);
    setShowDeleteConvDialog(false);
    onBack();
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      <LiquidFluxBg />

      {/* Message context menu */}
      {msgMenu && (
        <MsgMenu
          x={msgMenu.x}
          y={msgMenu.y}
          onDelete={() => handleDeleteMsg(msgMenu.msg)}
          onClose={() => setMsgMenu(null)}
        />
      )}

      {/* Delete conversation dialog */}
      {showDeleteConvDialog && (
        <DeleteConvDialog
          onConfirm={handleDeleteConversation}
          onCancel={() => setShowDeleteConvDialog(false)}
        />
      )}

      {/* Header */}
      <div
        className="glass-card"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          borderRadius: "0 0 20px 20px",
          borderTop: "none",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-ocid="chat.back.button"
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 4,
            color: isLight ? "#333" : "white",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: isBot
                ? "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.15 180))"
                : "linear-gradient(135deg, oklch(0.5 0.25 240), oklch(0.65 0.2 200))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 15,
              color: "white",
            }}
          >
            {friend?.displayName?.[0] || "?"}
          </div>
          {friend?.online && (
            <div
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "oklch(0.75 0.2 140)",
                border: "2px solid rgba(10,10,26,0.9)",
              }}
            />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 600,
              fontSize: 15,
              color: isLight ? "#111" : "white",
            }}
          >
            {friend?.displayName || "Unknown"}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: isLight ? "#888" : "rgba(255,255,255,0.4)",
            }}
          >
            {isTyping && isBot
              ? "typing..."
              : isBot
                ? "VibeBot · Always Online"
                : friend?.online
                  ? "Online"
                  : friend?.lastSeen || "Offline"}
          </p>
        </div>
        {/* Delete conversation button */}
        <button
          type="button"
          data-ocid="chat.delete_button"
          onClick={() => setShowDeleteConvDialog(true)}
          title="Delete conversation"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: "rgba(255,255,255,0.35)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div
        className="momentum-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          position: "relative",
          zIndex: 5,
          padding: "16px 16px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {messages.length === 0 && (
          <div
            data-ocid="chat.empty_state"
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
              marginTop: 40,
            }}
          >
            {isBot ? "Say hi to VibeBot! 👋" : "No messages yet. Say hello! 👋"}
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.senderId === "me";
          const replyMsg = msg.replyTo
            ? messages.find((m) => m.id === msg.replyTo)
            : null;
          // Find the last sent (mine) message index for seen indicator
          const lastMineIdx = messages.reduce(
            (acc, m, idx) => (m.senderId === "me" ? idx : acc),
            -1,
          );
          return (
            <div
              key={msg.id}
              data-ocid={`chat.item.${i + 1}`}
              className={isMine ? "bubble-in-right" : "bubble-in-left"}
              onTouchStart={(e) => handleTouchStart(e, msg)}
              onTouchEnd={(e) => handleTouchEnd(e, msg)}
              onContextMenu={(e) => handleContextMenu(e, msg)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
                animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
              }}
            >
              {replyMsg && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderLeft: "3px solid oklch(0.8 0.15 200)",
                    padding: "4px 10px",
                    borderRadius: "8px 8px 0 0",
                    marginBottom: -2,
                    maxWidth: 260,
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  ↩ {replyMsg.text.slice(0, 50)}
                </div>
              )}
              <div
                style={{
                  maxWidth: "78%",
                  padding: "10px 14px",
                  borderRadius: isMine
                    ? "20px 20px 4px 20px"
                    : "20px 20px 20px 4px",
                  background: isMine
                    ? "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))"
                    : isLight
                      ? "rgba(0,0,0,0.06)"
                      : "rgba(255,255,255,0.1)",
                  color: isLight && !isMine ? "#222" : "white",
                  fontSize: 14,
                  lineHeight: 1.45,
                  backdropFilter: isMine ? "none" : "blur(10px)",
                  boxShadow: isMine
                    ? "0 4px 16px oklch(0.65 0.2 200 / 0.3)"
                    : "none",
                }}
              >
                {msg.text}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  marginTop: 3,
                  paddingInline: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
                {isMine && (
                  <span
                    style={{
                      fontSize: 10,
                      color: msg.seen
                        ? "oklch(0.78 0.2 200)"
                        : "rgba(255,255,255,0.3)",
                      fontWeight: 700,
                      transition: "color 0.4s ease",
                    }}
                  >
                    {msg.seen ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
              {/* Animated seen avatar on last sent message when seen */}
              {isMine && i === lastMineIdx && msg.seen && friend && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}
                  >
                    Seen
                  </span>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, oklch(0.5 0.25 200), oklch(0.65 0.2 200))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 700,
                      color: "white",
                      animation: "seenPulse 2s ease-in-out infinite",
                      boxShadow: "0 0 8px oklch(0.65 0.2 200 / 0.8)",
                    }}
                  >
                    {friend.displayName[0]}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {isTyping && isBot && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              className="glass-card"
              style={{
                padding: "8px 14px",
                borderRadius: "20px 20px 20px 4px",
              }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "rgba(255,255,255,0.06)",
            borderLeft: "3px solid oklch(0.8 0.15 200)",
          }}
        >
          <CornerUpLeft
            size={14}
            style={{ color: "oklch(0.8 0.15 200)", flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {replyTo.text}
          </span>
          <button
            type="button"
            data-ocid="chat.reply.close_button"
            onClick={() => setReplyTo(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        className="glass-card"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px 20px",
          borderRadius: "20px 20px 0 0",
          borderBottom: "none",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          data-ocid="chat.input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={isBot ? "Ask VibeBot anything..." : "Message..."}
          style={{
            flex: 1,
            background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 24,
            padding: "10px 16px",
            color: isLight ? "#111" : "white",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          type="button"
          data-ocid="chat.send.button"
          onClick={handleSend}
          className={sendPulse ? "send-pulse" : ""}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, oklch(0.5 0.25 280), oklch(0.65 0.2 200))",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px oklch(0.65 0.2 200 / 0.4)",
            flexShrink: 0,
          }}
        >
          <Send
            size={17}
            style={{ color: "white", transform: "rotate(-5deg)" }}
          />
        </button>
      </div>
    </div>
  );
}
