"use client";

import { X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

export function InfoModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <GlassCard className="max-h-[80vh] w-full max-w-md overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ash-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-ash-300">{children}</div>
      </GlassCard>
    </div>
  );
}

export function InfoButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="font-heading rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ash-300 hover:text-white"
    >
      {label}
    </button>
  );
}
