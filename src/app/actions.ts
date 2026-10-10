"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEnquiryEmail } from "@/lib/email";

export type EnquiryState = { status: "idle" | "sent" | "error"; message?: string };

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  phone: z.string().trim().min(6, "Enter a phone number").max(40),
  propertyAddress: z.string().trim().min(3, "Enter the property address").max(300),
  service: z.string().trim().min(1, "Choose an inspection type").max(60),
  neededBy: z.string().trim().max(20).default(""),
  message: z.string().trim().max(3000).default(""),
});

export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Honeypot: real people never see or fill this field.
  if (formData.get("website")) return { status: "sent" };

  const parsed = enquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the form and try again" };
  }

  // Save first so an enquiry is never lost if email delivery fails.
  await prisma.enquiry.create({ data: parsed.data });

  try {
    await sendEnquiryEmail(parsed.data);
  } catch (err) {
    console.error(err);
  }

  return { status: "sent" };
}
