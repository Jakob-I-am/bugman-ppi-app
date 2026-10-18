import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { reportInclude } from "@/lib/report/load";
import { JobReport } from "@/components/JobReport";

export const metadata = { title: "Preview report" };

/** The report exactly as the client will see it, for proofreading before sending. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id }, include: reportInclude });
  if (!job) notFound();

  return (
    <>
      <div className="sticky top-0 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-signal px-5 py-3">
        <p className="text-sm font-semibold text-pine-dark">
          {job.status === "DRAFT" ? "Draft preview. The client can't see this yet." : "Finalised. This is what the client sees."}
        </p>
        <div className="flex gap-2">
          <a href={`/api/reports/${job.id}/pdf`} className="btn-quiet px-3 py-1.5 text-sm">PDF</a>
          <Link href={`/admin/jobs/${job.id}`} className="btn-primary px-3 py-1.5 text-sm">Back to editing</Link>
        </div>
      </div>
      <div className="mt-6">
        <JobReport job={job} />
      </div>
    </>
  );
}
