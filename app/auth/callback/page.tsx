"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { storeAuthData } from "@/lib/authPersistence";
import { useAuth } from "@/components/providers/AuthProvider";

function CallbackContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    // One-time parse of the OAuth redirect's query string on mount.
    const error = params.get("error");
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setMessage(error);
      const timeout = setTimeout(() => router.push("/"), 3000);
      return () => clearTimeout(timeout);
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const userId = params.get("user_id");
    const displayName = params.get("display_name");

    if (!accessToken || !refreshToken || !userId || !displayName) {
      setStatus("error");
      setMessage("Missing login data — please try again");
      const timeout = setTimeout(() => router.push("/"), 3000);
      return () => clearTimeout(timeout);
    }

    storeAuthData({
      accessToken,
      refreshToken,
      userId,
      displayName,
      isAdmin: params.get("is_admin") === "true",
      isModerator: params.get("is_moderator") === "true",
      avatar: params.get("avatar") ?? "",
    });

    refresh().then(() => {
      setStatus("success");
      setMessage(`Welcome, ${displayName}!`);
      setTimeout(() => router.push("/"), 600);
    });
  }, [params, router, refresh]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <GlassCard glow className="flex max-w-sm flex-col items-center gap-4 py-10 text-center">
        {status === "loading" && <Loader2 size={32} className="animate-spin text-lava-400" />}
        {status === "success" && <CheckCircle2 size={32} className="text-lava-400" />}
        {status === "error" && <XCircle size={32} className="text-crimson-400" />}
        <p className="text-sm text-ash-100">{message}</p>
      </GlassCard>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
