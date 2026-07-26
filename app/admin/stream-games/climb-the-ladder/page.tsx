"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Trash2, TrendingUp, PiggyBank } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  fetchActiveLadderRun,
  fetchLadderRuns,
  createLadderRun,
  deleteLadderRun,
  passLadderChallenge,
  failLadderChallenge,
  cashOutLadderRun,
  climbLadderHigher,
  StreamGameApiError,
} from "@/lib/streamGamesApi";
import type { LadderRun } from "@/lib/api";

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

export default function ClimbTheLadderControlPanel() {
  const [run, setRun] = useState<LadderRun | null>(null);
  const [history, setHistory] = useState<LadderRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [participantName, setParticipantName] = useState("");

  const load = useCallback(async () => {
    try {
      const [active, runs] = await Promise.all([fetchActiveLadderRun(SLUG), fetchLadderRuns(SLUG)]);
      setRun(active);
      setHistory(runs);
    } catch {
      // stay on last known state — the poll will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const runAction = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await action();
      await load();
    } catch (err) {
      alert(err instanceof StreamGameApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const attemptingLevel = run ? LEVELS[run.currentLevel] : null;
  const clearedLevel = run && run.currentLevel > 0 ? LEVELS[run.currentLevel - 1] : null;
  const totalVotes = run ? run.chatPassVotes + run.chatFailVotes : 0;
  const totalDecisionVotes = run ? run.chatCashoutVotes + run.chatClimbVotes : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/stream-games"
        className="flex w-fit items-center gap-1.5 text-xs font-semibold text-ash-400 hover:text-white"
      >
        <ArrowLeft size={13} /> Stream Games
      </Link>

      <div>
        <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lava-500">Live Control</p>
        <h2 className="text-ember text-2xl sm:text-3xl">Climb the Ladder</h2>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-lava-400" />
        </div>
      ) : !run ? (
        <GlassCard>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-widest text-ash-100">No climb running</h3>
          <p className="mt-1 text-sm text-ash-300">Bring up a climber to start a run.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Climber's name"
              className="ggb-input"
            />
            <Button
              size="sm"
              disabled={busy || !participantName.trim()}
              onClick={() =>
                runAction(async () => {
                  await createLadderRun(SLUG, participantName.trim());
                  setParticipantName("");
                })
              }
            >
              Start Climb
            </Button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard>
            <div className="flex items-center justify-between">
              <Badge tone={statusTone[run.status]} pulse={run.status === "ACTIVE"}>
                {run.status === "ACTIVE" ? "Climbing" : run.status.replace("_", " ")}
              </Badge>
              <button
                onClick={() => {
                  if (confirm("Delete this run? This can't be undone.")) runAction(() => deleteLadderRun(run.id));
                }}
                aria-label="Delete run"
                className="rounded-full p-2 text-ash-500 transition-colors hover:bg-crimson-500/10 hover:text-crimson-300"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <h3 className="mt-3 text-xl font-bold text-white">{run.participantName}</h3>

            {run.status !== "ACTIVE" ? (
              <p className="mt-2 text-sm text-ash-300">
                Ended with <span className="text-gold-300">{run.finalPoints}</span> points.
              </p>
            ) : run.phase === "ATTEMPTING" && attemptingLevel ? (
              <div className="mt-3">
                <p className="text-sm text-ash-100">
                  Attempting <strong>Level {attemptingLevel.level}</strong> &mdash; {attemptingLevel.points} pts &middot;{" "}
                  {attemptingLevel.label}
                </p>
                <p className="mt-1 text-xs text-ash-400">
                  Secured floor: {run.securedFloor} pts
                  {totalVotes > 0 && ` · chat: ${run.chatPassVotes} pass / ${run.chatFailVotes} fail`}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" disabled={busy} onClick={() => runAction(() => passLadderChallenge(run.id))}>
                    <CheckCircle2 size={14} /> Pass Challenge
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => runAction(() => failLadderChallenge(run.id))}
                  >
                    <XCircle size={14} /> Fail Challenge
                  </Button>
                </div>
              </div>
            ) : (
              clearedLevel && (
                <div className="mt-3">
                  <p className="text-sm text-ash-100">
                    Cleared <strong>Level {clearedLevel.level}</strong> &mdash; {clearedLevel.points} pts banked so far
                  </p>
                  <p className="mt-1 text-xs text-ash-400">
                    Secured floor: {run.securedFloor} pts
                    {totalDecisionVotes > 0 && ` · chat: ${run.chatCashoutVotes} cash out / ${run.chatClimbVotes} climb`}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" disabled={busy} onClick={() => runAction(() => cashOutLadderRun(run.id))}>
                      <PiggyBank size={14} /> Cash Out ({clearedLevel.points})
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => runAction(() => climbLadderHigher(run.id))}
                    >
                      <TrendingUp size={14} /> Climb Higher
                    </Button>
                  </div>
                </div>
              )
            )}
          </GlassCard>

          {/* Ladder visual */}
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
                      Level {lvl.level} &middot; {lvl.points} pts
                    </span>
                    {lvl.net && <span className="text-[10px] uppercase tracking-wide opacity-80">net {lvl.net}</span>}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-500">Recent Runs</h3>
          <div className="mt-2 space-y-1.5">
            {history
              .filter((r) => r.status !== "ACTIVE")
              .map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs text-ash-400">
                  <span>{r.participantName}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={statusTone[r.status]}>{r.status.replace("_", " ")}</Badge>
                    <span className="text-gold-300">{r.finalPoints} pts</span>
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
