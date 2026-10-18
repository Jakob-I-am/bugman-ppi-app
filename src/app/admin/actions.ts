"use server";

import { z } from "zod";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { FindingCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { sendJobReadyEmail } from "@/lib/email";
import { jobNumber, photoUrls } from "@/lib/format";
import { sanitizeAnswers } from "@/lib/report/fields";
import { frameFields, jobPhotoKeys } from "@/lib/report/frame";
import { defaultSections, getTemplate, sectionFields } from "@/lib/report/sections";
import { categories, categoryOrder } from "@/lib/report/findings";
import { reportInclude } from "@/lib/report/load";
import { reportProblems } from "@/lib/report/validate";

// ---------- Guards: every write checks the job is a draft ----------

async function draftJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");
  if (job.status !== "DRAFT") throw new Error("This report is finalised. Reopen it to make changes.");
  return job;
}

async function draftSection(sectionId: string) {
  const section = await prisma.reportSection.findUnique({ where: { id: sectionId } });
  if (!section) throw new Error("Section not found");
  await draftJob(section.jobId);
  return section;
}

async function draftFinding(findingId: string) {
  const finding = await prisma.finding.findUnique({ where: { id: findingId }, include: { section: true } });
  if (!finding) throw new Error("Finding not found");
  await draftJob(finding.section.jobId);
  return finding;
}

/**
 * Deletes photo files from Blob once no photo row uses them any more.
 * Duplicated reports share the original's files, so a file is only removed
 * when the last report using it lets go. Call after deleting the rows.
 */
async function deleteBlobs(photos: { pathname: string; thumbPathname: string }[]) {
  const paths = photos.flatMap((p) => [p.pathname, p.thumbPathname]);
  if (!paths.length) return;
  const stillUsed = await prisma.photo.findMany({
    where: { OR: [{ pathname: { in: paths } }, { thumbPathname: { in: paths } }] },
    select: { pathname: true, thumbPathname: true },
  });
  const keep = new Set(stillUsed.flatMap((p) => [p.pathname, p.thumbPathname]));
  const unused = paths.filter((p) => !keep.has(p));
  if (unused.length) await del(unused);
}

async function findOrCreateCustomer(email: string, name: string, phone: string) {
  return (
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({ data: { email, name, phone: phone || null, role: "customer" } }))
  );
}

// ---------- Create ----------

export type CreateJobState = { error?: string };

const newJobSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the client's name").max(120),
  customerEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid client email")),
  customerPhone: z.string().trim().max(40).default(""),
  propertyAddress: z.string().trim().min(1, "Enter the property address").max(500),
  reportType: z.enum(["BUILDING_AND_PEST", "BUILDING", "TIMBER_PEST"]),
  inspectionDate: z.string().default(""),
  agreementRef: z.string().trim().max(100).default(""),
  standardAreas: z.string().optional(),
});

export async function createJob(_prev: CreateJobState, formData: FormData): Promise<CreateJobState> {
  await requireAdmin();
  const parsed = newJobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const customer = await findOrCreateCustomer(d.customerEmail, d.customerName, d.customerPhone);

  const starting = d.standardAreas ? defaultSections : [];
  const job = await prisma.job.create({
    data: {
      customerId: customer.id,
      propertyAddress: d.propertyAddress,
      reportType: d.reportType,
      answers: { inspectionDate: d.inspectionDate, agreementRef: d.agreementRef },
      sections: {
        create: starting.map((s, i) => ({
          templateKey: s.key,
          title: s.title ?? getTemplate(s.key).defaultTitle,
          position: i,
        })),
      },
    },
  });

  redirect(`/admin/jobs/${job.id}`);
}

// ---------- Duplicate for another client ----------

export type DuplicateState = { error?: string };

const duplicateSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the client's name").max(120),
  customerEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid client email")),
  customerPhone: z.string().trim().max(40).default(""),
  agreementRef: z.string().trim().min(1, "Enter this client's agreement reference").max(100),
  agreementDate: z.string().min(1, "Enter the date this client accepted the agreement"),
});

/**
 * Copies a report (details, areas, findings and photos) to a new draft job for a
 * different client. Photo files are shared, not copied, so it costs no storage.
 */
