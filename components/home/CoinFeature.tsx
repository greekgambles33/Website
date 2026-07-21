import { Section } from "@/components/ui/Section";
import { Coin } from "@/components/ui/Coin";
import { InlineStat } from "@/components/ui/InlineStat";

const facts = [
  { label: "Earn Per Hour Watched", value: "+250" },
  { label: "This Week", value: "+12.4K" },
  { label: "Store Items", value: "60+" },
];

export function CoinFeature() {
  return (
    <Section>
      <div
        className="grid items-center gap-11 overflow-hidden rounded-[18px] border border-lava-400/20 p-8 sm:p-12 md:grid-cols-[280px_1fr]"
        style={{
          background: "radial-gradient(120% 120% at 12% 10%, #22110a, #0d0805 70%)",
        }}
      >
        <div className="flex justify-center">
          <Coin size="xl" float />
        </div>
        <div>
          <p className="font-heading mb-2 text-xs font-bold uppercase tracking-[0.3em] text-lava-500">
            The In-House Currency
          </p>
          <h2 className="text-white text-4xl uppercase sm:text-[46px]">HellCatCoins</h2>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ash-300">
            Earn HellCatCoins every time you watch, wager and win. Spend them in the
            store on bonuses, giveaway tickets, merch and exclusive Inferno-tier perks.
            The more you burn, the higher you climb.
          </p>
          <div className="mt-7 flex flex-wrap gap-8">
            {facts.map((f) => (
              <InlineStat key={f.label} label={f.label} value={f.value} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
