import { inScope, type ReportType, type Scope } from "./types";

export type FindingCategory =
  | "MAJOR_DEFECT"
  | "SAFETY_HAZARD"
  | "MINOR_DEFECT"
  | "TIMBER_PEST"
  | "CONDUCIVE_CONDITION"
  | "FURTHER_INSPECTION"
  | "OBSERVATION";

type CategoryInfo = {
  label: string;
  scope: Scope;
  /** Extra dropdown shown for this category, stored in Finding.detail. */
  detail?: { label: string; options: string[] };
  tone: "danger" | "warn" | "info";
};

/** In display order: most serious first. */
export const categories: Record<FindingCategory, CategoryInfo> = {
  SAFETY_HAZARD: { label: "Safety hazard", scope: "building", tone: "danger" },
  MAJOR_DEFECT: { label: "Major defect", scope: "building", tone: "danger" },
  TIMBER_PEST: {
    label: "Timber pest activity or damage", scope: "pest", tone: "danger",
    detail: { label: "Type", options: ["Active subterranean termites", "Termite damage", "Borers", "Wood decay fungi", "Other"] },
  },
  CONDUCIVE_CONDITION: {
    label: "Conducive condition", scope: "pest", tone: "warn",
    detail: { label: "Condition", options: ["Excess moisture", "Poor ventilation", "Timber in contact with soil", "Bridged or breached termite barrier", "Obstructed weep holes", "Garden beds or soil against walls", "Leaking plumbing", "Other"] },
  },
  MINOR_DEFECT: { label: "Minor defect", scope: "building", tone: "warn" },
  FURTHER_INSPECTION: {
    label: "Further inspection recommended", scope: "both", tone: "info",
    detail: { label: "Refer to", options: ["Structural engineer", "Geotechnical engineer", "Licensed plumber", "Licensed electrician", "Roof plumber", "Pest manager (invasive inspection)", "Pool barrier certifier", "Other specialist"] },
  },
  OBSERVATION: { label: "Observation", scope: "both", tone: "info" },
};

export const categoryOrder = Object.keys(categories) as FindingCategory[];
export const categoriesFor = (type: ReportType) => categoryOrder.filter((c) => inScope(categories[c].scope, type));

export const toneClasses: Record<CategoryInfo["tone"], string> = {
  danger: "bg-red-700 text-white",
  warn: "bg-signal text-pine-dark",
  info: "bg-pine text-white",
};
