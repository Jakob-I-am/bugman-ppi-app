import type { Prisma } from "@prisma/client";

/** Everything needed to show or edit a report, in display order. */
export const reportInclude = {
  customer: { select: { name: true, email: true, phone: true } },
  sections: {
    orderBy: { position: "asc" },
    include: {
      photos: { orderBy: { createdAt: "asc" }, select: { id: true } },
      findings: {
        orderBy: { position: "asc" },
        include: { photos: { orderBy: { createdAt: "asc" }, select: { id: true } } },
      },
    },
  },
} satisfies Prisma.JobInclude;

export type ReportJob = Prisma.JobGetPayload<{ include: typeof reportInclude }>;
