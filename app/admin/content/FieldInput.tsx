"use client";

import type { FieldDef } from "./sections";

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-ash-200">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-lava-400"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
          {field.label}
        </label>
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="ggb-input mt-1.5"
        />
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div>
        <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
          {field.label}
        </label>
        <input
          type="number"
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="ggb-input mt-1.5"
        />
      </div>
    );
  }

  if (field.type === "datetime") {
    return (
      <div>
        <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
          {field.label}
        </label>
        <input
          type="datetime-local"
          value={toDatetimeLocal((value as string) ?? "")}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")}
          className="ggb-input mt-1.5"
        />
      </div>
    );
  }

  return (
    <div>
      <label className="font-heading text-xs font-semibold uppercase tracking-widest text-ash-300">
        {field.label}
      </label>
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="ggb-input mt-1.5"
      />
    </div>
  );
}
