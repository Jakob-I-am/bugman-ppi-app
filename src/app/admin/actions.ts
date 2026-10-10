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
import { frameFields } from "@/lib/report/frame";
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

async function deleteBlobs(photos: { pathname: string; thumbPathname: string }[]) {
  const paths = photos.flatMap((p) => [p.pathname, p.thumbPathname]);
  if (paths.length) await del(paths);
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

  const customer =
    (await prisma.user.findUnique({ where: { email: d.customerEmail } })) ??
    (await prisma.user.create({
      data: { email: d.customerEmail, name: d.customerName, phone: d.customerPhone || null, role: "customer" },
    }));

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
  } else {
    const f = await prisma.finding.findUnique({ where: { id: p.target.findingId }, include: { section: true } });
    if (f?.section.jobId !== p.jobId) throw new Error("Finding doesn't belong to this job");
    link.findingId = f.id;
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
