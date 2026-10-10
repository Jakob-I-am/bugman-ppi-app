import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Issues short-lived tokens so the browser can upload photos straight to the
 * private Blob store. Only the admin can upload, only into a draft job's folder.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const session = await auth.api.getSession({ headers: request.headers });
        if (session?.user.role !== "admin") throw new Error("Not authorised");

        const { jobId } = JSON.parse(clientPayload ?? "{}") as { jobId?: string };
        if (!jobId || !pathname.startsWith(`jobs/${jobId}/`)) throw new Error("Invalid upload path");

        const job = await prisma.job.findUnique({ where: { id: jobId }, select: { status: true } });
        if (!job || job.status !== "DRAFT") throw new Error("This job can't be edited");

        return {
          allowedContentTypes: ["image/jpeg"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: false, // paths already contain a UUID
        };
      },
      // Photos are recorded by the addPhoto server action once the upload finishes,
      // which also works on localhost where this webhook can't reach you.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
