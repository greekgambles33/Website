import { cn } from "@/lib/utils";

export function Torii({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMax meet"
      className={cn(
        "pointer-events-none absolute bottom-[-6px] left-1/2 h-[72%] w-[62%] -translate-x-1/2 opacity-50",
        className
      )}
      style={{ animation: "flicker 4s ease-in-out infinite" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="torii-stroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9a2a" />
          <stop offset="100%" stopColor="#ff2d0f" />
        </linearGradient>
      </defs>
      <path
        d="M20 34 Q200 8 380 34 L380 52 Q200 26 20 52 Z"
        fill="#0a0503"
        stroke="url(#torii-stroke)"
        strokeWidth={2}
      />
      <rect x={60} y={66} width={280} height={16} fill="#0a0503" stroke="url(#torii-stroke)" strokeWidth={1.5} />
      <rect x={176} y={52} width={48} height={30} fill="#0d0704" stroke="url(#torii-stroke)" strokeWidth={1.5} />
      <rect x={96} y={82} width={22} height={150} fill="#0a0503" stroke="url(#torii-stroke)" strokeWidth={1.5} />
      <rect x={282} y={82} width={22} height={150} fill="#0a0503" stroke="url(#torii-stroke)" strokeWidth={1.5} />
    </svg>
  );
}
