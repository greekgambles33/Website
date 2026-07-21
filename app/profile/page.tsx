"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Coins, Copy, Check, ShieldCheck, Clock, Link2, Loader2 } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { API_ENDPOINTS, KICK_CHANNEL_NAME } from "@/lib/api";
import { getAccessToken } from "@/lib/authPersistence";

type KickStep = "idle" | "polling";

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function ProfilePage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [kickUsernameInput, setKickUsernameInput] = useState("");
  const [kickStep, setKickStep] = useState<KickStep>("idle");
  const [kickCode, setKickCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const kickVerified = !!user?.kickVerified && !!user.kickUsername;
  const kickPending = !!user?.kickUsername && !user.kickVerified;

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(API_ENDPOINTS.KICK_VERIFY_STATUS, {
        headers: authHeaders(),
        credentials: "include",
      });
      const data = await res.json();
      if (data.verified) {
        if (pollRef.current) clearInterval(pollRef.current);
        setKickStep("idle");
        setKickCode(null);
        await refresh();
      }
    }, 3000);
  };

  const handleKickVerifyStart = async (usernameOverride?: string) => {
    const kickUsername = (usernameOverride ?? kickUsernameInput).trim();
    if (!kickUsername) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(API_ENDPOINTS.KICK_VERIFY_INITIATE, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(),
        body: JSON.stringify({ kickUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start verification");

      setKickCode(data.code);
      setKickStep("polling");
      startPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start verification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setKickStep("idle");
    setKickCode(null);
  };

  const handleUnlink = async () => {
    await fetch(API_ENDPOINTS.KICK_UNLINK, {
      method: "DELETE",
      credentials: "include",
      headers: authHeaders(),
    });
    await refresh();
  };

  const handleCopy = () => {
    if (!kickCode) return;
    navigator.clipboard.writeText(`!verify ${kickCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lava-400" />
      </div>
    );
  }

  return (
    <Section className="pt-28">
      <div className="mx-auto grid max-w-4xl gap-6">
        <GlassCard glow className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt={user.displayName} width={72} height={72} className="rounded-full" />
          ) : (
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-crimson-600 text-2xl font-bold text-white">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-2xl font-bold text-white">{user.displayName}</h1>
              {user.isAdmin && <Badge tone="gold">Admin</Badge>}
              {user.isModerator && <Badge tone="lava">Moderator</Badge>}
            </div>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ash-500 sm:justify-start">
              <Clock size={12} />
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-gold-300">
            <Coins size={16} />
            <span className="font-semibold">{user.catCoinBalance.toLocaleString()} CC</span>
          </div>
        </GlassCard>

        <GlassCard id="kick-section">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-lava-400" />
            <h2 className="text-lg font-semibold text-white">Link Your Kick Account</h2>
          </div>
          <p className="mt-1 text-sm text-ash-300">
            Verifying your Kick account is required to earn HellCatCoins from chat activity.
          </p>

          <div className="mt-5">
            {kickVerified ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge tone="lava">Verified</Badge>
                  <span className="text-sm font-medium text-white">{user.kickUsername}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleUnlink}>
                  Unlink
                </Button>
              </div>
            ) : kickStep === "polling" && kickCode ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-sm text-ash-300">
                  Post this command in{" "}
                  <a
                    href={`https://kick.com/${KICK_CHANNEL_NAME}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lava-300 underline"
                  >
                    the live chat
                  </a>{" "}
                  to verify:
                </p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-3 rounded-xl border border-lava-500/40 bg-ash-800/60 px-6 py-3 font-mono text-lg font-bold tracking-widest text-white transition-colors hover:border-lava-500/70"
                >
                  !verify {kickCode}
                  {copied ? <Check size={16} className="text-lava-400" /> : <Copy size={16} className="text-ash-400" />}
                </button>
                <div className="flex items-center gap-2 text-xs text-ash-500">
                  <Loader2 size={12} className="animate-spin" />
                  Waiting for verification…
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            ) : kickPending ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge tone="neutral">Pending</Badge>
                  <span className="text-sm font-medium text-white">{user.kickUsername}</span>
                </div>
                <Button size="sm" disabled={submitting} onClick={() => handleKickVerifyStart(user.kickUsername!)}>
                  Verify Now
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleKickVerifyStart();
                }}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <Link2 size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ash-500" />
                  <input
                    value={kickUsernameInput}
                    onChange={(e) => setKickUsernameInput(e.target.value)}
                    placeholder="Your Kick username"
                    className="w-full rounded-full border border-white/10 bg-ash-900/60 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-ash-500 focus:border-lava-500/50 focus:outline-none"
                  />
                </div>
                <Button type="submit" disabled={submitting || !kickUsernameInput.trim()}>
                  {submitting ? "Starting…" : "Link Kick Account"}
                </Button>
              </form>
            )}
            {error && <p className="mt-3 text-xs text-crimson-400">{error}</p>}
          </div>
        </GlassCard>

        <div className="grid gap-6 sm:grid-cols-3">
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-widest text-ash-300">Balance</p>
            <p className="text-ember mt-2 text-2xl font-bold">{user.catCoinBalance.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-widest text-ash-300">Total Earned</p>
            <p className="mt-2 text-2xl font-bold text-white">{user.totalEarned.toLocaleString()}</p>
          </GlassCard>
          <GlassCard className="text-center">
            <p className="text-xs uppercase tracking-widest text-ash-300">Total Spent</p>
            <p className="mt-2 text-2xl font-bold text-white">{user.totalSpent.toLocaleString()}</p>
          </GlassCard>
        </div>
      </div>
    </Section>
  );
}
