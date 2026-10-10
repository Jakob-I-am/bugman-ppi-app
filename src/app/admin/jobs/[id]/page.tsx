import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, jobNumber, photoUrls } from "@/lib/format";
import type { Answers } from "@/lib/job-form";
import { JobReport } from "@/components/JobReport";
import { StatusPill } from "@/components/StatusPill";
import { JobEditor } from "@/components/JobEditor";
import type { PhotoItem } from "@/components/PhotoField";
import { finaliseJob, reopenJob } from "../../actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: { customer: true, photos: { orderBy: { createdAt: "asc" } } },
  });
  if (!job) notFound();

  if (job.status === "FINALISED") {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin" className="text-sm font-semibold text-pine">Back to jobs</Link>
          <form action={reopenJob.bind(null, job.id)}>
            <ConfirmButton className="btn-quiet" message="Reopen this job? The customer won't see it until you finalise it again.">
              Reopen for editing
            </ConfirmButton>
          </form>
        </div>
        <div className="mt-4"><JobReport job={job} showInternal /></div>
      </>
    );
  }

  const photosByField: Record<string, PhotoItem[]> = {};
  for (const p of job.photos) {
    (photosByField[p.fieldKey] ??= []).push({ id: p.id, ...photoUrls(p.id) });
  }

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-pine">Back to jobs</Link>
      <header className="mt-4 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-stone">Job {jobNumber(job.number)}</p>
          <StatusPill status={job.status} />
        </div>
        <h1 className="display mt-1 text-4xl text-pine sm:text-5xl">{job.siteAddress}</h1>
        <p className="mt-2 text-sm text-stone">
          {job.customer.name}, {job.customer.email}
          {job.customer.phone ? `, ${job.customer.phone}` : ""}. Visit {formatDate(job.visitDate)}.
        </p>
      </header>

      <JobEditor jobId={job.id} initialAnswers={job.answers as Answers} photosByField={photosByField} />

      <section className="mt-10 rounded-lg border-2 border-pine bg-white p-6">
        <h2 className="display text-3xl text-pine">Finalise job</h2>
        <p className="mt-2 max-w-lg text-stone">
          Locks the job and emails {job.customer.email} a link to view the report.
          You can reopen it later if something needs correcting.
        </p>
        <form action={finaliseJob.bind(null, job.id)} className="mt-4">
          <ConfirmButton className="btn-primary" message="Finalise this job and email the customer?">
            Finalise and send report
          </ConfirmButton>
        </form>
      </section>
    </>
  );
}
