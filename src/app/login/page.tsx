import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { site } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (session) redirect(session.user.role === "admin" ? "/admin" : "/portal");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col bg-pine px-5 py-8">
      <Link href="/" className="display mx-auto text-2xl text-white">{site.name}</Link>
      <div className="m-auto w-full max-w-sm rounded-lg bg-white p-7">
        <h1 className="display text-4xl text-pine">Sign in</h1>
        <p className="mb-6 mt-2 text-stone">
          Enter the email address you gave us. We&apos;ll send you a link to view your inspection reports.
        </p>
        {error && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            That sign-in link has expired or was already used. Request a new one below.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
