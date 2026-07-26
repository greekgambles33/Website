"use client";

import { useEffect, useState } from "react";
import { Loader2, Flame, Trophy, MessageSquare } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchActivePredictionMatch,
  fetchPredictionLeaderboard,
  fetchMyPredictionStats,
} from "@/lib/streamGamesApi";
import type { PredictionMatch, PredictionLeaderboardEntry, PredictionUserStats } from "@/lib/api";

const SLUG = "chat-vs-streamer";
const POLL_MS = 3000;

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export default function ChatVsStreamerPublicPage() {
  const { user } = useAuth();
  const [match, setMatch] = useState<PredictionMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<PredictionUserStats | null>(null);

  useEffect(() => {
    const load = () => fetchActivePredictionMatch(SLUG).then(setMatch).finally(() => setLoading(false));
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPredictionLeaderboard(period).then(setLeaderboard);
  }, [period]);

  useEffect(() => {
    if (user) fetchMyPredictionStats().then(setMyStats).catch(() => setMyStats(null));
  }, [user]);

  const currentRound = match?.rounds[0]?.status === "OPEN" || match?.rounds[0]?.status === "LOCKED" ? match.rounds[0] : null;
  const totalVotes = currentRound ? currentRound.votesChat + currentRound.votesStreamer : 0;
  const chatPct = totalVotes ? currentRound!.votesChat / totalVotes : 0.5;

  return (
    <Section>
      <SectionHeading
        eyebrow="Free to Play · No Money on the Line"
        title="Chat vs Streamer"
        description="The streamer calls it, chat votes on Twitch or Kick with !win chat or !win streamer. Right call wins the point."
      />

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : !match ? (
        <GlassCard className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-sm text-ash-300">No match is running right now — check back when the stream&apos;s live.</p>
        </GlassCard>
      ) : (
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center justify-between">
                <Badge tone="live" pulse>
                  {match.status === "ACTIVE" ? "Match Live" : `${match.winner} Won`}
                </Badge>
                <span className="font-heading text-xs uppercase tracking-widest text-ash-500">
                  First to {match.targetScore}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="font-heading text-xs uppercase tracking-widest text-ash-500">Chat</p>
                  <p className="text-ember text-5xl">{match.chatScore}</p>
                  {match.chatStreak >= 3 && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gold-400">
                      <Flame size={13} /> {match.chatStreak} streak
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-heading text-xs uppercase tracking-widest text-ash-500">Streamer</p>
                  <p className="text-ember text-5xl">{match.streamerScore}</p>
                  {match.streamerStreak >= 3 && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gold-400">
                      <Flame size={13} /> {match.streamerStreak} streak
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>

            {currentRound && (
              <GlassCard glow>
                <p className="text-xs font-semibold uppercase tracking-widest text-lava-300">
                  {currentRound.status === "OPEN" ? "Voting open" : "Locked — awaiting result"}
                </p>
                <p className="mt-2 text-lg text-white">{currentRound.question}</p>

                <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-ash-800">
                  <div className="bg-lava-400" style={{ width: `${chatPct * 100}%` }} />
                  <div className="bg-crimson-500" style={{ width: `${(1 - chatPct) * 100}%` }} />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-xs text-ash-300">
                  <span>CHAT · {pct(chatPct)}</span>
                  <span>STREAMER · {pct(1 - chatPct)}</span>
                </div>

                {currentRound.status === "OPEN" && (
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-ash-400">
                    <MessageSquare size={13} /> Type <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!win chat</code> or{" "}
                    <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!win streamer</code> in chat to vote.
                  </p>
                )}
              </GlassCard>
            )}

            {match.status === "COMPLETED" && match.challengeText && (
              <GlassCard>
                <p className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-500">
                  Loser&apos;s challenge
                </p>
                <p className="mt-1 text-sm text-ash-100">{match.challengeText}</p>
              </GlassCard>
            )}
          </div>

          <div className="space-y-6">
            <GlassCard>
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">
                  <Trophy size={15} className="text-gold-400" /> Leaderboard
                </h3>
                <div className="flex gap-1">
                  {(["week", "month"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        period === p ? "bg-lava-500/20 text-lava-300" : "text-ash-500 hover:text-ash-200"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <p className="mt-4 text-xs text-ash-500">No qualified predictors yet — link your Twitch/Kick and vote!</p>
              ) : (
                <ol className="mt-4 space-y-2.5">
                  {leaderboard.map((entry, i) => (
                    <li key={entry.user.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ash-100">
                        <span className="w-4 text-ash-500">{i + 1}</span>
                        {entry.user.displayName}
                      </span>
                      <span className="text-xs text-ash-400">
                        {pct(entry.accuracy)} · {entry.correctPredictions}/{entry.totalPredictions}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </GlassCard>

            {user && myStats && (
              <GlassCard>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">Your Record</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{myStats.correctPredictions}</p>
                    <p className="text-[11px] uppercase tracking-wide text-ash-500">Correct</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pct(myStats.accuracy)}</p>
                    <p className="text-[11px] uppercase tracking-wide text-ash-500">Accuracy</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-lg font-bold text-gold-400">{myStats.longestStreak}</p>
                    <p className="text-[11px] uppercase tracking-wide text-ash-500">Best Streak</p>
                  </div>
                </div>
                {myStats.totalPredictions === 0 && (
                  <p className="mt-3 text-xs text-ash-500">
                    Link your Twitch or Kick account on your profile so your votes count toward your record.
                  </p>
                )}
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
