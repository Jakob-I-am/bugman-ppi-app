import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { JobReport } from "@/components/JobReport";

export default async function PortalJob({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  // The ownership check lives in the query itself: another customer's job id simply isn't found.
  const job = await prisma.job.findFirst({
    where: { id, customerId: user.id, status: "FINALISED" },
    include: { customer: { select: { name: true } }, photos: { orderBy: { createdAt: "asc" }, select: { id: true, fieldKey: true } } },
  });
  if (!job) notFound();

  return (
    <>
      <Link href="/portal" className="text-sm font-semibold text-pine">Back to your reports</Link>
      <div className="mt-4">
        <JobReport job={job} />
      </div>
    </>
  );
}
