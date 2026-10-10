export type ReportType = "BUILDING_AND_PEST" | "BUILDING" | "TIMBER_PEST";
export type Scope = "building" | "pest" | "both";

export const reportTypeLabels: Record<ReportType, string> = {
  BUILDING_AND_PEST: "Building and timber pest",
  BUILDING: "Building only",
  TIMBER_PEST: "Timber pest only",
};

export const includesBuilding = (t: ReportType) => t !== "TIMBER_PEST";
export const includesPest = (t: ReportType) => t !== "BUILDING";

export function inScope(scope: Scope | undefined, type: ReportType) {
  if (!scope || scope === "both") return true;
  return scope === "building" ? includesBuilding(type) : includesPest(type);
}
