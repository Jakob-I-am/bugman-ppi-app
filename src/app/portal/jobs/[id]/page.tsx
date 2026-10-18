import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { reportInclude } from "@/lib/report/load";
import { JobReport } from "@/components/JobReport";

export default async function PortalJob({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // Ownership is part of the query: another client's job id simply isn't found.
  const job = await prisma.job.findFirst({
    where: { id, customerId: user.id, status: "FINALISED" },
    include: reportInclude,
  });
  if (!job) notFound();

  return (
    <>
      <Link href="/portal" className="text-sm font-semibold text-pine">Back to your reports</Link>
      <div className="mt-4">
        <JobReport job={job} pdfHref={`/api/reports/${job.id}/pdf`} />
      </div>
    </>
  );
}
