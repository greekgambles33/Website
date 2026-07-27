import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { socials } from "@/lib/mock-data";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Coin } from "@/components/ui/Coin";
import { LavaCracks } from "@/components/effects/LavaCracks";

const columns = [
  {
    title: "Community",
    links: [
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Giveaways", href: "/giveaways" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Store", href: "/store" },
      { label: "Games", href: "/games" },
      { label: "Dashboard", href: "#" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Rules", href: "/rules" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24">
      <LavaCracks />
      <div className="glass-panel border-x-0 border-b-0">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-center gap-2 rounded-2xl border border-crimson-500/30 bg-crimson-500/[0.06] px-6 py-5 text-center sm:flex-row sm:justify-center sm:text-left">
            <AlertTriangle size={20} className="shrink-0 text-crimson-400" />
            <p className="text-sm text-ash-100">
              <span className="font-heading font-bold uppercase tracking-wide text-crimson-300">18+ Only —</span>{" "}
              This platform depicts gambling content. Nothing here is real-money gambling on this site, but
              stream content may reference wagering on third-party casinos. Viewer discretion is advised.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-5">
            <div className="col-span-2">
              <span className="font-heading flex items-center gap-2.5 text-lg font-bold uppercase tracking-wide">
                <Coin size="sm" />
                Greek<span className="text-lava-400">God</span>Berry
              </span>
              <p className="mt-3 max-w-xs text-sm text-ash-300">
                GreekGodBerry&apos;s community platform — HellCatCoins, live games,
                and rewards forged in fire.
              </p>
              <div className="mt-5 flex items-center gap-3">
                {socials.map((s) => (
                  <a key={s.name} href={s.href} className="group" aria-label={s.name}>
                    <SocialIcon name={s.name} />
                  </a>
                ))}
              </div>
            </div>

            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
                  {col.title}
                </h4>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-ash-100 transition-colors hover:text-lava-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 border-t border-lava-400/10 pt-8">
            <p className="text-xs leading-relaxed text-ash-500">
              <strong className="text-ash-300">Responsible Gambling:</strong>{" "}
              Content on this platform is for entertainment purposes only. Gambling
              involves risk — never bet more than you can afford to lose. If you or
              someone you know has a gambling problem, resources are available at{" "}
              <a
                href="https://www.ncpgambling.org"
                className="underline hover:text-lava-300"
              >
                ncpgambling.org
              </a>{" "}
              or by calling 1-800-522-4700.
            </p>
            <p className="mt-4 text-xs text-ash-500">
              Play responsibly &middot; 18+ &middot; © {new Date().getFullYear()} GreekGodBerry. All
              rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
