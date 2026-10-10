"use client";

import type { Field } from "@/lib/report/fields";

export function FieldInput({
  id,
  field,
  value,
  onChange,
}: {
  id: string;
  field: Field;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
}) {
  const marker = field.required ? <span className="text-red-700" aria-hidden="true"> *</span> : null;
  const internal = field.internal ? <span className="ml-2 text-xs font-normal text-stone">(not shown to client)</span> : null;

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 font-semibold" htmlFor={id}>
        <input id={id} type="checkbox" className="h-5 w-5 accent-pine" checked={value === true}
          onChange={(e) => onChange(e.target.checked)} />
        {field.label}{internal}
      </label>
    );
  }

  const str = typeof value === "string" ? value : "";
  return (
    <div>
      <label className="label" htmlFor={id}>{field.label}{marker}{internal}</label>
      {field.help && <p className="-mt-1 mb-1.5 text-sm text-stone">{field.help}</p>}
      {field.type === "textarea" ? (
        <textarea id={id} className="input min-h-24" rows={3} value={str} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" ? (
        <select id={id} className="input" value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose one</option>
          {field.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} className="input sm:max-w-xs" type={field.type}
          inputMode={field.type === "number" ? "numeric" : undefined}
          value={str} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
