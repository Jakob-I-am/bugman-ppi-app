import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, jobNumber } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata = { title: "Your reports" };

export default async function PortalHome() {
  const user = await requireUser();
  // Customers only ever see their own finalised jobs.
  const jobs = await prisma.job.findMany({
    where: { customerId: user.id, status: "FINALISED" },
    orderBy: { visitDate: "desc" },
    select: { id: true, number: true, siteAddress: true, visitDate: true, _count: { select: { photos: true } } },
  });

  return (
    <>
      <h1 className="display text-5xl text-pine">Your reports</h1>
      {jobs.length === 0 ? (
        <p className="mt-4 max-w-md text-stone">
          No reports yet. We&apos;ll email you as soon as your visit report is ready. Questions? Call us on{" "}
          <a href={site.phoneHref} className="font-semibold text-pine underline">{site.phone}</a>.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/portal/jobs/${job.id}`} className="flex items-center justify-between gap-4 py-4 hover:bg-white">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{job.siteAddress}</p>
                  <p className="text-sm text-stone">
                    Job {jobNumber(job.number)}, visited {formatDate(job.visitDate)}, {job._count.photos} photos
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-pine">View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
