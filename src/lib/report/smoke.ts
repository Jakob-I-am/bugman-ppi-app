import type { Answers } from "./fields";
import { getTemplate } from "./sections";

/** Which areas have smoke alarms, and the inspector's compliance assessment. */
export function smokeAlarmSummary(job: { answers: unknown; sections: { title: string; templateKey: string; answers: unknown }[] }) {
  const areas = job.sections.filter((s) => getTemplate(s.templateKey).smokeAlarm);
  const value = (s: { answers: unknown }) => ((s.answers ?? {}) as Answers).smokeAlarm;
  const frame = (job.answers ?? {}) as Answers;
  return {
    found: areas.filter((s) => value(s) === "Yes").map((s) => s.title),
    missing: areas.filter((s) => value(s) === "No").map((s) => s.title),
    compliance: typeof frame.smokeAlarmCompliance === "string" && frame.smokeAlarmCompliance ? frame.smokeAlarmCompliance : "Not recorded",
    comments: typeof frame.smokeAlarmComments === "string" ? frame.smokeAlarmComments : "",
  };
}
