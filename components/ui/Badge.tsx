import { cn } from "@/lib/utils";

type Tone = "live" | "lava" | "gold" | "neutral";

const tones: Record<Tone, string> = {
  live: "bg-crimson-500/90 text-white border-transparent",
  lava: "bg-lava-500/15 text-lava-300 border-lava-500/40",
  gold: "bg-gold-500/15 text-gold-400 border-gold-500/40",
  neutral: "bg-ash-700/60 text-ash-300 border-white/10",
};

export function Badge({
  children,
  tone = "neutral",
  pulse = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-heading inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        tones[tone],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
