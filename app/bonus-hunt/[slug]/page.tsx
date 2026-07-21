"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { GlassCard } from "@/components/ui/GlassCard";
import { HuntDisplay } from "@/components/bonus-hunt/HuntDisplay";
import { fetchHuntBySlug, HuntApiError } from "@/lib/huntsApi";
import type { Hunt } from "@/lib/api";

const POLL_INTERVAL = 5000;

export default function HuntBySlugPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [hunt, setHunt] = useState<Hunt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const data = await fetchHuntBySlug(slug);
        if (cancelled) return;
        setHunt(data);
        setError(null);
        // Only keep polling while the hunt is still running — a completed
        // hunt's shared link should just render its final state once.
        if (data.status === "COMPLETED" && interval) {
          clearInterval(interval);
          interval = undefined;
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof HuntApiError ? err.message : "Hunt not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    interval = setInterval(load, POLL_INTERVAL);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [slug]);

  return (
    <Section>
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 size={28} className="animate-spin text-lava-400" />
        </div>
      ) : error || !hunt ? (
        <GlassCard className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 py-14 text-center">
          <h2 className="text-lg font-semibold text-white">Hunt Not Found</h2>
          <p className="text-sm text-ash-300">{error ?? "This hunt doesn't exist or was removed."}</p>
          <Link
            href="/bonus-hunt"
            className="font-heading mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-lava-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Bonus Hunt
          </Link>
        </GlassCard>
      ) : (
        <HuntDisplay hunt={hunt} />
      )}
    </Section>
  );
}
