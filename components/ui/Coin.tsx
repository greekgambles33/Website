import { cn } from "@/lib/utils";

const sizes = {
  xs: 18,
  sm: 28,
  md: 48,
  lg: 80,
  xl: 130,
} as const;

export function Coin({
  size = "sm",
  float = false,
  className,
}: {
  size?: keyof typeof sizes;
  float?: boolean;
  className?: string;
}) {
  const px = sizes[size];
  const gradId = `coin-rim-${size}`;
  const baseId = `coin-base-${size}`;

  return (
    <div
      className={cn(float && "animate-coin-float", className)}
      style={{
        width: px,
        height: px,
        filter: `drop-shadow(0 0 ${px * 0.2}px rgba(255,90,20,.75))`,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width={px} height={px} style={{ display: "block" }}>
        <defs>
          <radialGradient id={baseId} cx="50%" cy="38%" r="70%">
            <stop offset="0%" stopColor="#3a2418" />
            <stop offset="60%" stopColor="#1a0f08" />
            <stop offset="100%" stopColor="#0a0503" />
          </radialGradient>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd15a" />
            <stop offset="50%" stopColor="#ff7a1a" />
            <stop offset="100%" stopColor="#ff2d0f" />
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={48} fill="none" stroke={`url(#${gradId})`} strokeWidth={4} />
        <circle cx={50} cy={50} r={44} fill={`url(#${baseId})`} />
        <path d="M30 44 L26 24 L44 38 Z" fill="#120a05" stroke="#ff7a1a" strokeWidth={1.2} />
        <path d="M70 44 L74 24 L56 38 Z" fill="#120a05" stroke="#ff7a1a" strokeWidth={1.2} />
        <path d="M31 40 L29 30 L38 37 Z" fill="#ff3d12" opacity={0.85} />
        <path d="M69 40 L71 30 L62 37 Z" fill="#ff3d12" opacity={0.85} />
        <circle cx={50} cy={56} r={22} fill="#0d0704" />
        <ellipse cx={42} cy={53} rx={3.6} ry={5} fill="#ffb02a" />
        <ellipse cx={58} cy={53} rx={3.6} ry={5} fill="#ffb02a" />
        <ellipse cx={42} cy={53} rx={1.1} ry={4} fill="#1a0f08" />
        <ellipse cx={58} cy={53} rx={1.1} ry={4} fill="#1a0f08" />
        <path d="M48 61 L52 61 L50 64 Z" fill="#ff5a1a" />
        <path
          d="M50 64 L50 67 M50 67 Q45 69 43 66 M50 67 Q55 69 57 66"
          fill="none"
          stroke="#ff7a1a"
          strokeWidth={1}
          opacity={0.7}
        />
      </svg>
    </div>
  );
}
