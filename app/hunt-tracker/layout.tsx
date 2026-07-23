"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Coin } from "@/components/ui/Coin";

export default function HuntTrackerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && (user.isAdmin || user.isModerator);

  useEffect(() => {
    if (!loading && !allowed) router.replace("/");
  }, [loading, allowed, router]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-lava-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
        <Link href="/" className="font-heading flex items-center gap-2.5 text-base font-bold uppercase tracking-wide">
          <Coin size="sm" />
          <span>
            Greek<span className="text-lava-400">God</span>Berry <span className="text-ash-400">Admin</span>
          </span>
        </Link>
        <Link
          href="/"
          className="font-heading flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ash-300 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to Site
        </Link>
      </div>

      <div className="mb-8">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.3em] text-lava-500">Moderator Tools</p>
        <h1 className="text-ember text-3xl sm:text-4xl">Hunt Tracker</h1>
      </div>

      {children}
    </div>
  );
}
