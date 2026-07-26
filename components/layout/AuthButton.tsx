"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { loginWithDiscord, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AuthButton({ className, fullWidth = false }: { className?: string; fullWidth?: boolean }) {
  const { user, loading } = useAuth();
  const [loggingIn, setLoggingIn] = useState(false);

  if (loading) {
    return <div className={cn("h-9 w-32 animate-pulse rounded-full bg-ash-800/60", className)} />;
  }

  if (!user) {
    return (
      <Button
        size="sm"
        className={cn(fullWidth && "w-full", className)}
        disabled={loggingIn}
        onClick={async () => {
          setLoggingIn(true);
          try {
            await loginWithDiscord();
          } catch {
            setLoggingIn(false);
          }
        }}
      >
        {loggingIn ? "Redirecting…" : "Login with Discord"}
      </Button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", fullWidth && "w-full justify-between", className)}>
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-full border border-lava-400/30 bg-ash-950/60 py-1 pl-1 pr-3 transition-colors hover:border-lava-400/60"
      >
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.displayName}
            width={28}
            height={28}
            className="rounded-full"
          />
        ) : (
          <div className="font-heading flex h-7 w-7 items-center justify-center rounded-full border border-lava-400 bg-ash-800 text-xs font-bold text-lava-300">
            {user.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="font-heading text-sm font-semibold text-white">{user.displayName}</span>
        {!user.kickVerified && (
          <span className="h-1.5 w-1.5 rounded-full bg-lava-400" aria-label="Kick verification pending" />
        )}
      </Link>
      {user.isAdmin && (
        <Link
          href="/admin"
          className="font-heading rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#140a04] transition-transform hover:-translate-y-0.5"
        >
          Admin
        </Link>
      )}
      <button
        onClick={() => logout()}
        aria-label="Logout"
        className="rounded-full p-2 text-ash-300 transition-colors hover:bg-white/5 hover:text-crimson-300"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
