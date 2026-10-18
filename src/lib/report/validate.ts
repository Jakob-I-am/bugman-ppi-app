import { isBlank, missingRequired, type Answers } from "./fields";
import { frameFor } from "./frame";
import { getTemplate, requiredBuildingAreas } from "./sections";
import { categories } from "./findings";
import { includesBuilding, includesPest, inScope } from "./types";
import type { ReportJob } from "./load";

/** Everything stopping a report being finalised. Empty means it's ready. */
export function reportProblems(job: ReportJob): string[] {
  const type = job.reportType;
  const answers = (job.answers ?? {}) as Answers;
  const problems: string[] = [];

  for (const section of frameFor(type)) {
    const missing = missingRequired(section.fields, answers);
    if (missing.length) problems.push(`${section.title}: fill in ${missing.join(", ")}`);
  }

  if (includesBuilding(type)) {
    for (const area of requiredBuildingAreas) {
      if (!job.sections.some((s) => area.keys.includes(s.templateKey))) {
        problems.push(`Add a ${area.label} section. If there isn't one or it couldn't be inspected, add it and mark it not accessible with the reason.`);
      }
    }
  } else if (job.sections.length === 0) {
    problems.push("Add at least one area to the report");
  }

  for (const s of job.sections) {
    const a = (s.answers ?? {}) as Answers;
    if (isBlank(a.access)) problems.push(`${s.title}: choose the access level`);
    if (includesBuilding(type) && getTemplate(s.templateKey).smokeAlarm && isBlank(a.smokeAlarm))
      problems.push(`${s.title}: record whether a smoke alarm is present`);
    else if (a.access !== "Fully accessible" && isBlank(a.accessReason)) problems.push(`${s.title}: explain what limited access`);

    s.findings.forEach((f, i) => {
      const info = categories[f.category];
      const name = `${s.title}, ${info.label.toLowerCase()} ${i + 1}`;
      if (!f.location.trim() || !f.description.trim()) problems.push(`${name}: add a location and description`);
      if (info.detail && !f.detail) problems.push(`${name}: choose ${info.detail.label.toLowerCase()}`);
      if (!inScope(info.scope, type)) problems.push(`${name}: this type of finding isn't part of a ${type === "BUILDING" ? "building-only" : "timber-pest-only"} report`);
    });
  }

  // Conclusions must agree with the findings recorded.
  if (includesPest(type)) {
    const details = job.sections.flatMap((s) => s.findings.filter((f) => f.category === "TIMBER_PEST").map((f) => f.detail));
    const check = (key: string, detail: string, label: string) => {
      if (answers[key] === "No visible evidence" && details.includes(detail))
        problems.push(`Timber pest conclusion says no ${label}, but a finding records ${label}`);
    };
    check("activeTermites", "Active subterranean termites", "active termites");
    check("termiteDamage", "Termite damage", "termite damage");
    check("borers", "Borers", "borers");
    check("woodDecay", "Wood decay fungi", "wood decay fungi");
    const hasConducive = job.sections.some((s) => s.findings.some((f) => f.category === "CONDUCIVE_CONDITION"));
    if (answers.conducive === "None noted" && hasConducive)
      problems.push("Timber pest conclusion says no conducive conditions, but findings record some");
  }

  return problems;
}