export async function duplicateJob(sourceId: string, _prev: DuplicateState, formData: FormData): Promise<DuplicateState> {
  await requireAdmin();
  const parsed = duplicateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const source = await prisma.job.findUnique({
    where: { id: sourceId },
    include: {
      photos: { where: { sectionId: null, findingId: null } },
      sections: {
        orderBy: { position: "asc" },
        include: { photos: true, findings: { orderBy: { position: "asc" }, include: { photos: true } } },
      },
    },
  });
  if (!source) return { error: "Original job not found" };

  const customer = await findOrCreateCustomer(d.customerEmail, d.customerName, d.customerPhone);
  const answers = { ...((source.answers ?? {}) as Record<string, unknown>), agreementRef: d.agreementRef, agreementDate: d.agreementDate };

  const newId = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        customerId: customer.id,
        propertyAddress: source.propertyAddress,
        reportType: source.reportType,
        answers: answers as Prisma.InputJsonValue,
        copiedFromNumber: source.number,
      },
    });
    const photoRow = (p: { pathname: string; thumbPathname: string; takenAt: Date | null }) => ({
      jobId: job.id, pathname: p.pathname, thumbPathname: p.thumbPathname, takenAt: p.takenAt,
    });
    if (source.photos.length) {
      await tx.photo.createMany({ data: source.photos.map((p) => ({ ...photoRow(p), fieldKey: p.fieldKey })) });
    }
    for (const s of source.sections) {
      const section = await tx.reportSection.create({
        data: { jobId: job.id, templateKey: s.templateKey, title: s.title, position: s.position, answers: s.answers as Prisma.InputJsonValue },
      });
      if (s.photos.length) await tx.photo.createMany({ data: s.photos.map((p) => ({ ...photoRow(p), sectionId: section.id })) });
      for (const f of s.findings) {
        const finding = await tx.finding.create({
          data: {
            sectionId: section.id, category: f.category, element: f.element, location: f.location,
            description: f.description, recommendation: f.recommendation, detail: f.detail, position: f.position,
          },
        });
        if (f.photos.length) await tx.photo.createMany({ data: f.photos.map((p) => ({ ...photoRow(p), findingId: finding.id })) });
      }
    }
    return job.id;
  }, { timeout: 30_000 });

  revalidatePath("/admin");
  redirect(`/admin/jobs/${newId}`);
}

// ---------- Fixed report parts ----------

export async function saveFrameAnswers(jobId: string, answers: unknown) {
  await requireAdmin();
  const job = await draftJob(jobId);
  await prisma.job.update({
    where: { id: jobId },
    data: { answers: sanitizeAnswers(frameFields(job.reportType), answers) },
  });
}

// ---------- Sections ----------

export async function addSection(jobId: string, templateKey: string, title: string) {
  await requireAdmin();
  await draftJob(jobId);
  const template = getTemplate(templateKey);
  const last = await prisma.reportSection.findFirst({ where: { jobId }, orderBy: { position: "desc" } });
  const section = await prisma.reportSection.create({
    data: {
      jobId,
      templateKey: template.key,
      title: title.trim().slice(0, 100) || template.defaultTitle,
      position: (last?.position ?? -1) + 1,
    },
  });
  return { id: section.id, templateKey: section.templateKey, title: section.title, answers: {}, photos: [], findings: [] };
}

export async function renameSection(sectionId: string, title: string) {
  await requireAdmin();
  await draftSection(sectionId);
  const clean = title.trim().slice(0, 100);
  if (clean) await prisma.reportSection.update({ where: { id: sectionId }, data: { title: clean } });
}

export async function saveSectionAnswers(sectionId: string, answers: unknown) {
  await requireAdmin();
  const section = await draftSection(sectionId);
  await prisma.reportSection.update({
    where: { id: sectionId },
    data: { answers: sanitizeAnswers(sectionFields(section.templateKey), answers) },
  });
}

