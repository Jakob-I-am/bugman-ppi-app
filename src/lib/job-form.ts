/**
 * The job form, defined in one place.
 *
 * Add, remove or reorder sections and fields here and the editor, the customer
 * report and the server-side validation all follow. Answers are stored by `key`,
 * so don't rename a key once real jobs use it (add a new one instead).
 * Set `photos: true` on any field that needs photos attached.
 */

export type FieldType = "text" | "textarea" | "select" | "checkbox" | "number" | "date";

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  photos?: boolean;
  /** Hide from the customer report (internal notes). */
  internal?: boolean;
};

export type Section = { key: string; title: string; fields: Field[] };

export type Answers = Record<string, string | boolean>;

export const jobForm: Section[] = [
  {
    key: "site",
    title: "Site and access",
    fields: [
      { key: "propertyType", label: "Property type", type: "select", options: ["House", "Flat", "Commercial", "Outbuilding", "Other"] },
      { key: "occupied", label: "Property occupied", type: "checkbox" },
      { key: "accessNotes", label: "Access notes", type: "textarea", internal: true },
      { key: "exterior", label: "Exterior condition", type: "textarea", photos: true },
    ],
  },
  {
    key: "findings",
    title: "Inspection findings",
    fields: [
      { key: "pest", label: "Pest identified", type: "select", options: ["Rats", "Mice", "Wasps", "Bed bugs", "Cockroaches", "Fleas", "Moths", "Birds", "Squirrels", "Other", "None found"] },
      { key: "activityLevel", label: "Activity level", type: "select", options: ["None", "Low", "Moderate", "High"] },
      { key: "evidence", label: "Evidence found", type: "textarea", help: "Droppings, gnaw marks, nests, live sightings", photos: true },
      { key: "entryPoints", label: "Entry points", type: "textarea", photos: true },
      { key: "areasInspected", label: "Areas inspected", type: "textarea", photos: true },
    ],
  },
  {
    key: "treatment",
    title: "Treatment",
    fields: [
      { key: "treatmentApplied", label: "Treatment applied", type: "textarea", photos: true },
      { key: "products", label: "Products used", type: "textarea", help: "Product name, active ingredient, quantity" },
      { key: "baitStations", label: "Bait stations placed", type: "number" },
      { key: "baitLocations", label: "Bait station locations", type: "textarea", photos: true },
      { key: "proofing", label: "Proofing work carried out", type: "textarea", photos: true },
    ],
  },
  {
    key: "followUp",
    title: "Advice and follow-up",
    fields: [
      { key: "recommendations", label: "Recommendations for the customer", type: "textarea" },
      { key: "safetyAdvice", label: "Safety advice given", type: "textarea" },
      { key: "followUpRequired", label: "Follow-up visit required", type: "checkbox" },
      { key: "followUpDate", label: "Follow-up date", type: "date" },
      { key: "internalNotes", label: "Internal notes", type: "textarea", internal: true },
    ],
  },
];

export const allFields: Field[] = jobForm.flatMap((s) => s.fields);
const fieldsByKey = new Map(allFields.map((f) => [f.key, f]));

export function getField(key: string) {
  return fieldsByKey.get(key);
}

/** Keeps only known keys and coerces values to the right shape. Run on the server. */
export function sanitizeAnswers(input: unknown): Answers {
  const out: Answers = {};
  if (!input || typeof input !== "object") return out;
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    const field = fieldsByKey.get(key);
    if (!field) continue;
    if (field.type === "checkbox") {
      out[key] = raw === true;
      continue;
    }
    const value = typeof raw === "string" ? raw.slice(0, 5000) : "";
    if (field.type === "select" && value && !field.options?.includes(value)) continue;
    if (field.type === "number" && value && Number.isNaN(Number(value))) continue;
    out[key] = value;
  }
  return out;
}

export function displayValue(field: Field, value: string | boolean | undefined) {
  if (field.type === "checkbox") return value === true ? "Yes" : "No";
  if (value === undefined || value === "") return null;
  if (field.type === "date" && typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return String(value);
}
