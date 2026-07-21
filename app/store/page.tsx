import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Coin } from "@/components/ui/Coin";
import { storeCatalog, storeCategories } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Store | GreekGodBerry",
  description: "Spend HellCatCoins on bonus buys, Discord perks, merch and event tickets.",
};

export default function StorePage() {
  return (
    <Section>
      <SectionHeading
        eyebrow="Spend Your Coins"
        title="Store"
        description="Trade HellCatCoins for rewards — from bonus buys to VIP perks."
      />

      <div className="mt-14 space-y-14">
        {storeCategories
          .filter((category) => category !== "All")
          .map((category) => {
            const items = storeCatalog.filter((item) => item.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-ash-300">
                  {category}
                </h3>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((item) => (
                    <GlassCard key={item.id} className="flex flex-col">
                      {item.limited && (
                        <Badge tone="gold" className="w-fit">
                          Limited
                        </Badge>
                      )}
                      <h4 className="mt-3 text-base font-semibold text-white">{item.name}</h4>
                      <div className="mt-4 flex items-center gap-1.5 text-lava-300">
                        <Coin size="xs" />
                        <span className="font-heading text-sm font-bold">
                          {item.price.toLocaleString()}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </Section>
  );
}
