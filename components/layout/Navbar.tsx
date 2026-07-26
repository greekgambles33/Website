"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { Coin } from "@/components/ui/Coin";
import { AuthButton } from "@/components/layout/AuthButton";
import { useAuth } from "@/components/providers/AuthProvider";
import { socials } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const links = [
  { label: "Schedule", href: "/schedule" },
  { label: "Games", href: "/games" },
  { label: "Stream Games", href: "/stream-games" },
  { label: "Store", href: "/store" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Giveaways", href: "/giveaways" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();

  const navLinks = [
    ...links,
    ...(user?.isAdmin || user?.isModerator ? [{ label: "Hunt Tracker", href: "/hunt-tracker" }] : []),
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-panel border-x-0 border-t-0" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading flex items-center gap-2.5 text-lg font-bold uppercase tracking-wide">
          <Coin size="sm" />
          <span>
            Greek<span className="text-lava-400">God</span>Berry
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-heading text-[12.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-white",
                pathname === link.href ? "text-white" : "text-ash-300"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="flex items-center gap-2">
            {socials.slice(0, 3).map((s) => (
              <a key={s.name} href={s.href} className="group" aria-label={s.name}>
                <SocialIcon name={s.name} />
              </a>
            ))}
          </div>
          {user && (
            <div className="flex items-center gap-2 rounded-full border border-lava-400/40 bg-ash-950/60 px-3.5 py-1.5">
              <Coin size="xs" />
              <span className="font-heading text-sm font-bold tracking-[0.02em]">
                {user.catCoinBalance.toLocaleString()}
              </span>
            </div>
          )}
          <AuthButton />
        </div>

        <button
          className="rounded-lg p-2 text-ash-100 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-lava-400/15 bg-ash-950/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "font-heading rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide hover:bg-white/5 hover:text-white",
                    pathname === link.href ? "bg-white/5 text-white" : "text-ash-300"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <div className="mt-2 flex items-center gap-2 rounded-full border border-lava-400/40 bg-ash-950/60 px-3.5 py-2 w-fit">
                  <Coin size="xs" />
                  <span className="font-heading text-sm font-bold">
                    {user.catCoinBalance.toLocaleString()}
                  </span>
                </div>
              )}
              <AuthButton className="mt-3" fullWidth />
              <div className="mt-4 flex items-center gap-3 px-3">
                {socials.map((s) => (
                  <a key={s.name} href={s.href} className="group" aria-label={s.name}>
                    <SocialIcon name={s.name} />
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
