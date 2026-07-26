"use client";

import { usePathname } from "next/navigation";
import { AmbientBackground } from "@/components/effects/AmbientBackground";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/** Bare OBS browser-source pages skip the nav/footer/ambient fx entirely. */
const BARE_ROUTES = ["/bonus-hunt-widget", "/tournament-widget", "/overlay"];

/** Internal dashboards get their own standalone shell — no public nav/footer. */
const DASHBOARD_ROUTES = ["/admin", "/hunt-tracker"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((route) => pathname?.startsWith(route));
  const dashboard = DASHBOARD_ROUTES.some((route) => pathname?.startsWith(route));

  if (bare) return <>{children}</>;

  if (dashboard) {
    return (
      <>
        <AmbientBackground />
        <main className="flex-1">{children}</main>
      </>
    );
  }

  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
