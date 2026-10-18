import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, jobNumber } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { reportTypeLabels } from "@/lib/report/types";
import type { Answers } from "@/lib/report/fields";

export const metadata = { title: "Jobs" };

export default async function AdminHome() {
  const user = await requireAdmin();
  const passkeyCount = await prisma.passkey.count({ where: { userId: user.id } });
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, number: true, propertyAddress: true, answers: true, reportType: true, status: true, copiedFromNumber: true,
      customer: { select: { name: true } },
      _count: { select: { photos: true } },
    },
  });

  return (
    <>
      {passkeyCount === 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border-2 border-signal bg-white p-4">
          <p className="max-w-md text-sm">
            <strong>Add a passkey to protect this account.</strong> Sign in with Face ID or your fingerprint
            instead of an email link.
          </p>
          <Link href="/admin/security" className="btn-primary px-4 py-2 text-sm">Add a passkey</Link>
        </div>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl text-pine">Jobs</h1>
        <Link href="/admin/jobs/new" className="btn-primary">New job</Link>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-6 text-stone">No jobs yet. Create one when you book an inspection.</p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/admin/jobs/${job.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-white">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    <span className="mr-2 text-stone">{jobNumber(job.number)}</span>{job.propertyAddress}
                  </p>
                  <p className="truncate text-sm text-stone">
                    {job.customer.name}, {reportTypeLabels[job.reportType].toLowerCase()}, {formatDate(String((job.answers as Answers).inspectionDate ?? ""))}, {job._count.photos} photos{job.copiedFromNumber ? `, copy of ${jobNumber(job.copiedFromNumber)}` : ""}
                  </p>
                </div>
                <StatusPill status={job.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
