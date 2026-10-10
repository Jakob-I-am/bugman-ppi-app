import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Streams a photo from the private Blob store after checking access:
 * the admin can see everything, a customer only photos on their own finalised jobs.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return new Response("Not signed in", { status: 401 });

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { job: { select: { customerId: true, status: true } } },
  });

  const isAdmin = session.user.role === "admin";
  const isOwner =
    photo?.job.customerId === session.user.id && photo?.job.status === "FINALISED";

  // 404 rather than 403 so other customers can't tell a photo exists.
  if (!photo || (!isAdmin && !isOwner)) return new Response("Not found", { status: 404 });

  const size = new URL(request.url).searchParams.get("size");
  const result = await get(size === "thumb" ? photo.thumbPathname : photo.pathname, {
    access: "private",
  });
  if (!result?.stream) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "image/jpeg",
      // "private" keeps shared caches from storing it; the browser can reuse it.
      "Cache-Control": "private, max-age=86400, immutable",
    },
  });
}
