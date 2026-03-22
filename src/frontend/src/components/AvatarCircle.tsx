interface AvatarCircleProps {
  avatar?: string;
  displayName: string;
  size?: number;
  isBot?: boolean;
  colorIndex?: number;
  online?: boolean;
  fontSize?: number;
}

export function AvatarCircle({
  avatar,
  displayName,
  size = 48,
  isBot = false,
  colorIndex = 0,
  online,
  fontSize,
}: AvatarCircleProps) {
  const content = avatar?.trim() ? avatar.trim() : displayName[0];
  const isEmoji = (avatar?.trim().length ?? 0) > 0;
  const fSize =
    fontSize ?? (isEmoji && content.length > 1 ? size * 0.42 : size * 0.38);

  const bg = isBot
    ? "linear-gradient(135deg, oklch(0.45 0.2 140), oklch(0.6 0.15 180))"
    : `linear-gradient(135deg, oklch(0.5 0.25 ${200 + colorIndex * 40}), oklch(0.65 0.2 ${260 + colorIndex * 40}))`;

  return (
    <div
      style={{ position: "relative", flexShrink: 0, display: "inline-block" }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: fSize,
          color: "white",
          fontFamily: "'Bricolage Grotesque', sans-serif",
          overflow: "hidden",
          lineHeight: 1,
        }}
      >
        {content}
      </div>
      {online && (
        <div
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: Math.max(8, size * 0.22),
            height: Math.max(8, size * 0.22),
            borderRadius: "50%",
            background: "oklch(0.75 0.2 140)",
            border: "2px solid rgba(10,10,26,0.9)",
          }}
        />
      )}
    </div>
  );
}
