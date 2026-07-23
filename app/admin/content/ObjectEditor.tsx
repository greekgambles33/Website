"use client";

import { FieldInput } from "./FieldInput";
import type { ObjectSection } from "./sections";

export function ObjectEditor({
  section,
  value,
  onChange,
}: {
  section: ObjectSection;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {section.fields.map((field) => (
        <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
          <FieldInput
            field={field}
            value={value[field.key]}
            onChange={(v) => onChange({ ...value, [field.key]: v })}
          />
        </div>
      ))}
    </div>
  );
}
