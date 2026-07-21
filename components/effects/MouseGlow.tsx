"use client";

import { useEffect, useRef } from "react";

export function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!isFinePointer || prefersReducedMotion) return;

    const el = glowRef.current;
    if (!el) return;

    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${targetX - 250}px, ${targetY - 250}px, 0)`;
          raf = 0;
        });
      }
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[500px] w-[500px] rounded-full opacity-40 mix-blend-screen md:block"
      style={{
        background:
          "radial-gradient(circle, rgba(255,122,26,0.16) 0%, rgba(255,45,15,0.08) 40%, transparent 70%)",
        willChange: "transform",
      }}
      aria-hidden="true"
    />
  );
}
