"use server";

import { z } from "zod";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { sanitizeAnswers, getField } from "@/lib/job-form";
import { sendJobReadyEmail } from "@/lib/email";
import { jobNumber, photoUrls } from "@/lib/format";

async function getDraftJob(jobId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");
  if (job.status !== "DRAFT") throw new Error("Finalised jobs can't be edited. Reopen it first.");
  return job;
}

// ---------- Create ----------

export type CreateJobState = { error?: string };

const newJobSchema = z.object({
  customerName: z.string().trim().min(1, "Enter the customer's name").max(120),
  customerEmail: z.string().trim().toLowerCase().pipe(z.email("Enter a valid customer email")),
  customerPhone: z.string().trim().max(40).default(""),
  siteAddress: z.string().trim().min(1, "Enter the site address").max(500),
  visitDate: z.string().default(""),
});

export async function createJob(_prev: CreateJobState, formData: FormData): Promise<CreateJobState> {
  await requireAdmin();
  const parsed = newJobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  // One account per email: repeat customers see all their jobs in one place.
  const customer =
    (await prisma.user.findUnique({ where: { email: d.customerEmail } })) ??
    (await prisma.user.create({
      data: { email: d.customerEmail, name: d.customerName, phone: d.customerPhone || null, role: "customer" },
    }));

  const job = await prisma.job.create({
    data: {
      customerId: customer.id,
      siteAddress: d.siteAddress,
      visitDate: d.visitDate ? new Date(d.visitDate) : null,
    },
  });

  redirect(`/admin/jobs/${job.id}`);
}

// ---------- Edit ----------

export async function saveAnswers(jobId: string, answers: unknown) {
  await requireAdmin();
  await getDraftJob(jobId);
  await prisma.job.update({ where: { id: jobId }, data: { answers: sanitizeAnswers(answers) } });
}

const photoSchema = z.object({
  jobId: z.string(),
  fieldKey: z.string(),
  pathname: z.string(),
  thumbPathname: z.string(),
  takenAt: z.number().optional(),
});

export async function addPhoto(input: z.input<typeof photoSchema>) {
  await requireAdmin();
  const p = photoSchema.parse(input);
  await getDraftJob(p.jobId);

  const prefix = `jobs/${p.jobId}/`;
  if (!p.pathname.startsWith(prefix) || !p.thumbPathname.startsWith(prefix)) throw new Error("Invalid photo path");
  if (!getField(p.fieldKey)?.photos) throw new Error("This field doesn't take photos");

  const photo = await prisma.photo.create({
    data: {
      jobId: p.jobId,
      fieldKey: p.fieldKey,
      pathname: p.pathname,
      thumbPathname: p.thumbPathname,
      takenAt: p.takenAt ? new Date(p.takenAt) : null,
    },
  });
  return { id: photo.id, ...photoUrls(photo.id) };
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;
  await getDraftJob(photo.jobId);
  await del([photo.pathname, photo.thumbPathname]);
  await prisma.photo.delete({ where: { id: photoId } });
}

// ---------- Finalise / reopen ----------

export async function finaliseJob(jobId: string) {
  await requireAdmin();
  await getDraftJob(jobId);
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: "FINALISED", finalisedAt: new Date() },
    include: { customer: true },
  });

  try {
    await sendJobReadyEmail(job.customer.email, job.customer.name, jobNumber(job.number));
  } catch (err) {
    console.error("Job finalised but the customer email failed", err);
  }

  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}

export async function reopenJob(jobId: string) {
  await requireAdmin();
  await prisma.job.update({ where: { id: jobId }, data: { status: "DRAFT", finalisedAt: null } });
  revalidatePath(`/admin/jobs/${jobId}`);
  revalidatePath("/admin");
}
