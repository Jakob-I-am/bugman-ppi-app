import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role === "admin") redirect("/admin");
  return (
    <>
      <AppHeader home="/portal" label="Signed in as" email={user.email} />
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </>
  );
}
