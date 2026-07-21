"use client";

import { motion } from "framer-motion";
import { Play, Eye } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { InlineStat } from "@/components/ui/InlineStat";
import { Torii } from "@/components/effects/Torii";
import { streamStatus, heroHighlights } from "@/lib/mock-data";
import { useAuth } from "@/components/providers/AuthProvider";
import { loginWithDiscord } from "@/lib/auth";

export function Hero() {
  const { user, loading } = useAuth();

  return (
    <section
      id="home"
      className="relative mx-auto grid max-w-7xl items-center gap-11 px-4 pb-10 pt-28 sm:px-6 lg:grid-cols-[1fr_1.12fr] lg:px-8 lg:pt-32"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        {streamStatus.isLive && (
          <div className="animate-live-pulse mb-4 inline-flex items-center gap-2 text-crimson-400">
            <span className="font-heading text-xs font-bold uppercase tracking-[0.2em]">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-crimson-500 align-middle shadow-[0_0_12px_#ff2d0f]" />
              Streaming Live &middot; {streamStatus.viewers.toLocaleString()} watching
            </span>
          </div>
        )}

        <h1 className="text-ember text-6xl leading-[0.92] sm:text-7xl md:text-[76px]">
          333 nights
          <br />
          of fire
        </h1>

        <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-ash-300">
          Join the raid every night. Wager on the biggest slots, climb the ranks, and
          stack HellCatCoins toward the fattest rewards vault on the block.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {!loading && user ? (
            <ButtonLink href="/profile" size="lg">
              My Profile
            </ButtonLink>
          ) : (
            <Button size="lg" disabled={loading} onClick={() => loginWithDiscord()}>
              Login with Discord
            </Button>
          )}
          <ButtonLink href="#" variant="secondary" size="lg">
            Watch Stream
          </ButtonLink>
        </div>

        <div className="mt-11 flex gap-9">
          {heroHighlights.map((h) => (
            <InlineStat key={h.label} label={h.label} value={h.value} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-lava-400/30"
        style={{
          background:
            "radial-gradient(100% 80% at 50% 12%, #2a130a, #0a0503 70%)",
        }}
      >
        <Torii />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(0deg, rgba(8,5,4,.92), transparent 52%)" }}
        />

        {streamStatus.isLive && (
          <div className="animate-live-pulse absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-md bg-crimson-500/95 px-2.5 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="font-heading text-[11px] font-bold uppercase tracking-wide text-white">
              Live
            </span>
          </div>
        )}
        {streamStatus.isLive && (
          <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-md bg-ash-950/70 px-2.5 py-1.5">
            <Eye size={12} />
            <span className="font-heading text-[11px] font-bold text-ash-100">
              {streamStatus.viewers.toLocaleString()}
            </span>
          </div>
        )}

        <button
          aria-label="Watch stream"
          className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lava-400/95 text-[#140a04] shadow-[0_0_44px_rgba(255,90,20,0.7)] transition-transform hover:scale-105"
        >
          <Play size={24} className="ml-1" fill="currentColor" />
        </button>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="font-display text-2xl uppercase tracking-wide text-white">
            {streamStatus.isLive ? streamStatus.title : "Offline — check the schedule"}
          </div>
          {streamStatus.isLive && (
            <div className="font-heading mt-1 text-xs font-semibold tracking-wide text-lava-300">
              {streamStatus.category} &middot; live for {Math.floor(streamStatus.uptimeMinutes / 60)}h{" "}
              {streamStatus.uptimeMinutes % 60}m
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
