"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { fetchSiteContent, saveSiteContent, SiteContentApiError } from "@/lib/siteContentApi";
import { ListEditor } from "./ListEditor";
import { ObjectEditor } from "./ObjectEditor";
import { SECTIONS, type Section } from "./sections";

function emptyValueFor(section: Section): unknown {
  if (section.kind === "list") {
    if (section.fixedRows) {
      return section.fixedRows.map((day) => {
        const row: Record<string, unknown> = { day };
        for (const f of section.fields) if (!(f.key in row)) row[f.key] = f.type === "boolean" ? false : f.type === "number" ? 0 : "";
        return row;
      });
    }
    return [];
  }
  const obj: Record<string, unknown> = {};
  for (const f of section.fields) obj[f.key] = f.type === "boolean" ? false : f.type === "number" ? 0 : "";
  return obj;
}

export default function AdminContentPage() {
  const [selectedKey, setSelectedKey] = useState(SECTIONS[0].key);
  const [value, setValue] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const section = SECTIONS.find((s) => s.key === selectedKey)!;

  const load = useCallback(async (key: string, sec: Section) => {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const data = await fetchSiteContent(key);
      setValue(data ?? emptyValueFor(sec));
    } catch (err) {
      setError(err instanceof SiteContentApiError ? err.message : "Failed to load content");
      setValue(emptyValueFor(sec));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedKey, section);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveSiteContent(selectedKey, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof SiteContentApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-1.5">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSelectedKey(s.key)}
            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
              selectedKey === s.key
                ? "border-lava-400/50 bg-lava-500/10 text-white"
                : "border-white/5 text-ash-300 hover:border-white/10 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{section.label}</h2>
            <p className="mt-1 text-sm text-ash-400">{section.description}</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="font-heading flex items-center gap-2 rounded-[10px] bg-gradient-to-b from-lava-300 to-lava-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#140a04] disabled:opacity-50"
          >
            {saving ? (
              "Saving…"
            ) : saved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-crimson-400">{error}</p>}

        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <Loader2 size={22} className="animate-spin text-lava-400" />
          </div>
        ) : section.kind === "object" ? (
          <GlassCard>
            <ObjectEditor
              section={section}
              value={value as Record<string, unknown>}
              onChange={setValue}
            />
          </GlassCard>
        ) : (
          <ListEditor
            section={section}
            items={value as Record<string, unknown>[]}
            onChange={setValue}
          />
        )}
      </div>
    </div>
  );
}
