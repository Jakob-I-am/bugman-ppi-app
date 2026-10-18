/**
 * PDF version of the report, for clients, agents and conveyancers to file.
 * Mirrors the on-screen report (src/components/JobReport.tsx); change both together.
 */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { displayValue, type Answers } from "./fields";
import { frameFor } from "./frame";
import { getTemplate } from "./sections";
import { categories, categoryOrder, type FindingCategory } from "./findings";
import { includesBuilding, includesPest, reportTypeLabels } from "./types";
import { smokeAlarmSummary } from "./smoke";
import { terms } from "./terms";
import type { ReportJob } from "./load";
import { inspector, site } from "../site";
import { formatDate, jobNumber } from "../format";

const c = { pine: "#1f3d2b", signal: "#f2c230", ink: "#1c2321", stone: "#5f6a65", line: "#d9ddd5", red: "#b91c1c" };
const toneColour = { danger: c.red, warn: "#b88a00", info: c.pine };

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontSize: 10, fontFamily: "Helvetica", color: c.ink, lineHeight: 1.4 },
  brand: { fontSize: 9, color: c.stone, marginBottom: 4 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", color: c.pine, marginBottom: 8 },
  h2: { fontSize: 15, fontFamily: "Helvetica-Bold", color: c.pine, marginTop: 18, marginBottom: 6 },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 10, marginBottom: 3 },
  rule: { borderBottomWidth: 2, borderBottomColor: c.pine, marginVertical: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", paddingRight: 10, marginBottom: 6 },
  label: { color: c.stone, fontSize: 8.5 },
  value: { fontFamily: "Helvetica-Bold" },
  muted: { color: c.stone },
  bullet: { marginLeft: 8, marginBottom: 2 },
  table: { borderTopWidth: 1, borderTopColor: c.pine },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.line, paddingVertical: 4 },
  finding: { borderWidth: 0.5, borderColor: c.line, borderLeftWidth: 3, padding: 8, marginTop: 8 },
  badge: { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  photos: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  photo: { width: 120, height: 120, objectFit: "cover", marginRight: 6, marginBottom: 6 },
  notice: { backgroundColor: "#fdf3d0", padding: 6, marginTop: 6 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: c.stone },
  draft: { position: "absolute", top: 300, left: 60, fontSize: 90, color: "#e5e7eb", transform: "rotate(-30deg)" },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.cell}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  );
}

function Photos({ ids, images }: { ids: string[]; images: Map<string, Buffer> }) {
  const present = ids.filter((id) => images.has(id));
  if (!present.length) return null;
  return (
    <View style={s.photos}>
      {present.map((id) => (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
        <Image key={id} style={s.photo} src={{ data: images.get(id)!, format: "jpg" }} />
      ))}
    </View>
  );
}

