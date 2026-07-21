import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function GlassCard({
  className,
  glow = false,
  hover = true,
  ref,
  ...props
}: ComponentProps<"div"> & { glow?: boolean; hover?: boolean }) {
  return (
    <div
      ref={ref}
      className={cn(
        "glass-panel relative rounded-2xl p-6",
        glow && "glow-border",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:border-lava-400/50 hover:shadow-[0_18px_40px_rgba(255,60,15,0.15)]",
        className
      )}
      {...props}
    />
  );
}
