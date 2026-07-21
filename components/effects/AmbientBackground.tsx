import { EmberField } from "./EmberField";
import { SmokeLayer } from "./SmokeLayer";
import { MouseGlow } from "./MouseGlow";

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-void">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,45,15,0.22), transparent 60%)",
        }}
      />
      <SmokeLayer />
      <EmberField />
      <MouseGlow />
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
