import { cn } from "@/lib/utils";

type IconKey = "instagram" | "discord" | "kick" | "youtube" | "x" | "tiktok";

const keyByName: Record<string, IconKey> = {
  Instagram: "instagram",
  Discord: "discord",
  Kick: "kick",
  YouTube: "youtube",
  X: "x",
  TikTok: "tiktok",
};

const hoverClass: Record<IconKey, string> = {
  instagram: "group-hover:border-[#ff5a8a] group-hover:bg-[#ff5a8a]/10",
  discord: "group-hover:border-[#7a8aff] group-hover:bg-[#7a8aff]/10",
  kick: "group-hover:border-[#53fc18] group-hover:bg-[#53fc18]/10",
  youtube: "group-hover:border-[#ff2d0f] group-hover:bg-[#ff2d0f]/10",
  x: "group-hover:border-ash-100 group-hover:bg-white/10",
  tiktok: "group-hover:border-[#25f4ee] group-hover:bg-[#25f4ee]/10",
};

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const glyphs: Record<IconKey, React.ReactNode> = {
  instagram: (
    <>
      <rect x={3} y={3} width={18} height={18} rx={5} {...strokeProps} />
      <circle cx={12} cy={12} r={4} {...strokeProps} />
      <circle cx={17.5} cy={6.5} r={0.9} fill="currentColor" stroke="none" />
    </>
  ),
  discord: (
    <>
      <path
        d="M8 8.5a15 15 0 0 1 8 0M7.5 16.5a13 13 0 0 0 9 0M5.5 17.5C4.2 14 4 10.5 5.5 7A13 13 0 0 1 9.5 5.7l.6 1.4M18.5 17.5C19.8 14 20 10.5 18.5 7A13 13 0 0 0 14.5 5.7l-.6 1.4"
        {...strokeProps}
      />
      <ellipse cx={9.5} cy={12.5} rx={1} ry={1.3} fill="currentColor" stroke="none" />
      <ellipse cx={14.5} cy={12.5} rx={1} ry={1.3} fill="currentColor" stroke="none" />
    </>
  ),
  kick: <path d="M5 4h4v5l4-5h5l-6 8 6 8h-5l-4-5v5H5z" fill="currentColor" stroke="none" />,
  youtube: (
    <>
      <rect x={3} y={6} width={18} height={12} rx={3.5} {...strokeProps} />
      <path d="M10.5 9.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  x: <path d="M4 4l7 9M4 20l7-8M13 11l7-7M13 13l7 7" {...strokeProps} />,
  tiktok: (
    <path
      d="M13 3v10.8a3 3 0 1 1-2.4-2.94M13 3c.4 2.3 2 3.9 4.3 4.2M13 3h3.5"
      {...strokeProps}
    />
  ),
};

export function SocialIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const key = keyByName[name] ?? "x";

  return (
    <span
      className={cn(
        "flex h-[42px] w-[42px] items-center justify-center rounded-[11px] border border-lava-400/25 bg-ash-950/70 text-ash-100 transition-all duration-200 group-hover:-translate-y-0.5",
        hoverClass[key],
        className
      )}
      aria-hidden="true"
    >
      <svg width={19} height={19} viewBox="0 0 24 24">
        {glyphs[key]}
      </svg>
    </span>
  );
}
