"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { FieldInput } from "./FieldInput";
import type { ListSection, FieldDef } from "./sections";

function defaultFor(field: FieldDef): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    default:
      return "";
  }
}

function blankRow(section: ListSection, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const f of section.fields) row[f.key] = defaultFor(f);
  if (section.hasId) row.id = crypto.randomUUID();
  return { ...row, ...overrides };
}

export function ListEditor({
  section,
  items,
  onChange,
}: {
  section: ListSection;
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
}) {
  const updateRow = (index: number, patch: Record<string, unknown>) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addRow = () => onChange([...items, blankRow(section)]);
  const removeRow = (index: number) => onChange(items.filter((_, i) => i !== index));

  const rows = section.fixedRows
    ? section.fixedRows.map((day, i) => items[i] ?? blankRow(section, { day }))
    : items;

  return (
    <div className="space-y-4">
      {rows.map((item, index) => (
        <GlassCard key={section.hasId ? (item.id as string) : index} className="relative">
          {!section.fixedRows && (
            <button
              onClick={() => removeRow(index)}
              aria-label="Remove"
              className="absolute right-4 top-4 rounded-full p-1.5 text-ash-500 hover:bg-crimson-500/10 hover:text-crimson-300"
            >
              <Trash2 size={15} />
            </button>
          )}
          {section.fixedRows && (
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-lava-400">
              <GripVertical size={13} />
              {section.fixedRows[index]}
            </div>
          )}
          <div className="grid gap-4 pr-8 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <FieldInput
                  field={field}
                  value={item[field.key]}
                  onChange={(v) => updateRow(index, { [field.key]: v })}
                />
              </div>
            ))}
          </div>
        </GlassCard>
      ))}

      {!section.fixedRows && (
        <button
          onClick={addRow}
          className="font-heading flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-white/15 py-3 text-xs font-semibold uppercase tracking-wide text-ash-400 hover:border-lava-400/40 hover:text-white"
        >
          <Plus size={14} /> Add {section.label.replace(/s$/, "")}
        </button>
      )}
    </div>
  );
}
