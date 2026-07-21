"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { PublicUser } from "@/lib/api";
import { initializeAuth } from "@/lib/authPersistence";

interface AuthContextValue {
  user: PublicUser | null;
  loading: boolean;
  setUser: (user: PublicUser | null) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await initializeAuth();
    setUser(current);
  }, []);

  useEffect(() => {
    // One-time session check on mount — there is no external system to
    // subscribe to here, just an async fetch that resolves once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
