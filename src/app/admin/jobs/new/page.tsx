import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { NewJobForm } from "./NewJobForm";

export const metadata = { title: "New job" };

export default async function NewJobPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin" className="text-sm font-semibold text-pine">Back to jobs</Link>
      <h1 className="display mt-4 text-5xl text-pine">New job</h1>
      <p className="mt-2 max-w-md text-stone">
        The client signs in with their email to see the report once you finalise it.
        Returning clients are matched by email.
      </p>
      <NewJobForm />
    </>
  );
}
