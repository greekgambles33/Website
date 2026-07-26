"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, PiggyBank } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { fetchActiveLadderRun, fetchLadderRuns, fetchStreamGameBySlug } from "@/lib/streamGamesApi";
import type { LadderRun, StreamGame } from "@/lib/api";

const SLUG = "climb-the-ladder";
const POLL_MS = 3000;

const LEVELS = [
  { level: 1, points: 250, label: "Easy challenge", net: null as number | null },
  { level: 2, points: 500, label: "Medium challenge", net: 250 },
  { level: 3, points: 750, label: "Harder challenge", net: null },
  { level: 4, points: 1000, label: "Chat-controlled challenge", net: null },
  { level: 5, points: 1500, label: "Hard challenge", net: 1000 },
  { level: 6, points: 2000, label: "The Final Climb", net: null },
];

const statusTone = { ACTIVE: "live", CASHED_OUT: "gold", FAILED: "neutral", COMPLETED: "gold" } as const;

function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 50;
}

export default function ClimbTheLadderPublicPage() {
  const [game, setGame] = useState<StreamGame | null>(null);
  const [run, setRun] = useState<LadderRun | null>(null);
  const [history, setHistory] = useState<LadderRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreamGameBySlug(SLUG)
      .then(setGame)
      .catch(() => setGame(null));
  }, []);

  useEffect(() => {
    const load = () =>
      Promise.all([fetchActiveLadderRun(SLUG), fetchLadderRuns(SLUG)])
        .then(([activeRun, runs]) => {
          setRun(activeRun);
          setHistory(runs);
        })
        .finally(() => setLoading(false));
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const attemptingLevel = run ? LEVELS[run.currentLevel] : null;
  const clearedLevel = run && run.currentLevel > 0 ? LEVELS[run.currentLevel - 1] : null;
  const passFailTotal = run ? run.chatPassVotes + run.chatFailVotes : 0;
  const decisionTotal = run ? run.chatCashoutVotes + run.chatClimbVotes : 0;

  return (
    <Section>
      <SectionHeading
        eyebrow="Free to Play · No Money on the Line"
        title="Climb the Ladder"
        description="One climber, six rungs, 250 to 2,000 points. Predict every challenge with !climb pass / !climb fail in Twitch or Kick chat."
      />

      {game?.prizeModeEnabled && game.prizeRulesText && (
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-gold-500/30 bg-gold-500/5 px-5 py-3 text-center text-xs text-gold-200">
          {game.prizeRulesText}
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : !run ? (
        <GlassCard className="mx-auto mt-12 max-w-xl text-center">
          <p className="text-sm text-ash-300">No climb is running right now — check back when the stream&apos;s live.</p>
        </GlassCard>
      ) : (
        <div className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr]">
          <GlassCard className="p-4">
            <div className="space-y-1.5">
              {[...LEVELS].reverse().map((lvl) => {
                const cleared = run.currentLevel >= lvl.level;
                const current = run.status === "ACTIVE" && run.currentLevel + 1 === lvl.level && run.phase === "ATTEMPTING";
                return (
                  <div
                    key={lvl.level}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      current
                        ? "border-transparent bg-gradient-to-r from-gold-300 to-lava-400 font-bold text-[#140a04]"
                        : cleared
                          ? "border-gold-500/30 bg-gold-500/5 text-ash-100"
                          : "border-white/5 text-ash-500"
                    }`}
                  >
                    <span>
                      Lvl {lvl.level} &middot; {lvl.points}
                    </span>
                    {lvl.net && <span className="text-[10px] uppercase tracking-wide opacity-80">net {lvl.net}</span>}
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <div className="space-y-6">
            <GlassCard glow>
              <div className="flex items-center justify-between">
                <Badge tone={statusTone[run.status]} pulse={run.status === "ACTIVE"}>
                  {run.status === "ACTIVE" ? "Climbing" : run.status.replace("_", " ")}
                </Badge>
                <span className="font-heading text-xs uppercase tracking-widest text-ash-500">
                  Secured floor: {run.securedFloor} pts
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-bold text-white">{run.participantName}</h3>

              {run.status !== "ACTIVE" ? (
                <p className="mt-2 text-lg text-gold-300">Finished with {run.finalPoints} points</p>
              ) : run.phase === "ATTEMPTING" && attemptingLevel ? (
                <div className="mt-3">
                  <p className="text-lg text-white">
                    Attempting Level {attemptingLevel.level} &mdash; {attemptingLevel.points} pts
                  </p>
                  <p className="text-sm text-ash-300">{attemptingLevel.label}</p>
                  {passFailTotal > 0 && (
                    <div className="mt-4">
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-ash-800">
                        <div className="bg-lava-400" style={{ width: `${pct(run.chatPassVotes, passFailTotal)}%` }} />
                        <div className="bg-crimson-500" style={{ width: `${pct(run.chatFailVotes, passFailTotal)}%` }} />
                      </div>
                      <div className="mt-1.5 flex justify-between font-mono text-xs text-ash-300">
                        <span>PASS &middot; {pct(run.chatPassVotes, passFailTotal)}%</span>
                        <span>FAIL &middot; {pct(run.chatFailVotes, passFailTotal)}%</span>
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-ash-400">
                    Predict it: <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!climb pass</code> or{" "}
                    <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!climb fail</code>
                  </p>
                </div>
              ) : (
                clearedLevel && (
                  <div className="mt-3">
                    <p className="text-lg text-white">
                      Cleared Level {clearedLevel.level} &mdash; {clearedLevel.points} pts
                    </p>
                    <p className="flex items-center gap-4 text-sm text-ash-300">
                      <span className="flex items-center gap-1">
                        <PiggyBank size={14} /> Cash out?
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp size={14} /> Climb higher?
                      </span>
                    </p>
                    {decisionTotal > 0 && (
                      <div className="mt-4">
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-ash-800">
                          <div className="bg-gold-400" style={{ width: `${pct(run.chatCashoutVotes, decisionTotal)}%` }} />
                          <div className="bg-lava-400" style={{ width: `${pct(run.chatClimbVotes, decisionTotal)}%` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between font-mono text-xs text-ash-300">
                          <span>CASH OUT &middot; {pct(run.chatCashoutVotes, decisionTotal)}%</span>
                          <span>CLIMB &middot; {pct(run.chatClimbVotes, decisionTotal)}%</span>
                        </div>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-ash-400">
                      Predict it: <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!climb cashout</code> or{" "}
                      <code className="rounded bg-ash-800 px-1.5 py-0.5 text-lava-300">!climb higher</code>
                    </p>
                  </div>
                )
              )}
            </GlassCard>

            {history.filter((r) => r.status !== "ACTIVE").length > 0 && (
              <GlassCard>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">Recent Climbers</h3>
                <ol className="mt-3 space-y-2">
                  {history
                    .filter((r) => r.status !== "ACTIVE")
                    .slice(0, 8)
                    .map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-ash-100">{r.participantName}</span>
                        <span className="flex items-center gap-2 text-xs">
                          <Badge tone={statusTone[r.status]}>{r.status.replace("_", " ")}</Badge>
                          <span className="text-gold-300">{r.finalPoints} pts</span>
                        </span>
                      </li>
                    ))}
                </ol>
              </GlassCard>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
