"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { AnnouncementContent } from "@/lib/api";
import { Pin } from "lucide-react";

export function Announcements() {
  const { data: announcements } = useSiteContent<AnnouncementContent[]>("announcements");

  if (!announcements || announcements.length === 0) return null;

  return (
    <Section>
      <SectionHeading eyebrow="Stay Informed" title="Latest Announcements" />

      <div className="mx-auto mt-12 max-w-3xl space-y-4">
        {announcements.map((a) => (
          <GlassCard key={a.id} className="flex items-start gap-4">
            {a.pinned && (
              <Pin size={16} className="mt-1 shrink-0 text-lava-400" />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-semibold text-white">{a.title}</h3>
                {a.pinned && <Badge tone="lava">Pinned</Badge>}
              </div>
              <p className="mt-2 text-sm text-ash-300">{a.body}</p>
              <p className="mt-2 text-xs text-ash-500">{a.date}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}
