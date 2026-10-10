/** Shared field types used by the fixed report parts and the addable sections. */

export type FieldType = "text" | "textarea" | "select" | "checkbox" | "number" | "date" | "time";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  required?: boolean;
  /** Hidden from the customer's report. */
  internal?: boolean;
};

export type Answers = Record<string, string | boolean>;

/** Keeps only known keys and coerces values. Always run on the server. */
export function sanitizeAnswers(fields: Field[], input: unknown): Answers {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const out: Answers = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    const field = byKey.get(key);
    if (!field) continue;
    if (field.type === "checkbox") {
      out[key] = raw === true;
      continue;
    }
    const value = typeof raw === "string" ? raw.slice(0, 8000) : "";
    if (field.type === "select" && value && !field.options?.includes(value)) continue;
    if (field.type === "number" && value && Number.isNaN(Number(value))) continue;
    out[key] = value;
  }
  return out;
}

export function isBlank(v: string | boolean | undefined) {
  return v === undefined || v === "" || v === false;
}

/** Labels of required fields that haven't been filled in. */
export function missingRequired(fields: Field[], answers: Answers) {
  return fields.filter((f) => f.required && f.type !== "checkbox" && isBlank(answers[f.key])).map((f) => f.label);
}

export function displayValue(field: Field, value: string | boolean | undefined) {
  if (field.type === "checkbox") return value === true ? "Yes" : "No";
  if (value === undefined || value === "") return null;
  if (field.type === "date" && typeof value === "string") return formatDateString(value);
  return String(value);
}

export function formatDateString(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
}
