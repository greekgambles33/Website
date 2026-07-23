"use client";

import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Coin } from "@/components/ui/Coin";
import { useSiteContent } from "@/lib/hooks/useSiteContent";
import type { StoreItemContent } from "@/lib/api";

export function StorePreview() {
  const { data: allItems } = useSiteContent<StoreItemContent[]>("store");
  const items = (allItems ?? []).slice(0, 4);

  if (items.length === 0) return null;

  return (
    <Section id="store">
      <SectionHeading
        eyebrow="Spend Your Coins"
        title="Store"
        description="Trade HellCatCoins for rewards — from bonus buys to VIP perks."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <GlassCard key={item.id} className="flex flex-col">
            {item.limited && (
              <Badge tone="gold" className="w-fit">
                Limited
              </Badge>
            )}
            <p className="font-heading mt-3 text-xs font-semibold uppercase tracking-widest text-ash-300">
              {item.category}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">{item.name}</h3>
            <div className="mt-4 flex items-center gap-1.5 text-lava-300">
              <Coin size="xs" />
              <span className="font-heading text-sm font-bold">
                {item.price.toLocaleString()}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 text-center">
        <ButtonLink href="/store" variant="secondary">
          Browse Store
        </ButtonLink>
      </div>
    </Section>
  );
}
