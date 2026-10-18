import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { jobNumber, photoUrls } from "@/lib/format";
import type { Answers } from "@/lib/report/fields";
import { reportInclude } from "@/lib/report/load";
import { reportTypeLabels } from "@/lib/report/types";
import { JobReport } from "@/components/JobReport";
import { StatusPill } from "@/components/StatusPill";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ReportEditor } from "@/components/editor/ReportEditor";
import type { EditorSection } from "@/components/editor/types";
import { reopenJob } from "../../actions";
import { DuplicatePanel } from "@/components/DuplicatePanel";

export default async function AdminJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, include: reportInclude });
  if (!job) notFound();

  if (job.status === "FINALISED") {
    return (
      <>
        <Link href="/admin" className="text-sm font-semibold text-pine">Back to jobs</Link>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <form action={reopenJob.bind(null, job.id)}>
            <ConfirmButton className="btn-quiet" message="Reopen this report? The client won't see it until you finalise it again.">
              Reopen for editing
            </ConfirmButton>
          </form>
          <DuplicatePanel jobId={job.id} />
        </div>
        <div className="mt-6"><JobReport job={job} showInternal pdfHref={`/api/reports/${job.id}/pdf`} /></div>
      </>
    );
  }

  const withUrls = (photos: { id: string }[]) => photos.map((p) => ({ id: p.id, ...photoUrls(p.id) }));
  const sections: EditorSection[] = job.sections.map((s) => ({
    id: s.id,
    templateKey: s.templateKey,
    title: s.title,
    answers: (s.answers ?? {}) as Answers,
    photos: withUrls(s.photos),
    findings: s.findings.map((f) => ({
      id: f.id, category: f.category, element: f.element, location: f.location,
      description: f.description, recommendation: f.recommendation, detail: f.detail,
      photos: withUrls(f.photos),
    })),
  }));

  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-pine">Back to jobs</Link>
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-stone">Job {jobNumber(job.number)}, {reportTypeLabels[job.reportType].toLowerCase()}</p>
          <StatusPill status={job.status} />
        </div>
        <h1 className="display mt-1 text-4xl text-pine sm:text-5xl">{job.propertyAddress}</h1>
        <p className="mt-2 text-sm text-stone">
          Client: {job.customer.name}, {job.customer.email}{job.customer.phone ? `, ${job.customer.phone}` : ""}
          {job.copiedFromNumber ? `. Copied from job ${jobNumber(job.copiedFromNumber)}.` : ""}
        </p>
        <div className="mt-4"><DuplicatePanel jobId={job.id} /></div>
      </header>

      <ReportEditor jobId={job.id} reportType={job.reportType} frameAnswers={job.answers as Answers} initialSections={sections} />
    </>
  );
}
