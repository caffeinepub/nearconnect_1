import { ArrowLeft, CornerUpLeft, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiquidFluxBg } from "../components/LiquidFluxBg";
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
    return "Hey there! 👋 I'm NearBot, your NearConnect assistant! How can I help you today?";
  }
  if (lower.includes("help")) {
    return "I can help you find nearby friends, manage your profile, or answer questions about NearConnect! What do you need?";
  }
  if (lower.includes("how") && lower.includes("work")) {
    return "NearConnect uses your location to show you friends within your selected radius. Upgrade your radius tier to find more people!";
  }
  if (lower.includes("radius") || lower.includes("upgrade")) {
    return "Your current radius determines how far away friends appear. Go to Settings > Upgrade Radius to expand it up to 10km!";
  }
  if (
    (lower.includes("friend") && lower.includes("add")) ||
    (lower.includes("how") && lower.includes("find"))
  ) {
    return "Go to the Search tab to find people by username or ID, then tap Add to send them a friend request!";
  }
  if (lower.includes("location") || lower.includes("permission")) {
    return "Please allow location access so NearConnect can show you nearby friends in real time!";
  }
  if (lower.includes("admin")) {
    return "The admin portal is only accessible to administrators. If you need help, contact support!";
  }
  const defaults = [
    "Got it! 👍",
    "That's interesting! Tell me more.",
    "I'm here if you need anything!",
    "Try exploring the app — there's a lot to discover!",
    "Feel free to ask me anything about NearConnect!",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

export function ChatPage({ friendId, onBack }: ChatPageProps) {
  const { friends, getConversation, sendMessage, receiveMessage, theme } =
    useApp();
  const friend = friends.find((f) => f.id === friendId);
  const isBot = friendId === "bot_nearconnect";
  const [messages, setMessages] = useState<Message[]>(() =>
    getConversation(friendId),
  );
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeStartX = useRef<number>(0);
  const isLight = theme === "light-clean";
  const messagesLen = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll triggered by message count and typing state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesLen, isTyping]);

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

  const simulateFriendTyping = useCallback(
    (responseText: string) => {
      setIsTyping(true);
      let displayed = "";
      let i = 0;
      const interval = setInterval(() => {
        displayed += responseText[i];
        i++;
        if (i >= responseText.length) {
          clearInterval(interval);
          setIsTyping(false);
          const newMsg: Message = {
            id: `auto_${Date.now()}`,
            senderId: friendId,
            text: displayed,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, newMsg]);
        }
      }, 45);
    },
    [friendId],
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
    } else {
      const replies = [
        "Sounds great! 👌",
        "Yeah, totally agree!",
        "Let me check and get back to you 🤔",
        "That's awesome! 🔥",
        "Sure thing!",
        "On my way! 🚀",
        "Haha yes exactly 😄",
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setTimeout(() => simulateFriendTyping(reply), 800 + Math.random() * 1200);
    }
  }, [
    input,
    replyTo,
    friendId,
    sendMessage,
    isBot,
    handleBotReply,
    simulateFriendTyping,
  ]);

  const handleTouchStart = (e: React.TouchEvent, _msg: Message) => {
    swipeStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent, msg: Message) => {
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (dx > 50) {
      setReplyTo(msg);
      inputRef.current?.focus();
    }
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
            {isTyping
              ? "typing..."
              : isBot
                ? "NearConnect Bot · Always Online"
                : friend?.online
                  ? "Online"
                  : friend?.lastSeen || "Offline"}
          </p>
        </div>
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
        {messages.map((msg, i) => {
          const isMine = msg.senderId === "me";
          const replyMsg = msg.replyTo
            ? messages.find((m) => m.id === msg.replyTo)
            : null;
          return (
            <div
              key={msg.id}
              data-ocid={`chat.item.${i + 1}`}
              className={isMine ? "bubble-in-right" : "bubble-in-left"}
              onTouchStart={(e) => handleTouchStart(e, msg)}
              onTouchEnd={(e) => handleTouchEnd(e, msg)}
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
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  marginTop: 3,
                  paddingInline: 4,
                }}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          );
        })}

        {isTyping && (
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
          placeholder={isBot ? "Ask NearBot anything..." : "Message..."}
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
