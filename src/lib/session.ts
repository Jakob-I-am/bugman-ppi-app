import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Current session, de-duplicated within a single request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Use in every protected page and server action, not just layouts. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/portal");
  return user;
}
