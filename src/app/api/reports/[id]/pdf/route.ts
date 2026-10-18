import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportInclude } from "@/lib/report/load";
import { ReportPdf } from "@/lib/report/pdf";
import { COVER_KEY } from "@/lib/report/frame";

export const runtime = "nodejs";
export const maxDuration = 60;

async function fetchImage(pathname: string) {
  const result = await get(pathname, { access: "private" });
  if (!result?.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

/** Downloads the report as a PDF. Same access rules as the report page. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Not signed in", { status: 401 });

  const job = await prisma.job.findUnique({ where: { id }, include: reportInclude });
  const isAdmin = session.user.role === "admin";
  const isOwner = job?.customerId === session.user.id && job?.status === "FINALISED";
  if (!job || (!isAdmin && !isOwner)) return new Response("Not found", { status: 404 });

  // Thumbnails (480 px) are sharp enough for printed photo grids and keep the PDF small.
  const photos = [...job.photos, ...job.sections.flatMap((s) => [...s.photos, ...s.findings.flatMap((f) => f.photos)])];
  const images = new Map<string, Buffer>();
  for (let i = 0; i < photos.length; i += 8) {
    await Promise.all(
      photos.slice(i, i + 8).map(async (p) => {
        try {
          const buf = await fetchImage(p.thumbPathname);
          if (buf) images.set(p.id, buf);
        } catch (err) {
          console.error("PDF: couldn't load photo", p.id, err);
        }
      }),
    );
  }

  // The cover photo is printed large, so use the full-size image for that one.
  const cover = job.photos.find((p) => p.fieldKey === COVER_KEY);
  let heroImage: Buffer | null = null;
  if (cover) {
    try {
      heroImage = await fetchImage(cover.pathname);
    } catch (err) {
      console.error("PDF: couldn't load cover photo", err);
    }
  }

  const element = createElement(ReportPdf, { job, images, heroImage, draft: job.status !== "FINALISED" });
  const pdf = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0]);

  const name = `Inspection report - ${job.propertyAddress}`.replace(/[^\w\s,.-]/g, "").replace(/\s+/g, " ").slice(0, 120);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
