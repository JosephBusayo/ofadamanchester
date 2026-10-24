// Hero stickers drawn in brand colours (the Framer template used burger-brand PNGs).

// 14-point starburst in a 100×94 box.
const burstPoints = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 === 0 ? 1 : 0.8;
  return `${(50 + Math.cos(angle) * 48 * r).toFixed(1)},${(47 + Math.sin(angle) * 45 * r).toFixed(1)}`;
}).join(" ");

const stickerText = {
  fontFamily: "var(--font-knewave)",
  textAnchor: "middle" as const,
};

export function StickerNumberOne({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 100 94" aria-hidden>
      <polygon points={burstPoints} fill="var(--accent)" stroke="var(--bg)" strokeWidth="3" strokeLinejoin="round" />
      <Crown x={64} y={24} />
      <text x="48" y="62" fontSize="34" fill="var(--ink)" transform="rotate(-8 48 50)" style={stickerText}>
        {label}
      </text>
    </svg>
  );
}

export function StickerOval({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "primary" | "accent";
  icon: "crown" | "flame";
}) {
  const fill = tone === "primary" ? "var(--primary)" : "var(--accent)";
  const ink = tone === "primary" ? "var(--on-primary)" : "var(--ink)";
  return (
    <svg viewBox="0 0 120 92" aria-hidden>
      <g transform="rotate(-8 60 46)">
        <ellipse cx="60" cy="46" rx="57" ry="41" fill="var(--bg)" />
        <ellipse cx="60" cy="46" rx="51" ry="35" fill={fill} />
        <text x="54" y="56" fontSize="30" fill={ink} style={stickerText}>
          {label}
        </text>
        <path d="M24 66 C44 61 70 59 94 58" stroke={ink} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        {icon === "crown" ? <Crown x={92} y={30} color={ink} /> : <Flame x={94} y={36} color={ink} />}
      </g>
    </svg>
  );
}

function Crown({ x, y, color = "var(--ink)" }: { x: number; y: number; color?: string }) {
  return (
    <path
      d={`M${x - 8} ${y + 7} L${x - 9} ${y - 4} L${x - 4} ${y + 1} L${x} ${y - 7} L${x + 4} ${y + 1} L${x + 9} ${y - 4} L${x + 8} ${y + 7} Z`}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  );
}

function Flame({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <path
      d={`M${x} ${y + 10} C${x - 7} ${y + 8} ${x - 7} ${y} ${x - 2} ${y - 6} C${x - 1} ${y - 2} ${x + 2} ${y - 1} ${x + 2} ${y - 4} C${x + 6} ${y} ${x + 7} ${y + 8} ${x} ${y + 10} Z`}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  );
}
