import type { Prisma } from "@prisma/client";

/** Everything needed to show or edit a report, in display order. */
export const reportInclude = {
  customer: { select: { name: true, email: true, phone: true } },
  /** Photos on the job itself: cover photos and frame fields like slab edges. */
  photos: {
    where: { sectionId: null, findingId: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, fieldKey: true, pathname: true, thumbPathname: true },
  },
  sections: {
    orderBy: { position: "asc" },
    include: {
      photos: { orderBy: { createdAt: "asc" }, select: { id: true, thumbPathname: true } },
      findings: {
        orderBy: { position: "asc" },
        include: { photos: { orderBy: { createdAt: "asc" }, select: { id: true, thumbPathname: true } } },
      },
    },
  },
} satisfies Prisma.JobInclude;

export type ReportJob = Prisma.JobGetPayload<{ include: typeof reportInclude }>;
