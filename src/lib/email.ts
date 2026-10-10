import { Resend } from "resend";
import { site } from "./site";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`;

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string };

async function send(mail: Mail) {
  if (!resend) {
    // Local development without a Resend key: print the email instead.
    console.log(`\n--- email to ${mail.to} ---\n${mail.subject}\n\n${mail.text}\n---------------\n`);
    return;
  }
  const { error } = await resend.emails.send({ from, ...mail });
  if (error) throw new Error(`Email failed: ${error.message}`);
}

function wrap(body: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1C2321;line-height:1.5">
${body}
<p style="color:#6B7570;font-size:13px;margin-top:32px">${escapeHtml(site.name)} · ${escapeHtml(site.phone)}</p>
</div>`;
}

function button(href: string, label: string) {
  return `<p><a href="${escapeHtml(href)}" style="display:inline-block;background:#1F3D2B;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a></p>`;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  await send({
    to: email,
    subject: `Your sign-in link for ${site.name}`,
    text: `Sign in to view your job reports:\n${url}\n\nThis link expires in 15 minutes. If you didn't request it, ignore this email.`,
    html: wrap(
      `<p>Use the button below to sign in and view your job reports.</p>
${button(url, "Sign in")}
<p style="font-size:13px;color:#6B7570">This link expires in 15 minutes. If you didn't request it, you can ignore this email.</p>`,
    ),
  });
}

export async function sendEnquiryEmail(e: {
  name: string; email: string; phone: string; postcode: string; pest: string; message: string;
}) {
  const rows: [string, string][] = [
    ["Name", e.name], ["Phone", e.phone], ["Email", e.email],
    ["Postcode", e.postcode], ["Pest", e.pest], ["Message", e.message],
  ];
  await send({
    to: process.env.BUSINESS_EMAIL ?? site.email,
    replyTo: e.email,
    subject: `New enquiry: ${e.pest} (${e.postcode})`,
    text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
    html: wrap(
      `<h2 style="margin:0 0 16px">New website enquiry</h2>
<table style="border-collapse:collapse">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 16px 6px 0;color:#6B7570;vertical-align:top">${k}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
        )
        .join("")}</table>
<p style="font-size:13px;color:#6B7570">Reply to this email to respond to ${escapeHtml(e.name)} directly.</p>`,
    ),
  });
}

export async function sendJobReadyEmail(email: string, name: string, jobNumber: string) {
  const url = `${site.url}/login`;
  await send({
    to: email,
    subject: `Your report for job ${jobNumber} is ready`,
    text: `Hi ${name},\n\nYour report for job ${jobNumber} is ready, including photos from the visit. Sign in with this email address to view it:\n${url}`,
    html: wrap(
      `<p>Hi ${escapeHtml(name)},</p>
<p>Your report for job ${escapeHtml(jobNumber)} is ready, including photos from the visit. Sign in with this email address to view it.</p>
${button(url, "View your report")}`,
    ),
  });
}
