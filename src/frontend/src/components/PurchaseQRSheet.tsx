import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface PurchaseQRSheetProps {
  open: boolean;
  onClose: () => void;
  onManualClose: () => void;
  tierName: string;
  price: string;
}

const TOTAL_SECONDS = 15 * 60;

export function PurchaseQRSheet({
  open,
  onClose,
  onManualClose,
  tierName,
  price,
}: PurchaseQRSheetProps) {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [expired, setExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setSecondsLeft(TOTAL_SECONDS);
    setExpired(false);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!expired) return;
    const t = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(t);
  }, [expired, onClose]);

  const handleManualClose = () => {
    if (!expired) {
      onManualClose();
    }
    onClose();
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const progress = secondsLeft / TOTAL_SECONDS;
  const isLow = secondsLeft < 60;

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="purchase-fullscreen"
          data-ocid="purchase.sheet"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1002,
            background: "linear-gradient(180deg, #1a1030 0%, #0e0a1f 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
          }}
        >
          {/* Close button */}
          <button
            type="button"
            data-ocid="purchase.close_button"
            onClick={handleManualClose}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#ccc",
            }}
          >
            <X size={18} />
          </button>

          <AnimatePresence mode="wait">
            {expired ? (
              <motion.div
                key="expired"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: "center", padding: "40px 24px" }}
              >
                <div style={{ fontSize: 64, marginBottom: 16 }}>⏱</div>
                <div
                  style={{
                    color: "#ff6b6b",
                    fontWeight: 700,
                    fontSize: 22,
                    marginBottom: 10,
                  }}
                >
                  Session Expired
                </div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}>
                  Your payment session has expired. Please try again.
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  padding: "24px 20px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {/* Header */}
                <div style={{ textAlign: "center", width: "100%" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(180,140,255,0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: 6,
                    }}
                  >
                    Complete Purchase
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    {tierName} Tier
                    <span
                      style={{
                        background: "linear-gradient(90deg, #9b5de5, #f15bb5)",
                        borderRadius: 8,
                        padding: "3px 12px",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {price}
                    </span>
                  </div>
                </div>

                {/* QR Code */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 10,
                    boxShadow: "0 0 40px rgba(155,93,229,0.5)",
                  }}
                >
                  <img
                    src="/assets/uploads/screenshot_2026-03-28-23-08-16-82_ba41e9a642e6e0e2b03656bfbbffd6e4-019d35c0-77a1-7036-9dc3-68610a2e9eae-1.jpg"
                    alt="Payment QR Code"
                    style={{
                      width: "min(80vw, 280px)",
                      height: "min(80vw, 280px)",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  Scan to pay via UPI / any payment app
                </div>

                {/* Timer */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="90"
                    height="90"
                    viewBox="0 0 90 90"
                    aria-label="Payment session countdown timer"
                  >
                    <title>Payment session countdown timer</title>
                    <circle
                      cx="45"
                      cy="45"
                      r={r}
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="45"
                      cy="45"
                      r={r}
                      fill="none"
                      stroke={isLow ? "#ff6b6b" : "#9b5de5"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 45 45)"
                      style={{
                        transition: "stroke-dashoffset 1s linear, stroke 0.3s",
                      }}
                    />
                    <text
                      x="45"
                      y="51"
                      textAnchor="middle"
                      fill={isLow ? "#ff6b6b" : "#fff"}
                      fontSize="16"
                      fontWeight="700"
                      fontFamily="monospace"
                    >
                      {mm}:{ss}
                    </text>
                  </svg>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 12,
                      textAlign: "center",
                    }}
                  >
                    Session expires in {mm}:{ss}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 11,
                    lineHeight: 1.6,
                    padding: "0 16px",
                  }}
                >
                  After payment, please wait for admin to upgrade your tier.
                  {"\n"}
                  Contact admin via Settings if tier is not updated.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