export async function moveSection(sectionId: string, direction: "up" | "down") {
  await requireAdmin();
  const section = await draftSection(sectionId);
  const neighbour = await prisma.reportSection.findFirst({
    where: {
      jobId: section.jobId,
      position: direction === "up" ? { lt: section.position } : { gt: section.position },
    },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;
  await prisma.$transaction([
    prisma.reportSection.update({ where: { id: section.id }, data: { position: neighbour.position } }),
    prisma.reportSection.update({ where: { id: neighbour.id }, data: { position: section.position } }),
  ]);
}

export async function deleteSection(sectionId: string) {
  await requireAdmin();
  await draftSection(sectionId);
  const photos = await prisma.photo.findMany({
    where: { OR: [{ sectionId }, { finding: { sectionId } }] },
    select: { pathname: true, thumbPathname: true },
  });
  await prisma.reportSection.delete({ where: { id: sectionId } }); // cascades findings and photo rows
  await deleteBlobs(photos);
}

// ---------- Findings ----------

const findingSchema = z.object({
  element: z.string().max(200).default(""),
  location: z.string().max(300).default(""),
  description: z.string().max(8000).default(""),
  recommendation: z.string().max(8000).default(""),
  detail: z.string().max(100).default(""),
});

export async function addFinding(sectionId: string, category: FindingCategory) {
  await requireAdmin();
  if (!categoryOrder.includes(category)) throw new Error("Unknown finding type");
  await draftSection(sectionId);
  const last = await prisma.finding.findFirst({ where: { sectionId }, orderBy: { position: "desc" } });
  const f = await prisma.finding.create({
    data: { sectionId, category, position: (last?.position ?? -1) + 1 },
  });
  return { id: f.id, category: f.category, element: "", location: "", description: "", recommendation: "", detail: "", photos: [] };
}

export async function saveFinding(findingId: string, input: unknown) {
  await requireAdmin();
  const finding = await draftFinding(findingId);
  const data = findingSchema.parse(input);
  const options = categories[finding.category].detail?.options;
  if (data.detail && !options?.includes(data.detail)) data.detail = "";
  await prisma.finding.update({ where: { id: findingId }, data });
}

export async function deleteFinding(findingId: string) {
  await requireAdmin();
  await draftFinding(findingId);
  const photos = await prisma.photo.findMany({ where: { findingId }, select: { pathname: true, thumbPathname: true } });
  await prisma.finding.delete({ where: { id: findingId } });
  await deleteBlobs(photos);
}

// ---------- Photos ----------

const photoSchema = z.object({
  jobId: z.string(),
  target: z.union([
    z.object({ kind: z.literal("section"), sectionId: z.string() }),
    z.object({ kind: z.literal("finding"), findingId: z.string() }),
    z.object({ kind: z.literal("job"), fieldKey: z.string() }),
  ]),
  pathname: z.string(),
  thumbPathname: z.string(),
  takenAt: z.number().optional(),
});

export type PhotoTarget = z.infer<typeof photoSchema>["target"];

export async function addPhoto(input: z.input<typeof photoSchema>) {
  await requireAdmin();
  const p = photoSchema.parse(input);
  await draftJob(p.jobId);

  const prefix = `jobs/${p.jobId}/`;
  if (!p.pathname.startsWith(prefix) || !p.thumbPathname.startsWith(prefix)) throw new Error("Invalid photo path");

  const link: Prisma.PhotoUncheckedCreateInput = {
    jobId: p.jobId,
    pathname: p.pathname,
    thumbPathname: p.thumbPathname,
    takenAt: p.takenAt ? new Date(p.takenAt) : null,
  };
  if (p.target.kind === "section") {
    const s = await prisma.reportSection.findUnique({ where: { id: p.target.sectionId } });
    if (s?.jobId !== p.jobId) throw new Error("Section doesn't belong to this job");
    link.sectionId = s.id;
  } else if (p.target.kind === "finding") {
    const f = await prisma.finding.findUnique({ where: { id: p.target.findingId }, include: { section: true } });
    if (f?.section.jobId !== p.jobId) throw new Error("Finding doesn't belong to this job");
    link.findingId = f.id;
  } else {
    if (!jobPhotoKeys.includes(p.target.fieldKey)) throw new Error("Photos can't be added there");
    link.fieldKey = p.target.fieldKey;
  }

  const photo = await prisma.photo.create({ data: link });
  return { id: photo.id, ...photoUrls(photo.id) };
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;
  await draftJob(photo.jobId);
  await prisma.photo.delete({ where: { id: photoId } });
  await deleteBlobs([photo]);
}

// ---------- Finalise / reopen ----------

export type FinaliseState = { problems?: string[] };

export async function finaliseJob(jobId: string, _prev: FinaliseState, _form: FormData): Promise<FinaliseState> {
  await requireAdmin();
  await draftJob(jobId);
  const full = await prisma.job.findUniqueOrThrow({ where: { id: jobId }, include: reportInclude });
  const problems = reportProblems(full);
  if (problems.length) return { problems };

  await prisma.job.update({ where: { id: jobId }, data: { status: "FINALISED", finalisedAt: new Date() } });
  try {
    await sendJobReadyEmail(full.customer.email, full.customer.name, jobNumber(full.number), full.propertyAddress);
  } catch (err) {
    console.error("Report finalised but the client email failed", err);
  }
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
  return {};
}

export async function reopenJob(jobId: string) {
  await requireAdmin();
  await prisma.job.update({ where: { id: jobId }, data: { status: "DRAFT", finalisedAt: null } });
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}

/** Exposed so the editor can show the checklist live. */
export async function checkReport(jobId: string) {
  await requireAdmin();
  const full = await prisma.job.findUniqueOrThrow({ where: { id: jobId }, include: reportInclude });
  return reportProblems(full);
}
