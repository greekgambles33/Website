"use client";

import { usePathname } from "next/navigation";
import { AmbientBackground } from "@/components/effects/AmbientBackground";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/** Bare OBS browser-source pages skip the nav/footer/ambient fx entirely. */
const BARE_ROUTES = ["/bonus-hunt-widget", "/tournament-widget"];

export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((route) => pathname?.startsWith(route));

  if (bare) return <>{children}</>;

  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
