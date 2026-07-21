export function SmokeLayer() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-crimson-700/20 blur-[120px] animate-flicker" />
      <div
        className="absolute -right-1/4 top-1/3 h-[65%] w-[65%] rounded-full bg-lava-600/15 blur-[140px] animate-flicker"
        style={{ animationDelay: "1.4s" }}
      />
      <div
        className="absolute left-1/3 bottom-0 h-[55%] w-[55%] rounded-full bg-ash-700/40 blur-[100px] animate-flicker"
        style={{ animationDelay: "0.7s" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-void/0 via-void/40 to-void" />
    </div>
  );
}
