"use client";

import { useEffect, useState } from "react";
import { fetchSiteContent } from "@/lib/siteContentApi";

/** Fetches one admin-editable content key. `data` stays `null` until it's set from /admin. */
export function useSiteContent<T>(key: string): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchSiteContent<T>(key)
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { data, loading };
}
