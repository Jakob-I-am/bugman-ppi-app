import { jobForm, displayValue, type Answers } from "@/lib/job-form";
import { formatDate, jobNumber, photoUrls } from "@/lib/format";

type ReportJob = {
  number: number;
  siteAddress: string;
  visitDate: Date | null;
  finalisedAt: Date | null;
  answers: unknown;
  customer: { name: string };
  photos: { id: string; fieldKey: string }[];
};

/** Read-only job report, shared by the customer portal and the admin view. */
export function JobReport({ job, showInternal = false }: { job: ReportJob; showInternal?: boolean }) {
  const answers = (job.answers ?? {}) as Answers;
  const photosByField = new Map<string, string[]>();
  for (const p of job.photos) photosByField.set(p.fieldKey, [...(photosByField.get(p.fieldKey) ?? []), p.id]);

  return (
    <article>
      <header className="border-b border-line pb-6">
        <p className="text-sm font-semibold text-stone">Job {jobNumber(job.number)}</p>
        <h1 className="display mt-1 text-4xl text-pine sm:text-5xl">{job.siteAddress}</h1>
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div><dt className="text-stone">Customer</dt><dd className="font-semibold">{job.customer.name}</dd></div>
          <div><dt className="text-stone">Visit date</dt><dd className="font-semibold">{formatDate(job.visitDate)}</dd></div>
          {job.finalisedAt && (
            <div><dt className="text-stone">Report issued</dt><dd className="font-semibold">{formatDate(job.finalisedAt)}</dd></div>
          )}
        </dl>
      </header>

      {jobForm.map((section) => {
        const fields = section.fields.filter((f) => showInternal || !f.internal);
        if (fields.length === 0) return null;
        return (
          <section key={section.key} className="border-b border-line py-8">
            <h2 className="display text-3xl text-pine">{section.title}</h2>
            <dl className="mt-5 grid gap-6">
              {fields.map((field) => {
                const value = displayValue(field, answers[field.key]);
                const photos = photosByField.get(field.key) ?? [];
                return (
                  <div key={field.key}>
                    <dt className="text-sm font-semibold text-stone">
                      {field.label}
                      {field.internal && <span className="ml-2 text-xs font-normal">(not shown to customer)</span>}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">{value ?? <span className="text-stone">Not recorded</span>}</dd>
                    {photos.length > 0 && (
                      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                        {photos.map((id) => {
                          const { thumbUrl, fullUrl } = photoUrls(id);
                          return (
                            <li key={id}>
                              <a href={fullUrl} target="_blank" rel="noopener" className="block overflow-hidden rounded-md">
                                {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-checked images */}
                                <img src={thumbUrl} alt={`${field.label} photo`} loading="lazy" className="aspect-square w-full object-cover" />
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </article>
  );
}
