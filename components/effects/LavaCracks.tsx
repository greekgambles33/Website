import { cn } from "@/lib/utils";

export function LavaCracks({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none relative h-16 w-full overflow-hidden", className)} aria-hidden="true">
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="crack-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FF2D0F" stopOpacity="0" />
            <stop offset="50%" stopColor="#FF7A1A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF2D0F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,40 Q120,10 220,40 T460,35 Q560,60 680,38 T940,42 Q1040,20 1200,40"
          fill="none"
          stroke="url(#crack-gradient)"
          strokeWidth="1.5"
          className="animate-crack-pulse"
        />
        <path
          d="M0,45 Q150,55 260,42 T520,48 Q640,30 760,46 T1020,44 Q1110,58 1200,46"
          fill="none"
          stroke="url(#crack-gradient)"
          strokeWidth="1"
          opacity="0.5"
          className="animate-crack-pulse"
          style={{ animationDelay: "1.2s" }}
        />
      </svg>
    </div>
  );
}
