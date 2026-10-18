import { displayValue, isVisible, type Answers } from "@/lib/report/fields";
import { COVER_KEY, frameFor } from "@/lib/report/frame";
import { getTemplate } from "@/lib/report/sections";
import { smokeAlarmSummary } from "@/lib/report/smoke";
import { categories, categoryOrder, toneClasses, type FindingCategory } from "@/lib/report/findings";
import { includesBuilding, includesPest, reportTypeLabels } from "@/lib/report/types";
import type { ReportJob } from "@/lib/report/load";
import { terms } from "@/lib/report/terms";
import { inspector, site } from "@/lib/site";
import { formatDate, jobNumber, photoUrls } from "@/lib/format";

/** Read-only report shown to the client, and to you once finalised. */
export function JobReport({ job, showInternal = false, pdfHref }: { job: ReportJob; showInternal?: boolean; pdfHref?: string }) {
  const answers = (job.answers ?? {}) as Answers;
  const frame = new Map(frameFor(job.reportType).map((s) => [s.key, s]));
  const allFindings = job.sections.flatMap((s) => s.findings.map((f) => ({ ...f, sectionId: s.id, sectionTitle: s.title })));
  const byCategory = (c: FindingCategory) => allFindings.filter((f) => f.category === c);
  const smoke = includesBuilding(job.reportType) ? smokeAlarmSummary(job) : null;
  const photosFor = (key: string) => job.photos.filter((p) => p.fieldKey === key).map((p) => p.id);
  const [hero, ...moreCover] = photosFor(COVER_KEY);
  const propertyFields = frame.get("property")!.fields.filter(
    (f) => f.key !== "inspectionDate" && f.key !== "inspectionTime" && isVisible(f, answers),
  );

  return (
    <article className="text-[17px] leading-relaxed">
      {hero && (
        <figure className="mb-6">
          <a href={photoUrls(hero).fullUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked images */}
            <img src={photoUrls(hero).fullUrl} alt={`The property at ${job.propertyAddress}`}
              className="aspect-[16/10] w-full object-cover" />
          </a>
          {moreCover.length > 0 && <Photos ids={moreCover} label="Property" />}
        </figure>
      )}
      <header className="border-b-4 border-pine pb-6">
        <p className="text-sm font-semibold text-stone">
          {reportTypeLabels[job.reportType]} inspection report, job {jobNumber(job.number)}
        </p>
        <h1 className="display mt-1 text-4xl text-pine sm:text-5xl">{job.propertyAddress}</h1>
        <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <Meta label="Client" value={job.customer.name} />
          <Meta label="Inspected" value={`${formatDate(String(answers.inspectionDate ?? ""))}${answers.inspectionTime ? `, ${answers.inspectionTime}` : ""}`} />
          {job.finalisedAt && <Meta label="Report issued" value={formatDate(job.finalisedAt)} />}
          <Meta label="Inspector" value={inspector.name} />
          <Meta label="Agreement" value={String(answers.agreementRef ?? "Not recorded")} />
        </dl>
        {pdfHref && (
          <a href={pdfHref} className="btn-primary mt-6">Download PDF</a>
        )}
      </header>

      {/* Summary first: what a buyer needs to know before reading the detail. */}
      <section className="border-b border-line py-8">
        <h2 className="display text-3xl text-pine">Summary</h2>

        {includesBuilding(job.reportType) && (
          <div className="mt-5">
            <h3 className="text-lg font-bold">Building</h3>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              <Meta label="Overall condition" value={String(answers.overallCondition ?? "Not recorded")}
                note="Compared with similar buildings of similar age that have been reasonably maintained" />
              <Meta label="Minor defects" value={String(answers.minorDefects ?? "Not recorded")} />
              {smoke && <Meta label="Smoke alarms" value={smoke.compliance} />}
            </dl>
            <SummaryList title="Safety hazards" items={byCategory("SAFETY_HAZARD")} none="No safety hazards were observed." />
            <SummaryList title="Major defects" items={byCategory("MAJOR_DEFECT")} none="No major defects were observed." />
            {answers.conclusion && <p className="mt-4 whitespace-pre-wrap">{String(answers.conclusion)}</p>}
          </div>
        )}

        {includesPest(job.reportType) && frame.get("pestSummary") && (
          <div className="mt-8">
            <h3 className="text-lg font-bold">Timber pests</h3>
            <dl className="mt-2 grid gap-3 sm:grid-cols-2">
              {frame.get("pestSummary")!.fields.filter((f) => f.type !== "textarea").map((f) => (
                <Meta key={f.key} label={f.label} value={displayValue(f, answers[f.key]) ?? "Not recorded"} />
              ))}
            </dl>
            <SummaryList title="Timber pest activity and damage" items={byCategory("TIMBER_PEST")} none="No visible evidence of timber pest activity or damage." />
            <SummaryList title="Conducive conditions" items={byCategory("CONDUCIVE_CONDITION")} none="No conducive conditions were noted." />
            {answers.pestConclusion && <p className="mt-4 whitespace-pre-wrap">{String(answers.pestConclusion)}</p>}
          </div>
        )}

        <SummaryList title="Further inspections recommended" items={byCategory("FURTHER_INSPECTION")} none="None." />
      </section>

      <section className="border-b border-line py-8">
        <h2 className="display text-3xl text-pine">Areas inspected</h2>
        <p className="mt-2 text-sm text-stone">Areas that were not fully accessible may contain defects or timber pest activity that could not be seen. Further inspection is recommended once access is available.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b-2 border-pine"><th className="py-2 pr-4">Area</th><th className="py-2 pr-4">Access</th><th className="py-2">Limitations</th></tr></thead>
            <tbody>
              {job.sections.map((s) => {
                const a = (s.answers ?? {}) as Answers;
                return (
                  <tr key={s.id} className="border-b border-line align-top">
                    <td className="py-2 pr-4 font-semibold"><a href={`#area-${s.id}`} className="text-pine underline">{s.title}</a></td>
                    <td className="py-2 pr-4">{String(a.access ?? "Not recorded")}</td>
                    <td className="py-2 whitespace-pre-wrap">{a.access === "Fully accessible" ? "None" : String(a.accessReason ?? "")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-b border-line py-8">
        <h2 className="display text-3xl text-pine">Property details</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {propertyFields.filter((f) => f.type !== "textarea").map((f) => (
            <Meta key={f.key} label={f.label} value={displayValue(f, answers[f.key]) ?? "Not recorded"} />
          ))}
        </dl>
        {propertyFields.filter((f) => f.type === "textarea").map((f) => {
          const value = displayValue(f, answers[f.key]);
          const ids = f.photos ? photosFor(f.key) : [];
          if (!value && ids.length === 0) return null;
          return (
            <div key={f.key} className="mt-4">
              <h3 className="font-bold">{f.label}</h3>
              {value && <p className="whitespace-pre-wrap">{value}</p>}
              <Photos ids={ids} label={f.label} />
            </div>
          );
        })}
        {answers.scopeVariations && (
          <div className="mt-4"><h3 className="font-bold">Agreed changes to the standard scope</h3><p className="whitespace-pre-wrap">{String(answers.scopeVariations)}</p></div>
        )}
      </section>

      {job.sections.map((s) => {
        const a = (s.answers ?? {}) as Answers;
        const template = getTemplate(s.templateKey);
        const findings = [...s.findings].sort((x, y) => categoryOrder.indexOf(x.category) - categoryOrder.indexOf(y.category));
        return (
          <section key={s.id} id={`area-${s.id}`} className="scroll-mt-4 border-b border-line py-8">
            <h2 className="display text-3xl text-pine">{s.title}</h2>
            <p className="text-sm text-stone">{template.label}, {String(a.access ?? "access not recorded").toLowerCase()}</p>
            {a.access !== "Fully accessible" && a.accessReason && (
              <p className="mt-3 rounded-md bg-signal/25 px-3 py-2 text-sm"><strong>Access limited:</strong> {String(a.accessReason)}</p>
            )}
            {template.fields.map((f) => {
              const v = displayValue(f, a[f.key]);
              return v ? <p key={f.key} className="mt-2 text-sm"><strong>{f.label}:</strong> {v}</p> : null;
            })}
            {a.notes && <p className="mt-3 whitespace-pre-wrap">{String(a.notes)}</p>}
            <Photos ids={s.photos.map((p) => p.id)} label={s.title} />

            {findings.length === 0 ? (
              <p className="mt-4 text-stone">No defects or timber pest issues were observed in this area.</p>
            ) : (
              <ol className="mt-5 grid gap-5">
                {findings.map((f) => {
                  const info = categories[f.category];
                  return (
                    <li key={f.id} id={`finding-${f.id}`} className="rounded-md border border-line bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${toneClasses[info.tone]}`}>{info.label}</span>
                        {f.detail && <span className="text-sm font-semibold">{f.detail}</span>}
                      </div>
                      <p className="mt-2 font-semibold">{[f.element, f.location].filter(Boolean).join(", ")}</p>
                      <p className="mt-1 whitespace-pre-wrap">{f.description}</p>
                      {f.recommendation && <p className="mt-2 whitespace-pre-wrap"><strong>Recommendation:</strong> {f.recommendation}</p>}
                      <Photos ids={f.photos.map((p) => p.id)} label={info.label} />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        );
      })}

      {smoke && (
        <section id="smoke-alarms" className="border-b border-line py-8">
          <h2 className="display text-3xl text-pine">Smoke alarms</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Meta label="Smoke alarms found in" value={smoke.found.join(", ") || "None"} />
            <Meta label="No smoke alarm in" value={smoke.missing.join(", ") || "None"} />
            <Meta label="Assessment" value={smoke.compliance} note="Based on alarms seen. Alarms were not tested." />
          </dl>
          {smoke.comments && <p className="mt-4 whitespace-pre-wrap">{smoke.comments}</p>}
        </section>
      )}

      <section className="py-8 text-sm">
        <h2 className="display text-3xl text-pine">Inspector</h2>
        <p className="mt-3 font-semibold">{inspector.name}, {site.name}</p>
        <ul className="mt-1">{inspector.credentials.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="mt-1">{inspector.insurance}. ABN {site.abn}.</p>

        <h2 className="display mt-8 text-3xl text-pine">Scope and limitations</h2>
        <div className="mt-3 grid gap-3 text-stone">
          {[...terms.general, ...(includesBuilding(job.reportType) ? terms.building : []), ...(includesPest(job.reportType) ? terms.pest : [])].map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        {showInternal && <p className="mt-6 text-xs text-stone">Viewing as admin.</p>}
      </section>
    </article>
  );
}

function Meta({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-stone">{label}</dt>
      <dd className="font-semibold">{value}</dd>
      {note && <dd className="text-xs text-stone">{note}</dd>}
    </div>
  );
}

function SummaryList({ title, items, none }: {
  title: string;
  items: { id: string; element: string; location: string; detail: string; sectionTitle: string }[];
  none: string;
}) {
  return (
    <div className="mt-5">
      <h4 className="font-bold">{title} ({items.length})</h4>
      {items.length === 0 ? (
        <p className="text-stone">{none}</p>
      ) : (
        <ul className="mt-1 list-disc pl-5">
          {items.map((f) => (
            <li key={f.id}>
              <a href={`#finding-${f.id}`} className="text-pine underline">
                {f.sectionTitle}: {[f.detail, f.element, f.location].filter(Boolean).join(", ")}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Photos({ ids, label }: { ids: string[]; label: string }) {
  if (ids.length === 0) return null;
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {ids.map((id) => {
        const { thumbUrl, fullUrl } = photoUrls(id);
        return (
          <li key={id}>
            <a href={fullUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked images */}
              <img src={thumbUrl} alt={`${label} photo`} loading="lazy" className="aspect-square w-full object-cover" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
