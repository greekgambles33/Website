"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  alpha: number;
  hue: number;
  flicker: number;
};

const COLORS = [
  [255, 122, 26],
  [255, 176, 77],
  [255, 45, 15],
  [255, 209, 90],
];

export function EmberField({ density = 1 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let embers: Ember[] = [];
    let frame = 0;
    let visible = true;

    const spawnEmber = (): Ember => {
      return {
        x: Math.random() * width,
        y: height + Math.random() * 100,
        radius: 1 + Math.random() * 2.4,
        speed: 0.35 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 0.6,
        alpha: 0.3 + Math.random() * 0.5,
        hue: Math.floor(Math.random() * COLORS.length),
        flicker: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const area = width * height;
      const count = Math.min(90, Math.max(18, Math.floor((area / 22000) * density)));
      embers = Array.from({ length: count }, spawnEmber);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      frame++;

      for (const e of embers) {
        e.y -= e.speed;
        e.x += e.drift + Math.sin((frame + e.flicker * 40) / 60) * 0.3;
        const flick = 0.7 + 0.3 * Math.sin(frame / 12 + e.flicker);

        if (e.y < -10) {
          Object.assign(e, spawnEmber(), { y: height + 10 });
        }

        const [r, g, b] = COLORS[e.hue];
        const gradient = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius * 4);
        gradient.addColorStop(0, `rgba(${r},${g},${b},${e.alpha * flick})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, e.alpha * flick + 0.2)})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    let raf = 0;
    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };

    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibility);

    if (prefersReducedMotion) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