export function ReportPdf({ job, images, draft }: { job: ReportJob; images: Map<string, Buffer>; draft: boolean }) {
  const answers = (job.answers ?? {}) as Answers;
  const frame = new Map(frameFor(job.reportType).map((f) => [f.key, f]));
  const all = job.sections.flatMap((sec) => sec.findings.map((f) => ({ ...f, sectionTitle: sec.title })));
  const byCategory = (cat: FindingCategory) => all.filter((f) => f.category === cat);
  const smoke = includesBuilding(job.reportType) ? smokeAlarmSummary(job) : null;
  const str = (k: string) => (typeof answers[k] === "string" && answers[k] ? String(answers[k]) : "Not recorded");

  const list = (title: string, cat: FindingCategory, none: string) => {
    const items = byCategory(cat);
    return (
      <View>
        <Text style={s.h3}>{title} ({items.length})</Text>
        {items.length === 0 ? <Text style={s.muted}>{none}</Text> : items.map((f) => (
          <Text key={f.id} style={s.bullet}>• {f.sectionTitle}: {[f.detail, f.element, f.location].filter(Boolean).join(", ")}</Text>
        ))}
      </View>
    );
  };

  return (
    <Document title={`Inspection report, ${job.propertyAddress}`} author={site.name}>
      <Page size="A4" style={s.page}>
        {draft && <Text fixed style={s.draft}>DRAFT</Text>}

        <Text style={s.brand}>{site.name} · {site.phone} · ABN {site.abn}</Text>
        <Text style={s.label}>{reportTypeLabels[job.reportType]} inspection report, job {jobNumber(job.number)}</Text>
        <Text style={s.h1}>{job.propertyAddress}</Text>
        <View style={s.grid}>
          <Field label="Client" value={job.customer.name} />
          <Field label="Inspected" value={`${formatDate(str("inspectionDate") === "Not recorded" ? null : str("inspectionDate"))}${answers.inspectionTime ? `, ${answers.inspectionTime}` : ""}`} />
          <Field label="Report issued" value={job.finalisedAt ? formatDate(job.finalisedAt) : "Draft, not issued"} />
          <Field label="Inspector" value={inspector.name} />
          <Field label="Agreement" value={str("agreementRef")} />
        </View>
        <View style={s.rule} />

        <Text style={s.h2}>Summary</Text>
        {includesBuilding(job.reportType) && (
          <View>
            <View style={s.grid}>
              <Field label="Overall condition (compared with similar buildings of similar age)" value={str("overallCondition")} />
              <Field label="Minor defects" value={str("minorDefects")} />
              {smoke && <Field label="Smoke alarms" value={smoke.compliance} />}
            </View>
            {list("Safety hazards", "SAFETY_HAZARD", "No safety hazards were observed.")}
            {list("Major defects", "MAJOR_DEFECT", "No major defects were observed.")}
            {answers.conclusion ? <Text style={{ marginTop: 6 }}>{String(answers.conclusion)}</Text> : null}
          </View>
        )}
        {includesPest(job.reportType) && frame.get("pestSummary") && (
          <View>
            <Text style={s.h3}>Timber pests</Text>
            <View style={s.grid}>
              {frame.get("pestSummary")!.fields.filter((f) => f.type !== "textarea").map((f) => (
                <Field key={f.key} label={f.label} value={displayValue(f, answers[f.key]) ?? "Not recorded"} />
              ))}
            </View>
            {list("Timber pest activity and damage", "TIMBER_PEST", "No visible evidence of timber pest activity or damage.")}
            {list("Conducive conditions", "CONDUCIVE_CONDITION", "No conducive conditions were noted.")}
            {answers.pestConclusion ? <Text style={{ marginTop: 6 }}>{String(answers.pestConclusion)}</Text> : null}
          </View>
        )}
        {list("Further inspections recommended", "FURTHER_INSPECTION", "None.")}

        <Text style={s.h2}>Areas inspected</Text>
        <View style={s.table}>
          {job.sections.map((sec) => {
            const a = (sec.answers ?? {}) as Answers;
            return (
              <View key={sec.id} style={s.row} wrap={false}>
                <Text style={{ width: "28%", fontFamily: "Helvetica-Bold" }}>{sec.title}</Text>
                <Text style={{ width: "22%" }}>{String(a.access ?? "Not recorded")}</Text>
                <Text style={{ width: "50%" }}>{a.access === "Fully accessible" ? "None" : String(a.accessReason ?? "")}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.h2}>Property details</Text>
        <View style={s.grid}>
          {frame.get("property")!.fields.filter((f) => f.key !== "inspectionDate" && f.key !== "inspectionTime").map((f) => (
            <Field key={f.key} label={f.label} value={displayValue(f, answers[f.key]) ?? "Not recorded"} />
          ))}
        </View>
        {answers.scopeVariations ? (
          <View><Text style={s.h3}>Agreed changes to the standard scope</Text><Text>{String(answers.scopeVariations)}</Text></View>
        ) : null}

        {job.sections.map((sec) => {
          const a = (sec.answers ?? {}) as Answers;
          const template = getTemplate(sec.templateKey);
          const findings = [...sec.findings].sort((x, y) => categoryOrder.indexOf(x.category) - categoryOrder.indexOf(y.category));
          return (
            <View key={sec.id}>
              <Text style={s.h2} minPresenceAhead={60}>{sec.title}</Text>
              <Text style={s.muted}>{template.label}, {String(a.access ?? "access not recorded").toLowerCase()}</Text>
              {a.access !== "Fully accessible" && a.accessReason ? (
                <Text style={s.notice}>Access limited: {String(a.accessReason)}</Text>
              ) : null}
              {template.fields.map((f) => {
                const v = displayValue(f, a[f.key]);
                return v ? <Text key={f.key}>{f.label}: {v}</Text> : null;
              })}
              {smoke && template.smokeAlarm && a.smokeAlarm ? <Text>Smoke alarm present: {String(a.smokeAlarm)}</Text> : null}
              {a.notes ? <Text style={{ marginTop: 4 }}>{String(a.notes)}</Text> : null}
              <Photos ids={sec.photos.map((p) => p.id)} images={images} />
              {findings.length === 0 ? (
                <Text style={[s.muted, { marginTop: 4 }]}>No defects or timber pest issues were observed in this area.</Text>
              ) : findings.map((f) => {
                const info = categories[f.category];
                return (
                  <View key={f.id} style={[s.finding, { borderLeftColor: toneColour[info.tone] }]}>
                    <Text style={[s.badge, { color: toneColour[info.tone] }]}>{info.label.toUpperCase()}{f.detail ? `: ${f.detail}` : ""}</Text>
                    <Text style={s.value}>{[f.element, f.location].filter(Boolean).join(", ")}</Text>
                    <Text>{f.description}</Text>
                    {f.recommendation ? <Text style={{ marginTop: 3 }}>Recommendation: {f.recommendation}</Text> : null}
                    <Photos ids={f.photos.map((p) => p.id)} images={images} />
                  </View>
                );
              })}
            </View>
          );
        })}

        {smoke && (
          <View wrap={false}>
            <Text style={s.h2}>Smoke alarms</Text>
            <View style={s.grid}>
              <Field label="Smoke alarms found in" value={smoke.found.join(", ") || "None"} />
              <Field label="No smoke alarm in" value={smoke.missing.join(", ") || "None"} />
              <Field label="Assessment (based on alarms seen, not tested)" value={smoke.compliance} />
            </View>
            {smoke.comments ? <Text>{smoke.comments}</Text> : null}
          </View>
        )}

        <View wrap={false}>
          <Text style={s.h2}>Inspector</Text>
          <Text style={s.value}>{inspector.name}, {site.name}</Text>
          {inspector.credentials.map((cred) => <Text key={cred}>{cred}</Text>)}
          <Text>{inspector.insurance}. ABN {site.abn}.</Text>
        </View>

        <Text style={s.h2}>Scope and limitations</Text>
        {[...terms.general, ...(includesBuilding(job.reportType) ? terms.building : []), ...(includesPest(job.reportType) ? terms.pest : [])].map((t) => (
          <Text key={t} style={[s.muted, { marginBottom: 5 }]}>{t}</Text>
        ))}

        <View style={s.footer} fixed>
          <Text>{job.propertyAddress}, job {jobNumber(job.number)}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
