export function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-coin font-display text-3xl">{value}</div>
      <div className="font-heading mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ash-300">
        {label}
      </div>
    </div>
  );
}
