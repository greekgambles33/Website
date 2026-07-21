"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";
import { GlassCard } from "./GlassCard";

function formatNumber(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

export function StatTile({ label, value }: { label: string; value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [isInView, value]);

  return (
    <GlassCard ref={ref} className="text-center">
      <div className="text-coin font-display text-3xl sm:text-4xl">
        {formatNumber(display)}
      </div>
      <div className="font-heading mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ash-300">
        {label}
      </div>
    </GlassCard>
  );
}
