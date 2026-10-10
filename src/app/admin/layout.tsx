import { requireAdmin } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <AppHeader home="/admin" label="Admin" email={user.email} links={[{ href: "/admin/security", label: "Security" }]} />
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </>
  );
}
